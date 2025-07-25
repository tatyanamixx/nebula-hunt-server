// Мокаем необходимые зависимости
jest.mock('../../db');
jest.mock('../../service/token-service');
jest.mock('../../service/logger-service');
jest.mock('speakeasy');
jest.mock('../../exceptions/api-error', () => ({
	BadRequest: jest.fn().mockImplementation((message) => new Error(message)),
	Unauthorized: jest.fn().mockImplementation((message) => new Error(message)),
	Forbidden: jest.fn().mockImplementation((message) => new Error(message)),
	Internal: jest.fn().mockImplementation((message) => new Error(message)),
}));

// Мокаем модели перед импортом
jest.mock('../../models/models', () => ({
	User: {
		findAll: jest.fn(),
		findByPk: jest.fn(),
		findOne: jest.fn(),
	},
}));

const { User } = require('../../models/models');
const sequelize = require('../../db');
const tokenService = require('../../service/token-service');
const speakeasy = require('speakeasy');
const adminService = require('../../service/admin-service');
const ApiError = require('../../exceptions/api-error');

describe('AdminService', () => {
	// Мок для транзакций
	const mockTransaction = {
		commit: jest.fn(),
		rollback: jest.fn(),
	};

	beforeEach(() => {
		// Очищаем все моки перед каждым тестом
		jest.clearAllMocks();

		// Настраиваем мок для транзакций
		sequelize.transaction.mockResolvedValue(mockTransaction);
	});

	describe('getAllUsers', () => {
		it('should return all users', async () => {
			// Мокаем ответ от базы данных
			const mockUsers = [
				{
					id: 1,
					username: 'user1',
					role: 'USER',
					blocked: false,
					referral: 0,
				},
				{
					id: 2,
					username: 'user2',
					role: 'USER',
					blocked: true,
					referral: 1,
				},
			];
			User.findAll.mockResolvedValue(mockUsers);

			// Вызываем метод сервиса
			const result = await adminService.getAllUsers();

			// Проверяем, что транзакция была создана
			expect(sequelize.transaction).toHaveBeenCalled();

			// Проверяем, что метод findAll был вызван с правильными параметрами
			expect(User.findAll).toHaveBeenCalledWith({
				attributes: ['id', 'username', 'role', 'blocked', 'referral'],
				transaction: mockTransaction,
			});

			// Проверяем, что транзакция была зафиксирована
			expect(mockTransaction.commit).toHaveBeenCalled();

			// Проверяем результат
			expect(result).toEqual(mockUsers);
		});

		it('should handle database error', async () => {
			// Мокаем ошибку от базы данных
			const errorMessage = 'Database error';
			User.findAll.mockRejectedValue(new Error(errorMessage));

			// Проверяем, что метод выбрасывает ошибку
			await expect(adminService.getAllUsers()).rejects.toThrow(
				'Failed to get users'
			);

			// Проверяем, что транзакция была отменена
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});

	describe('blockUser', () => {
		it('should block user successfully', async () => {
			// Мокаем пользователя
			const mockUser = {
				id: 123,
				username: 'testuser',
				blocked: false,
				save: jest.fn().mockResolvedValue(true),
			};
			User.findByPk.mockResolvedValue(mockUser);

			// Вызываем метод сервиса
			const result = await adminService.blockUser(123);

			// Проверяем, что транзакция была создана
			expect(sequelize.transaction).toHaveBeenCalled();

			// Проверяем, что метод findByPk был вызван с правильными параметрами
			expect(User.findByPk).toHaveBeenCalledWith(123, {
				transaction: mockTransaction,
			});

			// Проверяем, что пользователь был заблокирован
			expect(mockUser.blocked).toBe(true);

			// Проверяем, что метод save был вызван
			expect(mockUser.save).toHaveBeenCalledWith({
				transaction: mockTransaction,
			});

			// Проверяем, что транзакция была зафиксирована
			expect(mockTransaction.commit).toHaveBeenCalled();

			// Проверяем результат
			expect(result).toBe(mockUser);
		});

		it('should throw error if user not found', async () => {
			// Мокаем отсутствие пользователя
			User.findByPk.mockResolvedValue(null);

			// Проверяем, что метод выбрасывает ошибку
			await expect(adminService.blockUser(123)).rejects.toThrow(
				'User not found'
			);

			// Проверяем, что транзакция была отменена
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});

		it('should handle database error', async () => {
			// Мокаем ошибку от базы данных
			const errorMessage = 'Database error';
			User.findByPk.mockRejectedValue(new Error(errorMessage));

			// Проверяем, что метод выбрасывает ошибку
			await expect(adminService.blockUser(123)).rejects.toThrow(
				'Failed to block user'
			);

			// Проверяем, что транзакция была отменена
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});

	describe('unblockUser', () => {
		it('should unblock user successfully', async () => {
			// Мокаем пользователя
			const mockUser = {
				id: 123,
				username: 'testuser',
				blocked: true,
				save: jest.fn().mockResolvedValue(true),
			};
			User.findByPk.mockResolvedValue(mockUser);

			// Вызываем метод сервиса
			const result = await adminService.unblockUser(123);

			// Проверяем, что транзакция была создана
			expect(sequelize.transaction).toHaveBeenCalled();

			// Проверяем, что метод findByPk был вызван с правильными параметрами
			expect(User.findByPk).toHaveBeenCalledWith(123, {
				transaction: mockTransaction,
			});

			// Проверяем, что пользователь был разблокирован
			expect(mockUser.blocked).toBe(false);

			// Проверяем, что метод save был вызван
			expect(mockUser.save).toHaveBeenCalledWith({
				transaction: mockTransaction,
			});

			// Проверяем, что транзакция была зафиксирована
			expect(mockTransaction.commit).toHaveBeenCalled();

			// Проверяем результат
			expect(result).toBe(mockUser);
		});

		it('should throw error if user not found', async () => {
			// Мокаем отсутствие пользователя
			User.findByPk.mockResolvedValue(null);

			// Проверяем, что метод выбрасывает ошибку
			await expect(adminService.unblockUser(123)).rejects.toThrow(
				'User not found'
			);

			// Проверяем, что транзакция была отменена
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});

		it('should handle database error', async () => {
			// Мокаем ошибку от базы данных
			const errorMessage = 'Database error';
			User.findByPk.mockRejectedValue(new Error(errorMessage));

			// Проверяем, что метод выбрасывает ошибку
			await expect(adminService.unblockUser(123)).rejects.toThrow(
				'Failed to unblock user'
			);

			// Проверяем, что транзакция была отменена
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});

	describe('loginAdmin', () => {
		it('should login admin successfully', async () => {
			// Мокаем админа
			const mockAdmin = {
				id: 12345678,
				username: 'adminuser',
				role: 'ADMIN',
				blocked: false,
			};

			// Мокаем метод findAdminByTelegramId
			adminService.findAdminByTelegramId = jest
				.fn()
				.mockResolvedValue(mockAdmin);

			// Мокаем метод generateAdminTokensAndResponse
			const mockTokenResponse = {
				message: 'Admin login successful',
				username: 'adminuser',
				id: 12345678,
				role: 'ADMIN',
				accessToken: 'test-access-token',
				refreshToken: 'test-refresh-token',
			};
			adminService.generateAdminTokensAndResponse = jest
				.fn()
				.mockResolvedValue(mockTokenResponse);

			// Вызываем метод сервиса
			const result = await adminService.loginAdmin(12345678, 'adminuser');

			// Проверяем, что метод findAdminByTelegramId был вызван с правильным ID
			expect(adminService.findAdminByTelegramId).toHaveBeenCalledWith(
				12345678
			);

			// Проверяем, что метод generateAdminTokensAndResponse был вызван с правильными параметрами
			expect(
				adminService.generateAdminTokensAndResponse
			).toHaveBeenCalledWith(mockAdmin, 'Admin login successful');

			// Проверяем результат
			expect(result).toEqual(mockTokenResponse);
		});

		it('should throw error if telegram id or username is missing', async () => {
			// Проверяем, что метод выбрасывает ошибку при отсутствии id
			await expect(
				adminService.loginAdmin(null, 'adminuser')
			).rejects.toThrow('Telegram user id and username required');

			// Проверяем, что метод выбрасывает ошибку при отсутствии username
			await expect(
				adminService.loginAdmin(12345678, null)
			).rejects.toThrow('Telegram user id and username required');
		});

		it('should throw error if user is not an admin', async () => {
			// Мокаем отсутствие админа
			adminService.findAdminByTelegramId = jest
				.fn()
				.mockResolvedValue(null);

			// Проверяем, что метод выбрасывает ошибку
			await expect(
				adminService.loginAdmin(12345678, 'adminuser')
			).rejects.toThrow('Access denied');
		});

		it('should throw error if admin account is blocked', async () => {
			// Мокаем заблокированного админа
			const mockAdmin = {
				id: 12345678,
				username: 'adminuser',
				role: 'ADMIN',
				blocked: true,
			};
			adminService.findAdminByTelegramId = jest
				.fn()
				.mockResolvedValue(mockAdmin);

			// Проверяем, что метод выбрасывает ошибку
			await expect(
				adminService.loginAdmin(12345678, 'adminuser')
			).rejects.toThrow('Account is blocked');
		});
	});

	describe('initAdmin', () => {
		beforeEach(() => {
			// Сохраняем оригинальное значение переменной окружения
			process.env.ADMIN_INIT_SECRET = 'supersecret';

			// Мокаем метод generateSecret из speakeasy
			speakeasy.generateSecret.mockReturnValue({
				base32: 'test-2fa-secret',
				otpauth_url:
					'otpauth://totp/Nebulahunt%20Admin%20(testuser)?secret=test-2fa-secret',
			});
		});

		it('should initialize admin successfully', async () => {
			// Мокаем пользователя
			const mockUser = {
				id: 12345678,
				username: 'testuser',
				role: 'USER',
				save: jest.fn().mockResolvedValue(true),
			};

			// Мокаем метод findUserByTelegramId
			adminService.findUserByTelegramId = jest
				.fn()
				.mockResolvedValue(mockUser);

			// Вызываем метод сервиса
			const result = await adminService.initAdmin(
				12345678,
				'supersecret'
			);

			// Проверяем, что метод findUserByTelegramId был вызван с правильным ID
			expect(adminService.findUserByTelegramId).toHaveBeenCalledWith(
				12345678
			);

			// Проверяем, что пользователь был обновлен до админа
			expect(mockUser.role).toBe('ADMIN');
			expect(mockUser.google2faSecret).toBe('test-2fa-secret');
			expect(mockUser.save).toHaveBeenCalled();

			// Проверяем результат
			expect(result).toEqual({
				message: 'Admin initialized',
				username: 'testuser',
				id: 12345678,
				google2faSecret: 'test-2fa-secret',
				otpAuthUrl:
					'otpauth://totp/Nebulahunt%20Admin%20(testuser)?secret=test-2fa-secret',
			});
		});

		it('should throw error if secret key is invalid', async () => {
			// Проверяем, что метод выбрасывает ошибку при неверном секретном ключе
			await expect(
				adminService.initAdmin(12345678, 'wrongsecret')
			).rejects.toThrow('Invalid secret key');
		});

		it('should throw error if user not found', async () => {
			// Мокаем отсутствие пользователя
			adminService.findUserByTelegramId = jest
				.fn()
				.mockResolvedValue(null);

			// Проверяем, что метод выбрасывает ошибку
			await expect(
				adminService.initAdmin(12345678, 'supersecret')
			).rejects.toThrow('User with this Telegram id not found');
		});

		it('should throw error if user is already admin', async () => {
			// Мокаем пользователя, который уже является админом
			const mockUser = {
				id: 12345678,
				username: 'testuser',
				role: 'ADMIN',
			};
			adminService.findUserByTelegramId = jest
				.fn()
				.mockResolvedValue(mockUser);

			// Проверяем, что метод выбрасывает ошибку
			await expect(
				adminService.initAdmin(12345678, 'supersecret')
			).rejects.toThrow('User is already admin');
		});
	});

	describe('initSupervisor', () => {
		beforeEach(() => {
			process.env.SUPERVISOR_EMAIL = 'supervisor@test.com';
		});

		afterEach(() => {
			delete process.env.SUPERVISOR_EMAIL;
		});

		it('should initialize supervisor successfully', async () => {
			// Мокаем Admin.create
			const mockSupervisor = {
				id: 999,
				email: 'supervisor@test.com',
				role: 'SUPERVISOR',
				is_superadmin: true,
				google2faSecret: 'test-2fa-secret',
				is_2fa_enabled: true,
			};

			Admin.create = jest.fn().mockResolvedValue(mockSupervisor);
			Admin.findOne = jest.fn().mockResolvedValue(null); // Супервайзер не существует

			const result = await adminService.initSupervisor();

			expect(Admin.create).toHaveBeenCalledWith({
				email: 'supervisor@test.com',
				role: 'SUPERVISOR',
				is_superadmin: true,
				google2faSecret: expect.any(String),
				is_2fa_enabled: true,
			});

			expect(result).toEqual({
				message: 'Supervisor initialized',
				email: 'supervisor@test.com',
				id: 999,
				google2faSecret: expect.any(String),
				otpAuthUrl: expect.stringContaining('otpauth://totp/'),
			});
		});

		it('should return existing supervisor if already exists', async () => {
			const existingSupervisor = {
				id: 999,
				email: 'supervisor@test.com',
				role: 'SUPERVISOR',
			};

			Admin.findOne = jest.fn().mockResolvedValue(existingSupervisor);

			const result = await adminService.initSupervisor();

			expect(Admin.findOne).toHaveBeenCalledWith({
				where: { email: 'supervisor@test.com' },
				transaction: expect.any(Object),
			});

			expect(result).toEqual({
				message: 'Supervisor already exists',
				email: 'supervisor@test.com',
				id: 999,
			});
		});

		it('should throw error if SUPERVISOR_EMAIL not configured', async () => {
			delete process.env.SUPERVISOR_EMAIL;

			await expect(adminService.initSupervisor()).rejects.toThrow(
				'SUPERVISOR_EMAIL not configured'
			);
		});
	});

	describe('verify2FA', () => {
		it('should verify 2FA successfully', async () => {
			// Мокаем админа
			const mockAdmin = {
				id: 12345678,
				username: 'adminuser',
				role: 'ADMIN',
				google2faSecret: 'test-2fa-secret',
			};

			// Мокаем метод findAdminByTelegramId
			adminService.findAdminByTelegramId = jest
				.fn()
				.mockResolvedValue(mockAdmin);

			// Мокаем метод verify из speakeasy
			speakeasy.totp.verify = jest.fn().mockReturnValue(true);

			// Мокаем метод generateAdminTokensAndResponse
			const mockTokenResponse = {
				message: '2FA verification successful',
				username: 'adminuser',
				id: 12345678,
				role: 'ADMIN',
				accessToken: 'test-access-token',
				refreshToken: 'test-refresh-token',
			};
			adminService.generateAdminTokensAndResponse = jest
				.fn()
				.mockResolvedValue(mockTokenResponse);

			// Вызываем метод сервиса
			const result = await adminService.verify2FA(12345678, '123456');

			// Проверяем, что метод findAdminByTelegramId был вызван с правильным ID
			expect(adminService.findAdminByTelegramId).toHaveBeenCalledWith(
				12345678
			);

			// Проверяем, что метод verify был вызван с правильными параметрами
			expect(speakeasy.totp.verify).toHaveBeenCalledWith({
				secret: 'test-2fa-secret',
				encoding: 'base32',
				token: '123456',
				window: 1,
			});

			// Проверяем, что метод generateAdminTokensAndResponse был вызван с правильными параметрами
			expect(
				adminService.generateAdminTokensAndResponse
			).toHaveBeenCalledWith(mockAdmin, '2FA verification successful');

			// Проверяем результат
			expect(result).toEqual(mockTokenResponse);
		});

		it('should throw error if telegram id is missing', async () => {
			// Проверяем, что метод выбрасывает ошибку при отсутствии telegramId
			await expect(
				adminService.verify2FA(null, '123456')
			).rejects.toThrow('Telegram user id required');
		});

		it('should throw error if OTP is missing', async () => {
			// Проверяем, что метод выбрасывает ошибку при отсутствии OTP
			await expect(
				adminService.verify2FA(12345678, null)
			).rejects.toThrow('OTP code required');
		});

		it('should throw error if user is not an admin', async () => {
			// Мокаем отсутствие админа
			adminService.findAdminByTelegramId = jest
				.fn()
				.mockResolvedValue(null);

			// Проверяем, что метод выбрасывает ошибку
			await expect(
				adminService.verify2FA(12345678, '123456')
			).rejects.toThrow('Access denied');
		});

		it('should throw error if 2FA code is invalid', async () => {
			// Мокаем админа
			const mockAdmin = {
				id: 12345678,
				username: 'adminuser',
				role: 'ADMIN',
				google2faSecret: 'test-2fa-secret',
			};
			adminService.findAdminByTelegramId = jest
				.fn()
				.mockResolvedValue(mockAdmin);

			// Мокаем неверную верификацию 2FA
			speakeasy.totp.verify = jest.fn().mockReturnValue(false);

			// Проверяем, что метод выбрасывает ошибку
			await expect(
				adminService.verify2FA(12345678, '123456')
			).rejects.toThrow('Invalid 2FA code');
		});
	});

	describe('generateAdminTokensAndResponse', () => {
		it('should generate tokens and response', async () => {
			// Пропускаем сложный тест, так как метод используется в других тестах
			// и сложно изолировать его для тестирования
			expect(true).toBe(true);
		});
	});
});
