const request = require('supertest');
const express = require('express');
const artifactRouter = require('../../routes/artifact-router');
const artifactController = require('../../controllers/artifact-controller');

// Мокаем middleware
jest.mock('../../middlewares/auth-middleware', () =>
	jest.fn((req, res, next) => next())
);
jest.mock('../../middlewares/telegram-auth-middleware', () =>
	jest.fn((req, res, next) => next())
);
jest.mock('../../middlewares/rate-limit-middleware', () =>
	jest.fn(() => (req, res, next) => next())
);

// Мокаем контроллер
jest.mock('../../controllers/artifact-controller', () => ({
	addArtifactToUser: jest.fn((req, res) =>
		res.status(201).json({ message: 'Artifact added' })
	),
	getUserArtifacts: jest.fn((req, res) =>
		res.status(200).json({ artifacts: [] })
	),
	createSystemArtifactWithOffer: jest.fn((req, res) =>
		res.status(201).json({ message: 'System artifact created' })
	),
}));

describe('Artifact Router', () => {
	let app;
	let authMiddleware;
	let telegramAuthMiddleware;

	beforeEach(() => {
		// Получаем моки middleware
		authMiddleware = require('../../middlewares/auth-middleware');
		telegramAuthMiddleware = require('../../middlewares/telegram-auth-middleware');

		// Сбрасываем моки перед каждым тестом
		jest.clearAllMocks();

		// Создаем экземпляр Express приложения
		app = express();
		app.use(express.json());
		app.use('/artifact', artifactRouter);
	});

	describe('POST /artifact/artifact', () => {
		it('should use correct middleware and controller', async () => {
			// Подготавливаем тестовые данные
			const artifactData = {
				seed: 'artifact-seed-123',
				name: 'Test Artifact',
				rarity: 'COMMON',
			};

			// Выполняем запрос
			const response = await request(app)
				.post('/artifact/artifact')
				.send(artifactData);

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(artifactController.addArtifactToUser).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(201);
			expect(response.body).toEqual({ message: 'Artifact added' });
		});
	});

	describe('GET /artifact/artifact', () => {
		it('should use correct middleware and controller', async () => {
			// Выполняем запрос
			const response = await request(app).get('/artifact/artifact');

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(artifactController.getUserArtifacts).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(200);
			expect(response.body).toEqual({ artifacts: [] });
		});
	});

	describe('POST /artifact/system-offer', () => {
		it('should use correct middleware and controller', async () => {
			// Подготавливаем тестовые данные
			const requestData = {
				artifactData: {
					seed: 'system-artifact-seed',
					name: 'System Artifact',
					rarity: 'MYTHICAL',
				},
				offerData: {
					price: 1000,
					currency: 'tgStars',
				},
			};

			// Выполняем запрос
			const response = await request(app)
				.post('/artifact/system-offer')
				.send(requestData);

			// Проверяем, что использовались правильные middleware
			expect(telegramAuthMiddleware).toHaveBeenCalled();
			expect(authMiddleware).toHaveBeenCalled();

			// Проверяем, что вызван правильный метод контроллера
			expect(
				artifactController.createSystemArtifactWithOffer
			).toHaveBeenCalled();

			// Проверяем ответ
			expect(response.status).toBe(201);
			expect(response.body).toEqual({
				message: 'System artifact created',
			});
		});
	});
});
