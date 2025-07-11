const galaxyService = require('../../service/galaxy-service');
const { User, Galaxy } = require('../../models/models');
const ApiError = require('../../exceptions/api-error');
const sequelize = require('../../db');
const { Op } = require('sequelize');
const loggerService = require('../../service/logger-service');

// Мокаем модели и зависимости
jest.mock('../../models/models', () => ({
	User: {
		findOne: jest.fn(),
		findByPk: jest.fn(),
	},
	Galaxy: {
		findAll: jest.fn(),
		findOne: jest.fn(),
		findByPk: jest.fn(),
		findOrCreate: jest.fn(),
		count: jest.fn(),
		bulkCreate: jest.fn(),
		create: jest.fn(),
	},
}));

jest.mock('../../db', () => ({
	transaction: jest.fn(),
	random: jest.fn(),
}));

jest.mock('../../service/logger-service', () => ({
	info: jest.fn(),
	error: jest.fn(),
}));

describe('GalaxyService', () => {
	// Мок для транзакции
	const mockTransaction = {
		commit: jest.fn().mockResolvedValue(undefined),
		rollback: jest.fn().mockResolvedValue(undefined),
	};

	beforeEach(() => {
		jest.clearAllMocks();
		sequelize.transaction.mockResolvedValue(mockTransaction);
	});

	describe('getUserGalaxies', () => {
		it('should return user galaxies', async () => {
			// Mock данных
			const userId = 12345;
			const galaxiesData = [
				{
					id: 1,
					userId,
					seed: 'seed1',
					starCurrent: 500,
					toJSON: jest.fn().mockReturnValue({
						id: 1,
						userId,
						seed: 'seed1',
						starCurrent: 500,
					}),
				},
				{
					id: 2,
					userId,
					seed: 'seed2',
					starCurrent: 300,
					toJSON: jest.fn().mockReturnValue({
						id: 2,
						userId,
						seed: 'seed2',
						starCurrent: 300,
					}),
				},
			];

			Galaxy.findAll.mockResolvedValue(galaxiesData);

			// Вызываем тестируемый метод
			const result = await galaxyService.getUserGalaxies(userId);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(Galaxy.findAll).toHaveBeenCalledWith({
				where: { userId },
				order: [['starCurrent', 'DESC']],
				transaction: mockTransaction,
			});

			expect(mockTransaction.commit).toHaveBeenCalled();
			expect(mockTransaction.rollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result).toEqual([
				{
					id: 1,
					userId,
					seed: 'seed1',
					starCurrent: 500,
				},
				{
					id: 2,
					userId,
					seed: 'seed2',
					starCurrent: 300,
				},
			]);
		});

		it('should return empty array if no galaxies found', async () => {
			// Mock данных
			const userId = 12345;
			Galaxy.findAll.mockResolvedValue(null);

			// Вызываем тестируемый метод
			const result = await galaxyService.getUserGalaxies(userId);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(Galaxy.findAll).toHaveBeenCalledWith({
				where: { userId },
				order: [['starCurrent', 'DESC']],
				transaction: mockTransaction,
			});

			expect(mockTransaction.commit).toHaveBeenCalled();
			expect(mockTransaction.rollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result).toEqual([]);
		});

		it('should throw ApiError if database query fails', async () => {
			// Mock данных
			const userId = 12345;
			const error = new Error('Database error');
			Galaxy.findAll.mockRejectedValue(error);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(galaxyService.getUserGalaxies(userId)).rejects.toThrow(
				'Failed to get user galaxies: Database error'
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(Galaxy.findAll).toHaveBeenCalledWith({
				where: { userId },
				order: [['starCurrent', 'DESC']],
				transaction: mockTransaction,
			});

			expect(mockTransaction.commit).not.toHaveBeenCalled();
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});

	describe('getGalaxy', () => {
		it('should return a galaxy by id', async () => {
			// Mock данных
			const galaxyId = 1;
			const galaxyData = {
				id: galaxyId,
				userId: 12345,
				seed: 'seed1',
				starCurrent: 500,
				User: {
					id: 12345,
					username: 'testuser',
					role: 'user',
				},
			};

			Galaxy.findByPk.mockResolvedValue(galaxyData);

			// Вызываем тестируемый метод
			const result = await galaxyService.getGalaxy(galaxyId);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(Galaxy.findByPk).toHaveBeenCalledWith(galaxyId, {
				include: [
					{
						model: User,
						attributes: ['username', 'role', 'id'],
					},
				],
				transaction: mockTransaction,
			});

			expect(mockTransaction.commit).toHaveBeenCalled();
			expect(mockTransaction.rollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result).toEqual(galaxyData);
		});

		it('should throw ApiError if galaxy not found', async () => {
			// Mock данных
			const galaxyId = 999;
			Galaxy.findByPk.mockResolvedValue(null);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(galaxyService.getGalaxy(galaxyId)).rejects.toThrow(
				'Galaxy not found'
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(Galaxy.findByPk).toHaveBeenCalledWith(galaxyId, {
				include: [
					{
						model: User,
						attributes: ['username', 'role', 'id'],
					},
				],
				transaction: mockTransaction,
			});

			expect(mockTransaction.commit).not.toHaveBeenCalled();
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});

	describe('createUserGalaxy', () => {
		it('should create a new galaxy', async () => {
			// Mock данных
			const userId = 12345;
			const galaxyData = {
				seed: 'testseed123',
				galaxyProperties: {
					type: 'spiral',
					colorPalette: {
						insideColor: '#ff1493',
						outsideColor: '#00ffff',
					},
				},
				particleCount: 1000,
			};

			const createdGalaxy = {
				id: 1,
				userId,
				seed: galaxyData.seed,
				starMin: 100,
				starCurrent: 100,
				price: 100,
				particleCount: galaxyData.particleCount,
				onParticleCountChange: true,
				galaxyProperties: galaxyData.galaxyProperties,
				active: true,
			};

			Galaxy.findOrCreate.mockResolvedValue([createdGalaxy, true]);

			// Вызываем тестируемый метод
			const result = await galaxyService.createUserGalaxy(
				userId,
				galaxyData
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(loggerService.info).toHaveBeenCalledWith(userId, galaxyData);
			expect(Galaxy.findOrCreate).toHaveBeenCalledWith({
				where: {
					seed: galaxyData.seed,
				},
				defaults: expect.objectContaining({
					userId,
					seed: galaxyData.seed,
					particleCount: galaxyData.particleCount,
					galaxyProperties: galaxyData.galaxyProperties,
				}),
				transaction: mockTransaction,
			});

			expect(mockTransaction.commit).toHaveBeenCalled();
			expect(mockTransaction.rollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result).toEqual(createdGalaxy);
		});

		it('should return existing galaxy if it already exists', async () => {
			// Mock данных
			const userId = 12345;
			const galaxyData = {
				seed: 'testseed123',
				galaxyProperties: {
					type: 'spiral',
				},
			};

			const existingGalaxy = {
				id: 1,
				userId: 54321, // Другой пользователь
				seed: galaxyData.seed,
				galaxyProperties: galaxyData.galaxyProperties,
			};

			Galaxy.findOrCreate.mockResolvedValue([existingGalaxy, false]);

			// Вызываем тестируемый метод
			const result = await galaxyService.createUserGalaxy(
				userId,
				galaxyData
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(loggerService.info).toHaveBeenCalledWith(userId, galaxyData);
			expect(loggerService.info).toHaveBeenCalledWith(
				userId,
				'galaxy already exists'
			);
			expect(Galaxy.findOrCreate).toHaveBeenCalled();

			expect(mockTransaction.commit).toHaveBeenCalled();
			expect(mockTransaction.rollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result).toEqual(existingGalaxy);
		});

		it('should throw ApiError if galaxy data is invalid', async () => {
			// Mock данных
			const userId = 12345;
			const invalidGalaxyData = {
				// Отсутствует seed и galaxyProperties
			};

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(
				galaxyService.createUserGalaxy(userId, invalidGalaxyData)
			).rejects.toThrow(
				'Failed to create galaxy: Invalid galaxy data structure'
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(Galaxy.findOrCreate).not.toHaveBeenCalled();

			expect(mockTransaction.commit).not.toHaveBeenCalled();
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});

	describe('getShowGalaxies', () => {
		it('should return random galaxies with pagination info', async () => {
			// Mock данных
			const userId = 12345;
			const count = 50;
			const galaxiesData = [
				{
					id: 1,
					userId: 54321, // другой пользователь
					seed: 'seed1',
					active: true,
					toJSON: jest.fn().mockReturnValue({
						id: 1,
						userId: 54321,
						seed: 'seed1',
						User: { username: 'user1', role: 'user', id: 54321 },
					}),
				},
				{
					id: 2,
					userId: 98765, // другой пользователь
					seed: 'seed2',
					active: true,
					toJSON: jest.fn().mockReturnValue({
						id: 2,
						userId: 98765,
						seed: 'seed2',
						User: { username: 'user2', role: 'user', id: 98765 },
					}),
				},
			];

			// Мокаем результаты запросов
			Galaxy.count.mockResolvedValue(count);
			Galaxy.findAll.mockResolvedValue(galaxiesData);
			sequelize.random = jest.fn().mockReturnValue('RANDOM()');

			// Вызываем тестируемый метод
			const result = await galaxyService.getShowGalaxies(userId);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(Galaxy.count).toHaveBeenCalledWith({
				where: {
					userId: { [Op.ne]: userId },
					active: true,
				},
				transaction: mockTransaction,
			});

			expect(Galaxy.findAll).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						userId: { [Op.ne]: userId },
						active: true,
					},
					order: 'RANDOM()',
					include: [
						{
							model: User,
							attributes: ['username', 'role', 'id'],
						},
					],
					transaction: mockTransaction,
				})
			);

			expect(mockTransaction.commit).toHaveBeenCalled();
			expect(mockTransaction.rollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result).toHaveProperty('info');
			expect(result).toHaveProperty('galaxies');
			expect(result.info).toHaveProperty('count', count);
			expect(result.info).toHaveProperty('totalPages');
			expect(result.info).toHaveProperty('currentPage');
			expect(result.info).toHaveProperty('itemsPerPage');
			expect(result.galaxies).toHaveLength(2);
		});

		it('should return empty result if no galaxies found', async () => {
			// Mock данных
			const userId = 12345;

			// Мокаем результаты запросов
			Galaxy.count.mockResolvedValue(0);

			// Вызываем тестируемый метод
			const result = await galaxyService.getShowGalaxies(userId);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(Galaxy.count).toHaveBeenCalledWith({
				where: {
					userId: { [Op.ne]: userId },
					active: true,
				},
				transaction: mockTransaction,
			});

			expect(Galaxy.findAll).not.toHaveBeenCalled();

			expect(mockTransaction.commit).toHaveBeenCalled();
			expect(mockTransaction.rollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result).toEqual({
				info: { count: 0, page: 0 },
				galaxies: [],
			});
		});

		it('should throw ApiError if database query fails', async () => {
			// Mock данных
			const userId = 12345;
			const error = new Error('Database error');
			Galaxy.count.mockRejectedValue(error);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(galaxyService.getShowGalaxies(userId)).rejects.toThrow(
				'Failed to get show galaxies: Database error'
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(Galaxy.count).toHaveBeenCalled();
			expect(mockTransaction.commit).not.toHaveBeenCalled();
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});

	describe('updateUserGalaxy', () => {
		it('should update galaxy parameters', async () => {
			// Mock данных
			const userId = 12345;
			const galaxyData = {
				seed: 'testseed123',
				starCurrent: 500,
				price: 200,
				particleCount: 1500,
				onParticleCountChange: false,
				galaxyProperties: { type: 'spiral' },
			};

			const galaxy = {
				id: 1,
				userId,
				seed: 'testseed123',
				starCurrent: 300,
				price: 100,
				particleCount: 1000,
				onParticleCountChange: true,
				galaxyProperties: { type: 'elliptical' },
				save: jest.fn().mockResolvedValue(true),
			};

			const user = {
				id: userId,
				username: 'testuser',
			};

			// Мокаем результаты запросов
			Galaxy.findOne.mockResolvedValue(galaxy);
			User.findOne.mockResolvedValue(user);

			// Вызываем тестируемый метод
			const result = await galaxyService.updateUserGalaxy(
				userId,
				galaxyData
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(Galaxy.findOne).toHaveBeenCalledWith({
				where: { seed: galaxyData.seed },
				transaction: mockTransaction,
			});

			expect(User.findOne).toHaveBeenCalledWith({
				where: { id: userId },
				transaction: mockTransaction,
			});

			expect(galaxy.save).toHaveBeenCalledWith({
				transaction: mockTransaction,
			});

			expect(mockTransaction.commit).toHaveBeenCalled();
			expect(mockTransaction.rollback).not.toHaveBeenCalled();

			// Проверяем, что параметры галактики были обновлены
			expect(galaxy.starCurrent).toBe(galaxyData.starCurrent);
			expect(galaxy.price).toBe(galaxyData.price);
			expect(galaxy.particleCount).toBe(galaxyData.particleCount);
			expect(galaxy.onParticleCountChange).toBe(
				galaxyData.onParticleCountChange
			);
			expect(galaxy.galaxyProperties).toBe(galaxyData.galaxyProperties);

			// Проверяем результат
			expect(result).toBe(galaxy);
		});

		it('should throw ApiError if galaxy not found', async () => {
			// Mock данных
			const userId = 12345;
			const galaxyData = {
				id: 999,
				seed: 'nonexistent',
				starCurrent: 500,
			};

			// Мокаем результаты запросов
			Galaxy.findOne.mockResolvedValue(null);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(
				galaxyService.updateUserGalaxy(userId, galaxyData)
			).rejects.toThrow('Galaxy not found');

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(Galaxy.findOne).toHaveBeenCalled();
			expect(mockTransaction.commit).not.toHaveBeenCalled();
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});

		it('should throw ApiError if stars value is negative', async () => {
			// Mock данных
			const userId = 12345;
			const galaxyData = {
				id: 1,
				seed: 'testseed123',
				starCurrent: -100,
				price: 200,
			};

			const galaxy = {
				id: 1,
				userId,
				seed: 'testseed123',
				starCurrent: 300,
				price: 100,
			};

			const user = {
				id: userId,
				username: 'testuser',
			};

			// Мокаем результаты запросов
			Galaxy.findOne.mockResolvedValue(galaxy);
			User.findOne.mockResolvedValue(user);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(
				galaxyService.updateUserGalaxy(userId, galaxyData)
			).rejects.toThrow('Stars cannot be negative');

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(Galaxy.findOne).toHaveBeenCalled();
			expect(User.findOne).toHaveBeenCalled();
			expect(mockTransaction.commit).not.toHaveBeenCalled();
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});

	describe('batchCreateGalaxies', () => {
		it('should create multiple galaxies', async () => {
			// Mock данных
			const userId = 12345;
			const galaxiesData = [
				{
					seed: 'seed1',
					galaxyProperties: { type: 'spiral' },
				},
				{
					seed: 'seed2',
					galaxyProperties: { type: 'elliptical' },
				},
			];

			const createdGalaxies = [
				[
					{
						id: 1,
						userId,
						seed: 'seed1',
						galaxyProperties: { type: 'spiral' },
						active: true,
					},
					true,
				],
				[
					{
						id: 2,
						userId,
						seed: 'seed2',
						galaxyProperties: { type: 'elliptical' },
						active: true,
					},
					true,
				],
			];

			// Мокаем Promise.all для возврата результатов findOrCreate
			const mockPromiseAll = jest.spyOn(Promise, 'all');
			mockPromiseAll.mockResolvedValue(createdGalaxies);

			// Мокаем Galaxy.findOrCreate для каждого вызова
			Galaxy.findOrCreate
				.mockResolvedValueOnce([
					{
						id: 1,
						userId,
						seed: 'seed1',
						galaxyProperties: { type: 'spiral' },
						active: true,
					},
					true,
				])
				.mockResolvedValueOnce([
					{
						id: 2,
						userId,
						seed: 'seed2',
						galaxyProperties: { type: 'elliptical' },
						active: true,
					},
					true,
				]);

			// Вызываем тестируемый метод
			const result = await galaxyService.batchCreateGalaxies(
				userId,
				galaxiesData
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(Galaxy.findOrCreate).toHaveBeenCalledTimes(2);

			// Проверяем первый вызов findOrCreate
			expect(Galaxy.findOrCreate).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({
					where: { seed: 'seed1' },
					defaults: expect.objectContaining({
						userId,
						seed: 'seed1',
						galaxyProperties: { type: 'spiral' },
					}),
					transaction: mockTransaction,
				})
			);

			// Проверяем второй вызов findOrCreate
			expect(Galaxy.findOrCreate).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({
					where: { seed: 'seed2' },
					defaults: expect.objectContaining({
						userId,
						seed: 'seed2',
						galaxyProperties: { type: 'elliptical' },
					}),
					transaction: mockTransaction,
				})
			);

			expect(mockTransaction.commit).toHaveBeenCalled();
			expect(mockTransaction.rollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result).toEqual(createdGalaxies);

			// Восстанавливаем оригинальную реализацию Promise.all
			mockPromiseAll.mockRestore();
		});

		it('should throw ApiError if database operation fails', async () => {
			// Mock данных
			const userId = 12345;
			const galaxiesData = [
				{ seed: 'seed1', galaxyProperties: { type: 'spiral' } },
			];

			const error = new Error('Database error');

			// Мокаем Promise.all для выброса ошибки
			const mockPromiseAll = jest.spyOn(Promise, 'all');
			mockPromiseAll.mockRejectedValue(error);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(
				galaxyService.batchCreateGalaxies(userId, galaxiesData)
			).rejects.toThrow(
				'Failed to batch create galaxies: Database error'
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(mockTransaction.commit).not.toHaveBeenCalled();
			expect(mockTransaction.rollback).toHaveBeenCalled();

			// Восстанавливаем оригинальную реализацию Promise.all
			mockPromiseAll.mockRestore();
		});
	});

	describe('createSystemGalaxyWithOffer', () => {
		// Пропускаем этот тест, так как он требует сложного мокирования динамических импортов
		it.skip('should create a system galaxy with market offer', async () => {
			// Mock данных
			const galaxyData = {
				seed: 'systemseed123',
				galaxyProperties: { type: 'special' },
				particleCount: 2000,
			};

			const buyerId = 12345;

			const offerData = {
				price: 500,
				currency: 'tgStars',
			};

			// Этот тест пропущен из-за сложности мокирования динамических импортов
			// Функциональность проверяется через интеграционные тесты
		});

		it('should throw ApiError if galaxy already exists', async () => {
			// Mock данных
			const galaxyData = {
				seed: 'systemseed123',
				galaxyProperties: { type: 'special' },
			};

			const buyerId = 12345;
			const offerData = { price: 500, currency: 'tgStars' };

			// Мокаем findOrCreate для возврата существующей галактики
			Galaxy.findOrCreate.mockResolvedValue([{}, false]);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(
				galaxyService.createSystemGalaxyWithOffer(
					galaxyData,
					buyerId,
					offerData
				)
			).rejects.toThrow(
				'Failed to create system galaxy with offer: Galaxy already exists'
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(Galaxy.findOrCreate).toHaveBeenCalled();
			expect(mockTransaction.commit).not.toHaveBeenCalled();
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});

		it('should throw ApiError if database operation fails', async () => {
			// Mock данных
			const galaxyData = {
				seed: 'systemseed123',
				galaxyProperties: { type: 'special' },
			};

			const buyerId = 12345;
			const offerData = { price: 500, currency: 'tgStars' };

			const error = new Error('Database error');
			Galaxy.findOrCreate.mockRejectedValue(error);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(
				galaxyService.createSystemGalaxyWithOffer(
					galaxyData,
					buyerId,
					offerData
				)
			).rejects.toThrow(
				'Failed to create system galaxy with offer: Database error'
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(Galaxy.findOrCreate).toHaveBeenCalled();
			expect(mockTransaction.commit).not.toHaveBeenCalled();
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});
});
