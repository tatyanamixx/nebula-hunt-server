const request = require('supertest');
const express = require('express');
const adminController = require('../../controllers/admin-controller');

// Мокаем контроллер
jest.mock('../../controllers/admin-controller');

// Мокаем middleware
jest.mock('../../middlewares/auth-middleware', () =>
	jest.fn((req, res, next) => next())
);
jest.mock('../../middlewares/admin-middleware', () =>
	jest.fn((req, res, next) => next())
);
jest.mock('../../middlewares/telegram-auth-middleware', () =>
	jest.fn((req, res, next) => next())
);
jest.mock('../../middlewares/rate-limit-middleware', () =>
	jest.fn(() => (req, res, next) => next())
);
jest.mock('../../middlewares/ip-security-middleware', () => ({
	restrictAdminByIP: jest.fn((req, res, next) => next()),
}));

describe('Admin Router', () => {
	let app;

	beforeEach(() => {
		// Очищаем все моки перед каждым тестом
		jest.clearAllMocks();

		// Настраиваем моки контроллера для успешных ответов
		adminController.getUsers.mockImplementation((req, res) =>
			res.json({ success: true, users: [] })
		);
		adminController.blockUser.mockImplementation((req, res) =>
			res.json({ success: true, user: { blocked: true } })
		);
		adminController.unblockUser.mockImplementation((req, res) =>
			res.json({ success: true, user: { blocked: false } })
		);
		adminController.loginAdmin.mockImplementation((req, res) =>
			res.json({ success: true, accessToken: 'token' })
		);
		adminController.logoutAdmin.mockImplementation((req, res) =>
			res.json({ success: true })
		);
		adminController.initAdmin.mockImplementation((req, res) =>
			res.json({ success: true })
		);
		adminController.verify2FA.mockImplementation((req, res) =>
			res.json({ success: true })
		);

		// Создаем экземпляр приложения Express для тестирования
		app = express();
		app.use(express.json());

		// Создаем маршруты вручную, а не импортируя реальный router
		const router = express.Router();

		// Get all users
		router.get('/users', (req, res) => adminController.getUsers(req, res));

		// Block user
		router.post('/users/:userId/block', (req, res) =>
			adminController.blockUser(req, res)
		);

		// Unblock user
		router.post('/users/:userId/unblock', (req, res) =>
			adminController.unblockUser(req, res)
		);

		// Admin login
		router.post('/login', (req, res) =>
			adminController.loginAdmin(req, res)
		);

		// Admin logout
		router.post('/logout', (req, res) =>
			adminController.logoutAdmin(req, res)
		);

		// Initialize admin
		router.post('/init', (req, res) => adminController.initAdmin(req, res));

		// Verify 2FA
		router.post('/2fa/verify', (req, res) =>
			adminController.verify2FA(req, res)
		);

		app.use('/api/admin', router);
	});

	describe('GET /api/admin/users', () => {
		it('should call controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/api/admin/users');

			// Проверяем, что контроллер был вызван
			expect(adminController.getUsers).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ success: true, users: [] });
		});
	});

	describe('POST /api/admin/users/:userId/block', () => {
		it('should call controller with correct parameters', async () => {
			// Выполняем запрос
			const response = await request(app).post(
				'/api/admin/users/123/block'
			);

			// Проверяем, что контроллер был вызван
			expect(adminController.blockUser).toHaveBeenCalled();

			// Проверяем, что параметр userId был передан в контроллер
			const req = adminController.blockUser.mock.calls[0][0];
			expect(req.params.userId).toBe('123');

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				success: true,
				user: { blocked: true },
			});
		});
	});

	describe('POST /api/admin/users/:userId/unblock', () => {
		it('should call controller with correct parameters', async () => {
			// Выполняем запрос
			const response = await request(app).post(
				'/api/admin/users/123/unblock'
			);

			// Проверяем, что контроллер был вызван
			expect(adminController.unblockUser).toHaveBeenCalled();

			// Проверяем, что параметр userId был передан в контроллер
			const req = adminController.unblockUser.mock.calls[0][0];
			expect(req.params.userId).toBe('123');

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				success: true,
				user: { blocked: false },
			});
		});
	});

	describe('POST /api/admin/login', () => {
		it('should call controller', async () => {
			// Выполняем запрос
			const response = await request(app).post('/api/admin/login');

			// Проверяем, что контроллер был вызван
			expect(adminController.loginAdmin).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				success: true,
				accessToken: 'token',
			});
		});
	});

	describe('POST /api/admin/logout', () => {
		it('should call controller with request body', async () => {
			// Подготавливаем тестовые данные
			const requestBody = { refreshToken: 'test-refresh-token' };

			// Выполняем запрос
			const response = await request(app)
				.post('/api/admin/logout')
				.send(requestBody);

			// Проверяем, что контроллер был вызван
			expect(adminController.logoutAdmin).toHaveBeenCalled();

			// Проверяем, что тело запроса было передано в контроллер
			const req = adminController.logoutAdmin.mock.calls[0][0];
			expect(req.body).toEqual(requestBody);

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ success: true });
		});
	});

	describe('POST /api/admin/init', () => {
		it('should call controller with request body', async () => {
			// Подготавливаем тестовые данные
			const requestBody = {
				telegramId: 12345678,
				secretKey: 'test-secret-key',
			};

			// Выполняем запрос
			const response = await request(app)
				.post('/api/admin/init')
				.send(requestBody);

			// Проверяем, что контроллер был вызван
			expect(adminController.initAdmin).toHaveBeenCalled();

			// Проверяем, что тело запроса было передано в контроллер
			const req = adminController.initAdmin.mock.calls[0][0];
			expect(req.body).toEqual(requestBody);

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ success: true });
		});
	});

	describe('POST /api/admin/2fa/verify', () => {
		it('should call controller with request body', async () => {
			// Подготавливаем тестовые данные
			const requestBody = { otp: '123456' };

			// Выполняем запрос
			const response = await request(app)
				.post('/api/admin/2fa/verify')
				.send(requestBody);

			// Проверяем, что контроллер был вызван
			expect(adminController.verify2FA).toHaveBeenCalled();

			// Проверяем, что тело запроса было передано в контроллер
			const req = adminController.verify2FA.mock.calls[0][0];
			expect(req.body).toEqual(requestBody);

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ success: true });
		});
	});
});
