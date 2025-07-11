// Мокаем необходимые зависимости
jest.mock('../../service/admin-service');
jest.mock('../../service/logger-service');

const adminController = require('../../controllers/admin-controller');
const adminService = require('../../service/admin-service');
const ApiError = require('../../exceptions/api-error');

describe('AdminController', () => {
	let req;
	let res;
	let next;

	beforeEach(() => {
		// Очищаем все моки перед каждым тестом
		jest.clearAllMocks();

		// Создаем моки для req, res и next
		req = {
			initdata: {
				id: 12345678,
				username: 'adminuser',
			},
			userToken: {
				id: 12345678,
				role: 'ADMIN',
			},
			params: {},
			body: {},
		};

		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		next = jest.fn();
	});

	describe('getUsers', () => {
		it('should return all users', async () => {
			// Мокаем ответ от сервиса
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
			adminService.getAllUsers.mockResolvedValue(mockUsers);

			// Вызываем метод контроллера
			await adminController.getUsers(req, res, next);

			// Проверяем, что сервис был вызван
			expect(adminService.getAllUsers).toHaveBeenCalled();

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(mockUsers);
		});

		it('should handle error when getting users fails', async () => {
			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to get users';
			adminService.getAllUsers.mockRejectedValue(new Error(errorMessage));

			// Вызываем метод контроллера
			await adminController.getUsers(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('blockUser', () => {
		it('should block user successfully', async () => {
			// Подготавливаем тестовые данные
			req.params.userId = 123;

			// Мокаем ответ от сервиса
			const mockUser = {
				id: 123,
				username: 'blockeduser',
				blocked: true,
			};
			adminService.blockUser.mockResolvedValue(mockUser);

			// Вызываем метод контроллера
			await adminController.blockUser(req, res, next);

			// Проверяем, что сервис был вызван с правильным ID
			expect(adminService.blockUser).toHaveBeenCalledWith(123);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(mockUser);
		});

		it('should handle error when blocking user fails', async () => {
			// Подготавливаем тестовые данные
			req.params.userId = 123;

			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to block user';
			adminService.blockUser.mockRejectedValue(new Error(errorMessage));

			// Вызываем метод контроллера
			await adminController.blockUser(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('unblockUser', () => {
		it('should unblock user successfully', async () => {
			// Подготавливаем тестовые данные
			req.params.userId = 123;

			// Мокаем ответ от сервиса
			const mockUser = {
				id: 123,
				username: 'unblockeduser',
				blocked: false,
			};
			adminService.unblockUser.mockResolvedValue(mockUser);

			// Вызываем метод контроллера
			await adminController.unblockUser(req, res, next);

			// Проверяем, что сервис был вызван с правильным ID
			expect(adminService.unblockUser).toHaveBeenCalledWith(123);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(mockUser);
		});

		it('should handle error when unblocking user fails', async () => {
			// Подготавливаем тестовые данные
			req.params.userId = 123;

			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to unblock user';
			adminService.unblockUser.mockRejectedValue(new Error(errorMessage));

			// Вызываем метод контроллера
			await adminController.unblockUser(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('loginAdmin', () => {
		it('should login admin successfully', async () => {
			// Мокаем ответ от сервиса
			const mockLoginResult = {
				message: 'Admin login successful',
				username: 'adminuser',
				id: 12345678,
				role: 'ADMIN',
				accessToken: 'test-access-token',
				refreshToken: 'test-refresh-token',
			};
			adminService.loginAdmin.mockResolvedValue(mockLoginResult);

			// Вызываем метод контроллера
			await adminController.loginAdmin(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(adminService.loginAdmin).toHaveBeenCalledWith(
				req.initdata.id,
				req.initdata.username
			);

			// Проверяем ответ
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(mockLoginResult);
		});

		it('should handle error when admin login fails', async () => {
			// Мокаем ошибку от сервиса
			const errorMessage = 'Admin login failed';
			adminService.loginAdmin.mockRejectedValue(new Error(errorMessage));

			// Вызываем метод контроллера
			await adminController.loginAdmin(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('logoutAdmin', () => {
		it('should logout admin successfully', async () => {
			// Подготавливаем тестовые данные
			req.body.refreshToken = 'test-refresh-token';

			// Мокаем ответ от сервиса
			adminService.removeAdminToken.mockResolvedValue();

			// Вызываем метод контроллера
			await adminController.logoutAdmin(req, res, next);

			// Проверяем, что сервис был вызван с правильным токеном
			expect(adminService.removeAdminToken).toHaveBeenCalledWith(
				'test-refresh-token'
			);

			// Проверяем ответ
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Admin logged out successfully',
			});
		});

		it('should return error when refreshToken is missing', async () => {
			// Вызываем метод контроллера без refreshToken в body
			await adminController.logoutAdmin(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error).toBeInstanceOf(ApiError);
			expect(error.status).toBe(400);
			expect(error.message).toBe('refreshToken required');
		});

		it('should handle error when admin logout fails', async () => {
			// Подготавливаем тестовые данные
			req.body.refreshToken = 'test-refresh-token';

			// Мокаем ошибку от сервиса
			const errorMessage = 'Admin logout failed';
			adminService.removeAdminToken.mockRejectedValue(
				new Error(errorMessage)
			);

			// Вызываем метод контроллера
			await adminController.logoutAdmin(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('initAdmin', () => {
		it('should initialize admin successfully', async () => {
			// Подготавливаем тестовые данные
			req.body.telegramId = 12345678;
			req.body.secretKey = 'test-secret-key';

			// Мокаем ответ от сервиса
			const mockInitResult = {
				message: 'Admin initialized',
				username: 'adminuser',
				id: 12345678,
				google2faSecret: 'test-2fa-secret',
				otpAuthUrl:
					'otpauth://totp/Nebulahunt%20Admin%20(adminuser)?secret=test-2fa-secret',
			};
			adminService.initAdmin.mockResolvedValue(mockInitResult);

			// Вызываем метод контроллера
			await adminController.initAdmin(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(adminService.initAdmin).toHaveBeenCalledWith(
				req.body.telegramId,
				req.body.secretKey
			);

			// Проверяем ответ
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(mockInitResult);
		});

		it('should return error when telegramId is missing', async () => {
			// Подготавливаем тестовые данные с отсутствующим telegramId
			req.body.secretKey = 'test-secret-key';

			// Вызываем метод контроллера
			await adminController.initAdmin(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error).toBeInstanceOf(ApiError);
			expect(error.status).toBe(400);
			expect(error.message).toBe('Telegram ID required');
		});

		it('should handle error when admin initialization fails', async () => {
			// Подготавливаем тестовые данные
			req.body.telegramId = 12345678;
			req.body.secretKey = 'test-secret-key';

			// Мокаем ошибку от сервиса
			const errorMessage = 'Admin initialization failed';
			adminService.initAdmin.mockRejectedValue(new Error(errorMessage));

			// Вызываем метод контроллера
			await adminController.initAdmin(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('verify2FA', () => {
		it('should verify 2FA successfully', async () => {
			// Подготавливаем тестовые данные
			req.body.otp = '123456';

			// Мокаем ответ от сервиса
			const mockVerifyResult = {
				message: '2FA verification successful',
				username: 'adminuser',
				id: 12345678,
				role: 'ADMIN',
				accessToken: 'test-access-token',
				refreshToken: 'test-refresh-token',
			};
			adminService.verify2FA.mockResolvedValue(mockVerifyResult);

			// Вызываем метод контроллера
			await adminController.verify2FA(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(adminService.verify2FA).toHaveBeenCalledWith(
				req.initdata.id,
				req.body.otp
			);

			// Проверяем ответ
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith(mockVerifyResult);
		});

		it('should handle error when 2FA verification fails', async () => {
			// Подготавливаем тестовые данные
			req.body.otp = '123456';

			// Мокаем ошибку от сервиса
			const errorMessage = '2FA verification failed';
			adminService.verify2FA.mockRejectedValue(new Error(errorMessage));

			// Вызываем метод контроллера
			await adminController.verify2FA(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});
});
