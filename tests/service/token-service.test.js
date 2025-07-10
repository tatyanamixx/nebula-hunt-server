const tokenService = require('../../service/token-service');
const { Token } = require('../../models/models');
const ApiError = require('../../exceptions/api-error');
const jwt = require('jsonwebtoken');
const sequelize = require('../../db');

// Мокаем jwt
jest.mock('jsonwebtoken');

// Мокаем модели
jest.mock('../../models/models', () => {
	const mockFindOne = jest.fn();
	const mockCreate = jest.fn();
	const mockDestroy = jest.fn();
	const mockSave = jest.fn().mockResolvedValue(true);

	return {
		Token: {
			findOne: mockFindOne,
			create: mockCreate,
			destroy: mockDestroy,
		},
	};
});

// Мокаем транзакции
jest.mock('../../db', () => {
	// Создаем мок транзакции
	const mockTransaction = {
		commit: jest.fn().mockResolvedValue(true),
		rollback: jest.fn().mockResolvedValue(true),
	};

	// Мокируем sequelize с методом transaction
	return {
		transaction: jest.fn().mockResolvedValue(mockTransaction),
	};
});

describe('TokenService', () => {
	// Сохраняем оригинальные переменные окружения
	const originalEnv = process.env;

	beforeEach(() => {
		// Очищаем моки перед каждым тестом
		jest.clearAllMocks();

		// Устанавливаем переменные окружения для тестов
		process.env = {
			...originalEnv,
			JWT_ACCESS_SECRET: 'test-access-secret',
			JWT_REFRESH_SECRET: 'test-refresh-secret',
		};
	});

	afterAll(() => {
		// Восстанавливаем оригинальные переменные окружения
		process.env = originalEnv;
	});

	describe('generateTokens', () => {
		it('should generate access and refresh tokens', () => {
			// Подготавливаем тестовые данные
			const payload = { id: 123, username: 'testuser' };

			// Мокаем jwt.sign
			jwt.sign
				.mockReturnValueOnce('mock-access-token')
				.mockReturnValueOnce('mock-refresh-token');

			// Вызываем тестируемый метод
			const tokens = tokenService.generateTokens(payload);

			// Проверяем, что jwt.sign был вызван с правильными параметрами
			expect(jwt.sign).toHaveBeenCalledTimes(2);
			expect(jwt.sign).toHaveBeenNthCalledWith(
				1,
				payload,
				'test-access-secret',
				{ expiresIn: '30m' }
			);
			expect(jwt.sign).toHaveBeenNthCalledWith(
				2,
				payload,
				'test-refresh-secret',
				{ expiresIn: '7d' }
			);

			// Проверяем результат
			expect(tokens).toEqual({
				accessToken: 'mock-access-token',
				refreshToken: 'mock-refresh-token',
			});
		});

		it('should throw error when jwt.sign fails', () => {
			// Подготавливаем тестовые данные
			const payload = { id: 123, username: 'testuser' };

			// Мокаем jwt.sign чтобы он выбросил ошибку
			jwt.sign.mockImplementation(() => {
				throw new Error('JWT sign error');
			});

			// Проверяем, что метод выбрасывает ошибку
			expect(() => tokenService.generateTokens(payload)).toThrow(
				ApiError
			);
		});
	});

	describe('validateAccessToken', () => {
		it('should return user data when token is valid', () => {
			// Подготавливаем тестовые данные
			const token = 'valid-access-token';
			const userData = { id: 123, username: 'testuser' };

			// Мокаем jwt.verify
			jwt.verify.mockReturnValue(userData);

			// Вызываем тестируемый метод
			const result = tokenService.validateAccessToken(token);

			// Проверяем, что jwt.verify был вызван с правильными параметрами
			expect(jwt.verify).toHaveBeenCalledWith(
				token,
				'test-access-secret'
			);

			// Проверяем результат
			expect(result).toEqual(userData);
		});

		it('should return null when token is invalid', () => {
			// Подготавливаем тестовые данные
			const token = 'invalid-access-token';

			// Мокаем jwt.verify чтобы он выбросил ошибку
			jwt.verify.mockImplementation(() => {
				throw new Error('Invalid token');
			});

			// Вызываем тестируемый метод
			const result = tokenService.validateAccessToken(token);

			// Проверяем результат
			expect(result).toBeNull();
		});
	});

	describe('validateRefreshToken', () => {
		it('should return user data when token is valid', () => {
			// Подготавливаем тестовые данные
			const token = 'valid-refresh-token';
			const userData = { id: 123, username: 'testuser' };

			// Мокаем jwt.verify
			jwt.verify.mockReturnValue(userData);

			// Вызываем тестируемый метод
			const result = tokenService.validateRefreshToken(token);

			// Проверяем, что jwt.verify был вызван с правильными параметрами
			expect(jwt.verify).toHaveBeenCalledWith(
				token,
				'test-refresh-secret'
			);

			// Проверяем результат
			expect(result).toEqual(userData);
		});

		it('should return null when token is invalid', () => {
			// Подготавливаем тестовые данные
			const token = 'invalid-refresh-token';

			// Мокаем jwt.verify чтобы он выбросил ошибку
			jwt.verify.mockImplementation(() => {
				throw new Error('Invalid token');
			});

			// Вызываем тестируемый метод
			const result = tokenService.validateRefreshToken(token);

			// Проверяем результат
			expect(result).toBeNull();
		});
	});

	describe('saveToken', () => {
		it('should update existing token', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const refreshToken = 'new-refresh-token';
			const existingToken = {
				userId,
				refreshToken: 'old-refresh-token',
				save: jest.fn().mockResolvedValue(true),
			};

			// Мокаем Token.findOne
			Token.findOne.mockResolvedValue(existingToken);

			// Вызываем тестируемый метод
			const result = await tokenService.saveToken(userId, refreshToken);

			// Проверяем, что Token.findOne был вызван с правильными параметрами
			expect(Token.findOne).toHaveBeenCalledWith({
				where: { userId },
				transaction: expect.anything(),
			});

			// Проверяем, что токен был обновлен
			expect(existingToken.refreshToken).toBe(refreshToken);
			expect(existingToken.save).toHaveBeenCalled();

			// Проверяем, что транзакция была зафиксирована
			expect(sequelize.transaction).toHaveBeenCalled();
			const transaction = await sequelize.transaction();
			expect(transaction.commit).toHaveBeenCalled();

			// Проверяем результат
			expect(result).toBe(existingToken);
		});

		it('should create new token if not exists', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const refreshToken = 'new-refresh-token';
			const newToken = { userId, refreshToken };

			// Мокаем Token.findOne и Token.create
			Token.findOne.mockResolvedValue(null);
			Token.create.mockResolvedValue(newToken);

			// Вызываем тестируемый метод
			const result = await tokenService.saveToken(userId, refreshToken);

			// Проверяем, что Token.findOne был вызван с правильными параметрами
			expect(Token.findOne).toHaveBeenCalledWith({
				where: { userId },
				transaction: expect.anything(),
			});

			// Проверяем, что Token.create был вызван с правильными параметрами
			expect(Token.create).toHaveBeenCalledWith(
				{ userId, refreshToken },
				{ transaction: expect.anything() }
			);

			// Проверяем, что транзакция была зафиксирована
			expect(sequelize.transaction).toHaveBeenCalled();
			const transaction = await sequelize.transaction();
			expect(transaction.commit).toHaveBeenCalled();

			// Проверяем результат
			expect(result).toBe(newToken);
		});

		it('should handle error and rollback transaction', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const refreshToken = 'new-refresh-token';

			// Мокаем Token.findOne чтобы он выбросил ошибку
			Token.findOne.mockRejectedValue(new Error('Database error'));

			// Проверяем, что метод выбрасывает ошибку
			await expect(
				tokenService.saveToken(userId, refreshToken)
			).rejects.toThrow(ApiError);

			// Проверяем, что транзакция была отменена
			expect(sequelize.transaction).toHaveBeenCalled();
			const transaction = await sequelize.transaction();
			expect(transaction.rollback).toHaveBeenCalled();
		});
	});

	describe('removeToken', () => {
		it('should remove token by refresh token', async () => {
			// Подготавливаем тестовые данные
			const refreshToken = 'refresh-token-to-remove';

			// Мокаем Token.destroy
			Token.destroy.mockResolvedValue(1);

			// Вызываем тестируемый метод
			const result = await tokenService.removeToken(refreshToken);

			// Проверяем, что Token.destroy был вызван с правильными параметрами
			expect(Token.destroy).toHaveBeenCalledWith({
				where: { refreshToken },
				transaction: expect.anything(),
			});

			// Проверяем, что транзакция была зафиксирована
			expect(sequelize.transaction).toHaveBeenCalled();
			const transaction = await sequelize.transaction();
			expect(transaction.commit).toHaveBeenCalled();

			// Проверяем результат
			expect(result).toBe(1);
		});

		it('should handle error and rollback transaction', async () => {
			// Подготавливаем тестовые данные
			const refreshToken = 'refresh-token-to-remove';

			// Мокаем Token.destroy чтобы он выбросил ошибку
			Token.destroy.mockRejectedValue(new Error('Database error'));

			// Проверяем, что метод выбрасывает ошибку
			await expect(
				tokenService.removeToken(refreshToken)
			).rejects.toThrow(ApiError);

			// Проверяем, что транзакция была отменена
			expect(sequelize.transaction).toHaveBeenCalled();
			const transaction = await sequelize.transaction();
			expect(transaction.rollback).toHaveBeenCalled();
		});
	});

	describe('findToken', () => {
		it('should find token by refresh token', async () => {
			// Подготавливаем тестовые данные
			const refreshToken = 'refresh-token-to-find';
			const tokenData = { userId: 123, refreshToken };

			// Мокаем Token.findOne
			Token.findOne.mockResolvedValue(tokenData);

			// Вызываем тестируемый метод
			const result = await tokenService.findToken(refreshToken);

			// Проверяем, что Token.findOne был вызван с правильными параметрами
			expect(Token.findOne).toHaveBeenCalledWith({
				where: { refreshToken },
				transaction: expect.anything(),
			});

			// Проверяем, что транзакция была зафиксирована
			expect(sequelize.transaction).toHaveBeenCalled();
			const transaction = await sequelize.transaction();
			expect(transaction.commit).toHaveBeenCalled();

			// Проверяем результат
			expect(result).toBe(tokenData);
		});

		it('should handle error and rollback transaction', async () => {
			// Подготавливаем тестовые данные
			const refreshToken = 'refresh-token-to-find';

			// Мокаем Token.findOne чтобы он выбросил ошибку
			Token.findOne.mockRejectedValue(new Error('Database error'));

			// Проверяем, что метод выбрасывает ошибку
			await expect(tokenService.findToken(refreshToken)).rejects.toThrow(
				ApiError
			);

			// Проверяем, что транзакция была отменена
			expect(sequelize.transaction).toHaveBeenCalled();
			const transaction = await sequelize.transaction();
			expect(transaction.rollback).toHaveBeenCalled();
		});
	});
});
