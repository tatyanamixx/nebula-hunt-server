const taskTemplateController = require('../../controllers/task-template-controller');
const authMiddleware = require('../../middlewares/auth-middleware');
const adminMiddleware = require('../../middlewares/admin-middleware');
const telegramAuthMiddleware = require('../../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../../middlewares/rate-limit-middleware');

// Мокаем middleware и контроллер
jest.mock('../../controllers/task-template-controller', () => ({
	getAllTaskTemplates: jest.fn(),
	getTaskTemplate: jest.fn(),
	createTaskTemplate: jest.fn(),
	updateTaskTemplate: jest.fn(),
	deleteTaskTemplate: jest.fn(),
	activateTaskTemplate: jest.fn(),
	deactivateTaskTemplate: jest.fn(),
}));
jest.mock('../../middlewares/auth-middleware');
jest.mock('../../middlewares/admin-middleware');
jest.mock('../../middlewares/telegram-auth-middleware');
jest.mock('../../middlewares/rate-limit-middleware', () =>
	jest.fn(() => 'mocked-rate-limit')
);

// Мокаем express Router
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();

jest.mock('express', () => {
	return {
		Router: jest.fn(() => ({
			get: mockGet,
			post: mockPost,
			put: mockPut,
			delete: mockDelete,
		})),
	};
});

describe('Task Template Router', () => {
	beforeEach(() => {
		// Очищаем моки перед каждым тестом
		jest.clearAllMocks();

		// Импортируем роутер заново для каждого теста
		jest.isolateModules(() => {
			require('../../routes/task-template-router');
		});
	});

	it('should set up GET / route with proper middleware and controller', () => {
		// Проверяем, что маршрут настроен правильно
		expect(mockGet).toHaveBeenCalledWith(
			'/',
			telegramAuthMiddleware,
			authMiddleware,
			adminMiddleware,
			'mocked-rate-limit',
			taskTemplateController.getAllTaskTemplates
		);

		// Проверяем, что rateLimitMiddleware вызван с правильными параметрами
		expect(rateLimitMiddleware).toHaveBeenCalledWith(60, 60);
	});

	it('should set up GET /:taskId route with proper middleware and controller', () => {
		// Проверяем, что маршрут настроен правильно
		expect(mockGet).toHaveBeenCalledWith(
			'/:taskId',
			telegramAuthMiddleware,
			authMiddleware,
			adminMiddleware,
			'mocked-rate-limit',
			taskTemplateController.getTaskTemplate
		);

		// Проверяем, что rateLimitMiddleware вызван с правильными параметрами
		expect(rateLimitMiddleware).toHaveBeenCalledWith(60, 60);
	});

	it('should set up POST / route with proper middleware and controller', () => {
		// Проверяем, что маршрут настроен правильно
		expect(mockPost).toHaveBeenCalledWith(
			'/',
			telegramAuthMiddleware,
			authMiddleware,
			adminMiddleware,
			'mocked-rate-limit',
			taskTemplateController.createTaskTemplate
		);

		// Проверяем, что rateLimitMiddleware вызван с правильными параметрами
		expect(rateLimitMiddleware).toHaveBeenCalledWith(30, 60);
	});

	it('should set up PUT /:taskId route with proper middleware and controller', () => {
		// Проверяем, что маршрут настроен правильно
		expect(mockPut).toHaveBeenCalledWith(
			'/:taskId',
			telegramAuthMiddleware,
			authMiddleware,
			adminMiddleware,
			'mocked-rate-limit',
			taskTemplateController.updateTaskTemplate
		);

		// Проверяем, что rateLimitMiddleware вызван с правильными параметрами
		expect(rateLimitMiddleware).toHaveBeenCalledWith(30, 60);
	});

	it('should set up DELETE /:taskId route with proper middleware and controller', () => {
		// Проверяем, что маршрут настроен правильно
		expect(mockDelete).toHaveBeenCalledWith(
			'/:taskId',
			telegramAuthMiddleware,
			authMiddleware,
			adminMiddleware,
			'mocked-rate-limit',
			taskTemplateController.deleteTaskTemplate
		);

		// Проверяем, что rateLimitMiddleware вызван с правильными параметрами
		expect(rateLimitMiddleware).toHaveBeenCalledWith(10, 60);
	});

	it('should set up POST /:taskId/activate route with proper middleware and controller', () => {
		// Проверяем, что маршрут настроен правильно
		expect(mockPost).toHaveBeenCalledWith(
			'/:taskId/activate',
			telegramAuthMiddleware,
			authMiddleware,
			adminMiddleware,
			'mocked-rate-limit',
			taskTemplateController.activateTaskTemplate
		);

		// Проверяем, что rateLimitMiddleware вызван с правильными параметрами
		expect(rateLimitMiddleware).toHaveBeenCalledWith(30, 60);
	});

	it('should set up POST /:taskId/deactivate route with proper middleware and controller', () => {
		// Проверяем, что маршрут настроен правильно
		expect(mockPost).toHaveBeenCalledWith(
			'/:taskId/deactivate',
			telegramAuthMiddleware,
			authMiddleware,
			adminMiddleware,
			'mocked-rate-limit',
			taskTemplateController.deactivateTaskTemplate
		);

		// Проверяем, что rateLimitMiddleware вызван с правильными параметрами
		expect(rateLimitMiddleware).toHaveBeenCalledWith(30, 60);
	});
});
