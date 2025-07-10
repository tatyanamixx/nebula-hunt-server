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
	getUserUpgradeNodes: jest.fn((req, res) =>
		res.status(200).json({ nodes: [] })
	),
	getUserUpgradeNode: jest.fn((req, res) =>
		res.status(200).json({ node: { id: req.params.nodeId } })
	),
	completeUpgradeNode: jest.fn((req, res) =>
		res.status(200).json({ success: true })
	),
	updateUpgradeProgress: jest.fn((req, res) =>
		res.status(200).json({ success: true })
	),
	getUpgradeProgress: jest.fn((req, res) =>
		res.status(200).json({ progress: 50 })
	),
	initializeUserUpgradeTree: jest.fn((req, res) =>
		res.status(200).json({ initialized: true })
	),
	getUserUpgradeStats: jest.fn((req, res) =>
		res.status(200).json({ stats: {} })
	),
	createUpgradeNodes: jest.fn((req, res) =>
		res.status(201).json({ created: true })
	),
	getAllUpgradeNodes: jest.fn((req, res) =>
		res.status(200).json({ nodes: [] })
	),
}));

describe('Upgrade Router', () => {
	let app;
	let authMiddleware;
	let telegramAuthMiddleware;
	let adminMiddleware;

	beforeEach(() => {
		// Получаем моки middleware
		authMiddleware = require('../../middlewares/auth-middleware');
		telegramAuthMiddleware = require('../../middlewares/telegram-auth-middleware');
		adminMiddleware = require('../../middlewares/admin-middleware');

		// Сбрасываем моки перед каждым тестом
		jest.clearAllMocks();

		// Создаем экземпляр Express приложения
		app = express();
		app.use(express.json());
		app.use('/upgrades', upgradeRouter);
	});

	describe('GET /upgrades/nodes', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/upgrades/nodes');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(upgradeController.getUserUpgradeNodes).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ nodes: [] });
		});
	});

	describe('GET /upgrades/nodes/:nodeId', () => {
		it('should use correct middleware and controller with nodeId param', async () => {
			const nodeId = '123';

			// Выполняем запрос
			const response = await request(app).get(
				`/upgrades/nodes/${nodeId}`
			);

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(upgradeController.getUserUpgradeNode).toHaveBeenCalled();

			// Проверяем, что nodeId передан правильно
			expect(response.body.node.id).toBe(nodeId);

			// Проверяем ответ
			expect(response.status).toBe(200);
		});
	});

	describe('POST /upgrades/complete', () => {
		it('should use correct middleware and controller', async () => {
			// Подготавливаем тестовые данные
			const requestData = {
				nodeId: '123',
			};

			// Выполняем запрос
			const response = await request(app)
				.post('/upgrades/complete')
				.send(requestData);

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(upgradeController.completeUpgradeNode).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ success: true });
		});
	});

	describe('POST /upgrades/progress', () => {
		it('should use correct middleware and controller', async () => {
			// Подготавливаем тестовые данные
			const requestData = {
				nodeId: '123',
				progress: 50,
			};

			// Выполняем запрос
			const response = await request(app)
				.post('/upgrades/progress')
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

	describe('GET /upgrades/progress/:nodeId', () => {
		it('should use correct middleware and controller with nodeId param', async () => {
			const nodeId = '123';

			// Выполняем запрос
			const response = await request(app).get(
				`/upgrades/progress/${nodeId}`
			);

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(upgradeController.getUpgradeProgress).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ progress: 50 });
		});
	});

	describe('POST /upgrades/initialize', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).post('/upgrades/initialize');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(
				upgradeController.initializeUserUpgradeTree
			).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ initialized: true });
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
			expect(upgradeController.getUserUpgradeStats).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ stats: {} });
		});
	});

	describe('POST /upgrades/admin/nodes', () => {
		it('should use correct middleware and controller including admin middleware', async () => {
			// Подготавливаем тестовые данные
			const requestData = {
				nodes: [{ name: 'Test Node' }],
			};

			// Выполняем запрос
			const response = await request(app)
				.post('/upgrades/admin/nodes')
				.send(requestData);

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();
			expect(adminMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(upgradeController.createUpgradeNodes).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(201);
			expect(response.body).toEqual({ created: true });
		});
	});

	describe('GET /upgrades/admin/available', () => {
		it('should use correct middleware and controller including admin middleware', async () => {
			// Выполняем запрос
			const response = await request(app).get(
				'/upgrades/admin/available'
			);

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();
			expect(adminMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(upgradeController.getAllUpgradeNodes).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ nodes: [] });
		});
	});
});
