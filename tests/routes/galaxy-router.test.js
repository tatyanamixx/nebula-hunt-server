const galaxyController = require('../../controllers/galaxy-controller');
const authMiddleware = require('../../middlewares/auth-middleware');
const telegramAuthMiddleware = require('../../middlewares/telegram-auth-middleware');
const rateLimitMiddleware = require('../../middlewares/rate-limit-middleware');

// Мокаем middleware и контроллер
jest.mock('../../controllers/galaxy-controller', () => ({
	getUserGalaxies: jest.fn(),
	getGalaxy: jest.fn(),
	createUserGalaxy: jest.fn(),
	updateUserGalaxy: jest.fn(),
	deleteGalaxy: jest.fn(),
}));
jest.mock('../../middlewares/auth-middleware');
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

describe('Galaxy Router', () => {
	beforeEach(() => {
		// Очищаем моки перед каждым тестом
		jest.clearAllMocks();

		// Импортируем маршрутизатор заново для каждого теста
		jest.isolateModules(() => {
			require('../../routes/galaxy-router');
		});
	});

	it('should set up GET / route with proper middleware and controller', () => {
		// Проверяем, что маршрут GET / настроен правильно
		expect(mockGet).toHaveBeenCalledWith(
			'/',
			telegramAuthMiddleware,
			authMiddleware,
			'mocked-rate-limit',
			galaxyController.getUserGalaxies
		);
	});

	it('should set up GET /:galaxyId route with proper middleware and controller', () => {
		// Проверяем, что маршрут GET /:galaxyId настроен правильно
		expect(mockGet).toHaveBeenCalledWith(
			'/:galaxyId',
			telegramAuthMiddleware,
			authMiddleware,
			'mocked-rate-limit',
			galaxyController.getGalaxy
		);
	});

	it('should set up POST / route with proper middleware and controller', () => {
		// Проверяем, что маршрут POST / настроен правильно
		expect(mockPost).toHaveBeenCalledWith(
			'/',
			telegramAuthMiddleware,
			authMiddleware,
			'mocked-rate-limit',
			galaxyController.createUserGalaxy
		);
	});

	it('should set up PUT /:galaxyId route with proper middleware and controller', () => {
		// Проверяем, что маршрут PUT /:galaxyId настроен правильно
		expect(mockPut).toHaveBeenCalledWith(
			'/:galaxyId',
			telegramAuthMiddleware,
			authMiddleware,
			'mocked-rate-limit',
			galaxyController.updateUserGalaxy
		);
	});

	it('should set up DELETE /:galaxyId route with proper middleware and controller', () => {
		// Проверяем, что маршрут DELETE /:galaxyId настроен правильно
		expect(mockDelete).toHaveBeenCalledWith(
			'/:galaxyId',
			telegramAuthMiddleware,
			authMiddleware,
			'mocked-rate-limit',
			galaxyController.deleteGalaxy
		);
	});
});
