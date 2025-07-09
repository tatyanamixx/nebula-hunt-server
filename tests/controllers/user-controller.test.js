// Мокаем необходимые зависимости
jest.mock('../../service/user-service');
jest.mock('../../service/logger-service');
jest.mock('../../service/market-service');

// Мокаем middleware для тестирования
jest.mock('../../middlewares/tma-middleware', () => (req, res, next) => {
	req.initdata = {
		id: 676176761,
		username: 'testuser',
	};
	next();
});

jest.mock('../../middlewares/auth-middleware', () => (req, res, next) => {
	// Пропускаем авторизацию в тестах и добавляем пользователя в запрос
	req.user = {
		id: 676176761,
		username: 'testuser',
		role: 'USER',
	};
	next();
});

jest.mock(
	'../../middlewares/rate-limit-middleware',
	() => () => (req, res, next) => next()
);

const request = require('supertest');
const app = require('../../app'); // Импортируем app напрямую из app.js
const userService = require('../../service/user-service');
const marketService = require('../../service/market-service');

describe('UserController', () => {
	beforeEach(() => {
		// Очищаем все моки перед каждым тестом
		jest.clearAllMocks();
	});

	describe('POST /api/auth/registration', () => {
		it('should register new user', async () => {
			// Мокаем ответ от сервиса
			userService.registration.mockResolvedValue({
				user: { id: 676176761, username: 'testuser' },
				userState: { state: { totalStars: 100 } },
				userGalaxies: [{ id: 1, starMin: 100 }],
				packageOffers: [{ id: 1, price: 100 }],
				accessToken: 'test-access-token',
				refreshToken: 'test-refresh-token',
			});

			const userData = {
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

			const response = await request(app)
				.post('/api/auth/registration')
				.set('x-telegram-init-data', 'mock-telegram-data')
				.send(userData);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(userService.registration).toHaveBeenCalledWith(
				676176761,
				'testuser',
				userData.referral,
				userData.userState,
				userData.galaxies
			);

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body.user).toBeDefined();
			expect(response.body.userState).toBeDefined();
			expect(response.body.userGalaxies).toBeDefined();
			expect(response.body.packageOffers).toBeDefined();
			expect(response.body.accessToken).toBeDefined();
			expect(response.body.refreshToken).toBeDefined();
			// Проверяем, что upgradeTree не возвращается отдельно
			expect(response.body.upgradeTree).toBeUndefined();
		});

		it('should handle registration error', async () => {
			// Мокаем ошибку от сервиса
			userService.registration.mockRejectedValue(
				new Error('Registration failed')
			);

			const userData = {
				referral: 0,
				userState: { state: { totalStars: 100 } },
				galaxies: [],
			};

			const response = await request(app)
				.post('/api/auth/registration')
				.set('x-telegram-init-data', 'mock-telegram-data')
				.send(userData);

			// Проверяем ответ с ошибкой
			expect(response.status).toBe(500);
			expect(response.body.message).toBeDefined();
		});
	});

	describe('POST /api/auth/login', () => {
		it('should login user successfully', async () => {
			// Мокаем ответ от сервиса
			userService.login.mockResolvedValue({
				user: { id: 676176761, username: 'testuser' },
				userState: { state: { totalStars: 100 } },
				userGalaxies: [{ id: 1, starMin: 100 }],
				userArtifacts: [{ id: 1, type: 'rare' }],
				packageOffers: [{ id: 1, price: 100 }],
				accessToken: 'test-access-token',
				refreshToken: 'test-refresh-token',
			});

			const response = await request(app)
				.post('/api/auth/login')
				.set('x-telegram-init-data', 'mock-telegram-data')
				.set('Authorization', 'Bearer test-token');

			// Проверяем, что сервис был вызван с правильным ID
			expect(userService.login).toHaveBeenCalledWith(676176761);

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body.user).toBeDefined();
			expect(response.body.userState).toBeDefined();
			expect(response.body.userGalaxies).toBeDefined();
			expect(response.body.userArtifacts).toBeDefined();
			expect(response.body.packageOffers).toBeDefined();
			expect(response.body.accessToken).toBeDefined();
			expect(response.body.refreshToken).toBeDefined();
		});

		it('should handle login error', async () => {
			// Мокаем ошибку от сервиса
			userService.login.mockRejectedValue(new Error('Login failed'));

			const response = await request(app)
				.post('/api/auth/login')
				.set('x-telegram-init-data', 'mock-telegram-data');

			// Проверяем ответ с ошибкой
			expect(response.status).toBe(500);
			expect(response.body.message).toBeDefined();
		});
	});

	describe('POST /api/auth/logout', () => {
		it('should logout user successfully', async () => {
			// Мокаем ответ от сервиса
			userService.logout.mockResolvedValue({ success: true });

			const response = await request(app)
				.post('/api/auth/logout')
				.set('Authorization', 'Bearer test-token')
				.set('Cookie', ['refreshToken=test-refresh-token']);

			// Проверяем, что сервис был вызван с правильным токеном
			expect(userService.logout).toHaveBeenCalledWith(
				'test-refresh-token'
			);

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ success: true });
		});

		it('should handle logout error', async () => {
			// Мокаем ошибку от сервиса
			userService.logout.mockRejectedValue(new Error('Logout failed'));

			const response = await request(app)
				.post('/api/auth/logout')
				.set('Authorization', 'Bearer test-token');

			// Проверяем ответ с ошибкой
			expect(response.status).toBe(500);
			expect(response.body.message).toBeDefined();
		});
	});

	describe('GET /api/auth/refresh', () => {
		it('should refresh tokens successfully', async () => {
			// Мокаем ответ от сервиса
			userService.refresh.mockResolvedValue({
				user: { id: 676176761, username: 'testuser' },
				accessToken: 'new-access-token',
				refreshToken: 'new-refresh-token',
			});

			const response = await request(app)
				.get('/api/auth/refresh')
				.set('Authorization', 'Bearer test-token')
				.set('Cookie', ['refreshToken=test-refresh-token']);

			// Проверяем, что сервис был вызван с правильным токеном
			expect(userService.refresh).toHaveBeenCalledWith(
				'test-refresh-token'
			);

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body.user).toBeDefined();
			expect(response.body.accessToken).toBeDefined();
			expect(response.body.refreshToken).toBeDefined();
		});

		it('should handle refresh error', async () => {
			// Мокаем ошибку от сервиса
			userService.refresh.mockRejectedValue(new Error('Refresh failed'));

			const response = await request(app)
				.get('/api/auth/refresh')
				.set('Authorization', 'Bearer test-token');

			// Проверяем ответ с ошибкой
			expect(response.status).toBe(500);
			expect(response.body.message).toBeDefined();
		});
	});

	describe('GET /api/auth/friends', () => {
		it('should get user friends successfully', async () => {
			// Мокаем ответ от сервиса
			userService.getFriends.mockResolvedValue({
				count: 2,
				friends: [
					{ id: 123, username: 'friend1' },
					{ id: 456, username: 'friend2' },
				],
			});

			const response = await request(app)
				.get('/api/auth/friends')
				.set('x-telegram-init-data', 'mock-telegram-data')
				.set('Authorization', 'Bearer test-token');

			// Проверяем, что сервис был вызван с правильным ID
			expect(userService.getFriends).toHaveBeenCalledWith(676176761);

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body.count).toBe(2);
			expect(response.body.friends).toHaveLength(2);
		});

		it('should handle getFriends error', async () => {
			// Мокаем ошибку от сервиса
			userService.getFriends.mockRejectedValue(
				new Error('Failed to get friends')
			);

			const response = await request(app)
				.get('/api/auth/friends')
				.set('x-telegram-init-data', 'mock-telegram-data')
				.set('Authorization', 'Bearer test-token');

			// Проверяем ответ с ошибкой
			expect(response.status).toBe(500);
			expect(response.body.message).toBeDefined();
		});
	});
});
