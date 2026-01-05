const request = require('supertest');
const express = require('express');
const upgradeRouter = require('../../routes/upgrade-router');
const upgradeController = require('../../controllers/upgrade-controller');

// Мокаем middleware
jest.mock('../../middlewares/auth-middleware', () =>
	jest.fn((req, res, next) => next())
);
jest.mock('../../middlewares/telegram-auth-middleware', () =>
	jest.fn((req, res, next) => next())
);
jest.mock('../../middlewares/admin-middleware', () =>
	jest.fn((req, res, next) => next())
);
jest.mock('../../middlewares/rate-limit-middleware', () =>
	jest.fn(() => (req, res, next) => next())
);

// Мокаем контроллер
jest.mock('../../controllers/upgrade-controller', () => ({
	getAvailableUpgrades: jest.fn((req, res) =>
		res.status(200).json({ upgrades: [] })
	),
	getUserUpgrade: jest.fn((req, res) =>
		res.status(200).json({ upgrade: { id: req.params.upgradeId } })
	),
	purchaseUpgrade: jest.fn((req, res) =>
		res.status(200).json({ success: true })
	),
	updateUpgradeProgress: jest.fn((req, res) =>
		res.status(200).json({ success: true })
	),
	getUpgradeStats: jest.fn((req, res) =>
		res.status(200).json({ stats: {} })
	),
	resetUpgrades: jest.fn((req, res) =>
		res.status(200).json({ success: true })
	),
}));

describe('Upgrade Router', () => {
	let app;
	let authMiddleware;
	let telegramAuthMiddleware;
	let adminAuthMiddleware;

	beforeEach(() => {
		// Получаем моки middleware
		authMiddleware = require('../../middlewares/auth-middleware');
		telegramAuthMiddleware = require('../../middlewares/telegram-auth-middleware');
		adminAuthMiddleware = require('../../middlewares/admin-auth-middleware');

		// Сбрасываем моки перед каждым тестом
		jest.clearAllMocks();

		// Создаем экземпляр Express приложения
		app = express();
		app.use(express.json());
		app.use('/upgrades', upgradeRouter);
	});

	describe('GET /upgrades', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/upgrades');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(upgradeController.getAvailableUpgrades).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ upgrades: [] });
		});
	});

	describe('GET /upgrades/:upgradeId', () => {
		it('should use correct middleware and controller with upgradeId param', async () => {
			const upgradeId = '123';

			// Выполняем запрос
			const response = await request(app).get(
				`/upgrades/${upgradeId}`
			);

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(upgradeController.getUserUpgrade).toHaveBeenCalled();

			// Проверяем, что upgradeId передан правильно
			expect(response.body.upgrade.id).toBe(upgradeId);

			// Проверяем ответ
			expect(response.status).toBe(200);
		});
	});

	describe('POST /upgrades/purchase/:upgradeId', () => {
		it('should use correct middleware and controller', async () => {
			const upgradeId = '123';

			// Выполняем запрос
			const response = await request(app).post(
				`/upgrades/purchase/${upgradeId}`
			);

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(upgradeController.purchaseUpgrade).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ success: true });
		});
	});

	describe('PUT /upgrades/:upgradeId/progress', () => {
		it('should use correct middleware and controller', async () => {
			const upgradeId = '123';
			const requestData = { progress: 75 };

			// Выполняем запрос
			const response = await request(app)
				.put(`/upgrades/${upgradeId}/progress`)
				.send(requestData);

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(upgradeController.updateUpgradeProgress).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ success: true });
		});
	});

	describe('POST /upgrades/reset', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).post('/upgrades/reset');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(upgradeController.resetUpgrades).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ success: true });
		});
	});

	describe('GET /upgrades/stats', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/upgrades/stats');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(upgradeController.getUpgradeStats).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ stats: {} });
		});
	});


});
