// Мокаем необходимые зависимости
jest.mock('../../service/user-service');
jest.mock('../../service/logger-service');
jest.mock('../../service/market-service');

const userController = require('../../controllers/user-controller');
const userService = require('../../service/user-service');
const ApiError = require('../../exceptions/api-error');

describe('UserController', () => {
	let req;
	let res;
	let next;

	beforeEach(() => {
		// Очищаем все моки перед каждым тестом
		jest.clearAllMocks();

		// Создаем моки для req, res и next
		req = {
			initdata: {
				id: 676176761,
				username: 'testuser',
			},
			body: {},
			cookies: {},
		};

		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			cookie: jest.fn(),
			clearCookie: jest.fn(),
		};

		next = jest.fn();
	});

	describe('registration', () => {
		it('should register new user', async () => {
			// Подготавливаем тестовые данные
			req.body = {
				referral: 0,
				userState: { state: { totalStars: 100 } },
				galaxies: [
					{
						starMin: 100,
						starCurrent: 100,
						price: 100,
						seed: 'abc123',
						particleCount: 100,
						onParticleCountChange: true,
						galaxyProperties: {
							type: 'spiral',
							colorPalette: {
								insideColor: '#ff1493',
								outsideColor: '#00ffff',
								coreColor: '#ffd700',
								armColor: '#ff4500',
							},
							branches: 5,
							radius: 4.2,
							randomness: 0.5,
							randomnessPower: 2.3,
							armWidth: 0.25,
							tilt: 0.4,
							warp: 0.1,
							rotation: 1.57,
							scale: 0.5,
							coreRadius: 0.3,
							coreDensity: 0.001,
						},
					},
				],
			};

			// Мокаем ответ от сервиса
			userService.registration.mockResolvedValue({
				user: { id: req.initdata.id, username: req.initdata.username },
				userState: { state: { totalStars: 100 } },
				userGalaxies: [{ id: 1, starMin: 100 }],
				packageOffers: [{ id: 1, price: 100 }],
				accessToken: 'test-access-token',
				refreshToken: 'test-refresh-token',
			});

			// Вызываем метод контроллера
			await userController.registration(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(userService.registration).toHaveBeenCalledWith(
				req.initdata.id,
				req.initdata.username,
				req.body.referral,
				req.body.userState,
				req.body.galaxies
			);

			// Проверяем, что cookie был установлен
			expect(res.cookie).toHaveBeenCalledWith(
				'refreshToken',
				'test-refresh-token',
				expect.any(Object)
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalled();
			const responseData = res.json.mock.calls[0][0];
			expect(responseData.user).toBeDefined();
			expect(responseData.userState).toBeDefined();
			expect(responseData.userGalaxies).toBeDefined();
			expect(responseData.packageOffers).toBeDefined();
			expect(responseData.accessToken).toBeDefined();
			expect(responseData.refreshToken).toBeDefined();
		});

		it('should handle registration error', async () => {
			// Мокаем ошибку от сервиса
			const errorMessage = 'Registration failed';
			userService.registration.mockRejectedValue(new Error(errorMessage));

			// Вызываем метод контроллера
			await userController.registration(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('login', () => {
		it('should login user successfully', async () => {
			// Мокаем ответ от сервиса
			userService.login.mockResolvedValue({
				user: { id: req.initdata.id, username: req.initdata.username },
				userState: { state: { totalStars: 100 } },
				userGalaxies: [{ id: 1, starMin: 100 }],
				userArtifacts: [{ id: 1, type: 'rare' }],
				packageOffers: [{ id: 1, price: 100 }],
				accessToken: 'test-access-token',
				refreshToken: 'test-refresh-token',
			});

			// Вызываем метод контроллера
			await userController.login(req, res, next);

			// Проверяем, что сервис был вызван с правильным ID
			expect(userService.login).toHaveBeenCalledWith(req.initdata.id);

			// Проверяем, что cookie был установлен
			expect(res.cookie).toHaveBeenCalledWith(
				'refreshToken',
				'test-refresh-token',
				expect.any(Object)
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalled();
			const responseData = res.json.mock.calls[0][0];
			expect(responseData.user).toBeDefined();
			expect(responseData.userState).toBeDefined();
			expect(responseData.userGalaxies).toBeDefined();
			expect(responseData.userArtifacts).toBeDefined();
			expect(responseData.packageOffers).toBeDefined();
			expect(responseData.accessToken).toBeDefined();
			expect(responseData.refreshToken).toBeDefined();
		});

		it('should handle login error', async () => {
			// Мокаем ошибку от сервиса
			const errorMessage = 'Login failed';
			userService.login.mockRejectedValue(new Error(errorMessage));

			// Вызываем метод контроллера
			await userController.login(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('logout', () => {
		it('should logout user successfully', async () => {
			// Подготавливаем тестовые данные
			req.cookies = { refreshToken: 'test-refresh-token' };

			// Мокаем ответ от сервиса
			userService.logout.mockResolvedValue({ success: true });

			// Вызываем метод контроллера
			await userController.logout(req, res, next);

			// Проверяем, что сервис был вызван с правильным токеном
			expect(userService.logout).toHaveBeenCalledWith(
				'test-refresh-token'
			);

			// Проверяем, что cookie был очищен
			expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith({ success: true });
		});

		it('should handle logout error', async () => {
			// Мокаем ошибку от сервиса
			const errorMessage = 'Logout failed';
			userService.logout.mockRejectedValue(new Error(errorMessage));

			// Вызываем метод контроллера
			await userController.logout(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('refresh', () => {
		it('should refresh tokens successfully', async () => {
			// Подготавливаем тестовые данные
			req.cookies = { refreshToken: 'test-refresh-token' };

			// Мокаем ответ от сервиса
			userService.refresh.mockResolvedValue({
				user: { id: req.initdata.id, username: req.initdata.username },
				accessToken: 'new-access-token',
				refreshToken: 'new-refresh-token',
			});

			// Вызываем метод контроллера
			await userController.refresh(req, res, next);

			// Проверяем, что сервис был вызван с правильным токеном
			expect(userService.refresh).toHaveBeenCalledWith(
				'test-refresh-token'
			);

			// Проверяем, что cookie был установлен
			expect(res.cookie).toHaveBeenCalledWith(
				'refreshToken',
				'new-refresh-token',
				expect.any(Object)
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalled();
			const responseData = res.json.mock.calls[0][0];
			expect(responseData.user).toBeDefined();
			expect(responseData.accessToken).toBeDefined();
			expect(responseData.refreshToken).toBeDefined();
		});

		it('should handle refresh error', async () => {
			// Мокаем ошибку от сервиса
			const errorMessage = 'Refresh failed';
			userService.refresh.mockRejectedValue(new Error(errorMessage));

			// Вызываем метод контроллера
			await userController.refresh(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('getFriends', () => {
		it('should get user friends successfully', async () => {
			// Мокаем ответ от сервиса
			userService.getFriends.mockResolvedValue({
				count: 2,
				friends: [
					{ id: 123, username: 'friend1' },
					{ id: 456, username: 'friend2' },
				],
			});

			// Вызываем метод контроллера
			await userController.getFriends(req, res, next);

			// Проверяем, что сервис был вызван с правильным ID
			expect(userService.getFriends).toHaveBeenCalledWith(
				req.initdata.id
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith({
				count: 2,
				friends: [
					{ id: 123, username: 'friend1' },
					{ id: 456, username: 'friend2' },
				],
			});
		});

		it('should handle getFriends error', async () => {
			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to get friends';
			userService.getFriends.mockRejectedValue(new Error(errorMessage));

			// Вызываем метод контроллера
			await userController.getFriends(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});
});
