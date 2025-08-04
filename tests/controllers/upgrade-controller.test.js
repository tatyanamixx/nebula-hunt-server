const upgradeController = require('../../controllers/upgrade-controller');
const upgradeService = require('../../service/upgrade-service');
const ApiError = require('../../exceptions/api-error');

// Мокаем сервис апгрейдов
jest.mock('../../service/upgrade-service', () => ({
	createUpgradeNodes: jest.fn(),
	updateUpgradeNode: jest.fn(),
	deleteUpgradeNode: jest.fn(),
	getAllUpgradeNodes: jest.fn(),
	getUserUpgradeNodes: jest.fn(),
	getUserUpgradeNode: jest.fn(),
	completeUpgradeNode: jest.fn(),
	updateUpgradeProgress: jest.fn(),
	getUpgradeProgress: jest.fn(),
	initializeUserUpgradeTree: jest.fn(),
	getUserUpgradeStats: jest.fn(),
	getAvailableUpgrades: jest.fn(),
}));

describe('UpgradeController', () => {
	let req;
	let res;
	let next;

	beforeEach(() => {
		// Сбрасываем моки перед каждым тестом
		jest.clearAllMocks();

		// Создаем моки для req, res и next
		req = {
			body: {},
			params: {},
			initdata: {
				id: 1,
			},
		};

		res = {
			json: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
		};

		next = jest.fn();
	});

	describe('createUpgradeNodes', () => {
		it('should create upgrade nodes and return result', async () => {
			// Подготавливаем тестовые данные
			const nodes = [
				{ name: 'Node 1', requirements: [] },
				{ name: 'Node 2', requirements: ['Node 1'] },
			];
			const mockResult = [
				{ id: 1, name: 'Node 1', requirements: [] },
				{ id: 2, name: 'Node 2', requirements: ['Node 1'] },
			];

			// Устанавливаем входные данные запроса
			req.body = { nodes };

			// Устанавливаем мок для сервиса
			upgradeService.createUpgradeNodes.mockResolvedValue(mockResult);

			// Вызываем тестируемый метод
			await upgradeController.createUpgradeNodes(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(upgradeService.createUpgradeNodes).toHaveBeenCalledWith(
				nodes
			);

			// Проверяем, что ответ был отправлен с правильными данными
			expect(res.json).toHaveBeenCalledWith(mockResult);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error if nodes array is missing', async () => {
			// Устанавливаем входные данные запроса без nodes
			req.body = {};

			// Вызываем тестируемый метод
			await upgradeController.createUpgradeNodes(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalledWith(expect.any(ApiError));
			expect(upgradeService.createUpgradeNodes).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
		});

		it('should call next with error if nodes is not an array', async () => {
			// Устанавливаем входные данные запроса с неправильным типом nodes
			req.body = { nodes: 'not an array' };

			// Вызываем тестируемый метод
			await upgradeController.createUpgradeNodes(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalledWith(expect.any(ApiError));
			expect(upgradeService.createUpgradeNodes).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
		});

		it('should call next with error from service', async () => {
			// Подготавливаем тестовые данные
			const nodes = [{ name: 'Node 1' }];
			const mockError = new Error('Service error');

			// Устанавливаем входные данные запроса
			req.body = { nodes };

			// Устанавливаем мок для сервиса, который выбрасывает ошибку
			upgradeService.createUpgradeNodes.mockRejectedValue(mockError);

			// Вызываем тестируемый метод
			await upgradeController.createUpgradeNodes(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalledWith(mockError);
			expect(res.json).not.toHaveBeenCalled();
		});
	});

	describe('getUserUpgradeNodes', () => {
		it('should return user upgrade nodes', async () => {
			// Подготавливаем тестовые данные
			const userId = req.initdata.id;
			const mockNodes = [
				{ id: 1, name: 'Node 1', status: 'AVAILABLE' },
				{ id: 2, name: 'Node 2', status: 'LOCKED' },
			];

			// Устанавливаем мок для сервиса
			upgradeService.getUserUpgradeNodes.mockResolvedValue(mockNodes);

			// Вызываем тестируемый метод
			await upgradeController.getUserUpgradeNodes(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(upgradeService.getUserUpgradeNodes).toHaveBeenCalledWith(
				userId
			);

			// Проверяем, что ответ был отправлен с правильными данными
			expect(res.json).toHaveBeenCalledWith(mockNodes);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error from service', async () => {
			// Устанавливаем мок для сервиса, который выбрасывает ошибку
			const mockError = new Error('Service error');
			upgradeService.getUserUpgradeNodes.mockRejectedValue(mockError);

			// Вызываем тестируемый метод
			await upgradeController.getUserUpgradeNodes(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalledWith(mockError);
			expect(res.json).not.toHaveBeenCalled();
		});
	});

	describe('getUserUpgradeNode', () => {
		it('should return user upgrade node by id', async () => {
			// Подготавливаем тестовые данные
			const userId = req.initdata.id;
			const nodeId = '123';
			const mockNode = {
				id: nodeId,
				name: 'Node 1',
				status: 'AVAILABLE',
			};

			// Устанавливаем входные данные запроса
			req.params = { nodeId };

			// Устанавливаем мок для сервиса
			upgradeService.getUserUpgradeNode.mockResolvedValue(mockNode);

			// Вызываем тестируемый метод
			await upgradeController.getUserUpgradeNode(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(upgradeService.getUserUpgradeNode).toHaveBeenCalledWith(
				userId,
				nodeId
			);

			// Проверяем, что ответ был отправлен с правильными данными
			expect(res.json).toHaveBeenCalledWith(mockNode);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error if nodeId is missing', async () => {
			// Устанавливаем входные данные запроса без nodeId
			req.params = {};

			// Вызываем тестируемый метод
			await upgradeController.getUserUpgradeNode(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalledWith(expect.any(ApiError));
			expect(upgradeService.getUserUpgradeNode).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
		});
	});

	describe('completeUpgradeNode', () => {
		it('should complete upgrade node and return result', async () => {
			// Подготавливаем тестовые данные
			const userId = req.initdata.id;
			const nodeId = '123';
			const mockResult = {
				success: true,
				node: { id: nodeId, status: 'COMPLETED' },
			};

			// Устанавливаем входные данные запроса
			req.body = { nodeId };

			// Устанавливаем мок для сервиса
			upgradeService.completeUpgradeNode.mockResolvedValue(mockResult);

			// Вызываем тестируемый метод
			await upgradeController.completeUpgradeNode(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(upgradeService.completeUpgradeNode).toHaveBeenCalledWith(
				userId,
				nodeId
			);

			// Проверяем, что ответ был отправлен с правильными данными
			expect(res.json).toHaveBeenCalledWith(mockResult);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error if nodeId is missing', async () => {
			// Устанавливаем входные данные запроса без nodeId
			req.body = {};

			// Вызываем тестируемый метод
			await upgradeController.completeUpgradeNode(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalledWith(expect.any(ApiError));
			expect(upgradeService.completeUpgradeNode).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
		});
	});

	describe('updateUpgradeProgress', () => {
		it('should update upgrade progress and return result', async () => {
			// Подготавливаем тестовые данные
			const userId = req.initdata.id;
			const nodeId = '123';
			const progress = 75;
			const mockResult = { success: true, progress };

			// Устанавливаем входные данные запроса
			req.body = { nodeId, progress };

			// Устанавливаем мок для сервиса
			upgradeService.updateUpgradeProgress.mockResolvedValue(mockResult);

			// Вызываем тестируемый метод
			await upgradeController.updateUpgradeProgress(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(upgradeService.updateUpgradeProgress).toHaveBeenCalledWith(
				userId,
				nodeId,
				progress
			);

			// Проверяем, что ответ был отправлен с правильными данными
			expect(res.json).toHaveBeenCalledWith(mockResult);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error if required parameters are missing', async () => {
			// Устанавливаем входные данные запроса без nodeId
			req.body = { progress: 50 };

			// Вызываем тестируемый метод
			await upgradeController.updateUpgradeProgress(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalledWith(expect.any(ApiError));
			expect(upgradeService.updateUpgradeProgress).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();

			// Сбрасываем моки
			jest.clearAllMocks();

			// Устанавливаем входные данные запроса без progress
			req.body = { nodeId: '123' };

			// Вызываем тестируемый метод
			await upgradeController.updateUpgradeProgress(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalledWith(expect.any(ApiError));
			expect(upgradeService.updateUpgradeProgress).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
		});
	});

	describe('initializeUserUpgradeTree', () => {
		it('should initialize user upgrade tree and return result', async () => {
			// Подготавливаем тестовые данные
			const userId = req.initdata.id;
			const mockResult = {
				initialized: true,
				nodes: [{ id: 1, name: 'Node 1' }],
			};

			// Устанавливаем мок для сервиса
			upgradeService.initializeUserUpgradeTree.mockResolvedValue(
				mockResult
			);

			// Вызываем тестируемый метод
			await upgradeController.initializeUserUpgradeTree(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(
				upgradeService.initializeUserUpgradeTree
			).toHaveBeenCalledWith(userId);

			// Проверяем, что ответ был отправлен с правильными данными
			expect(res.json).toHaveBeenCalledWith(mockResult);
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe('getAvailableUpgrades', () => {
		it('should return all upgrades successfully', async () => {
			// Подготавливаем тестовые данные
			const userId = req.initdata.id;
			const mockUpgrades = [
				{
					id: 1,
					slug: 'stardust_production',
					name: 'Stardust Production',
					userProgress: {
						id: 1,
						level: 2,
						progress: 50,
						completed: false,
					},
				},
				{
					id: 2,
					slug: 'dark_matter_synthesis',
					name: 'Dark Matter Synthesis',
					userProgress: {
						id: null,
						level: 0,
						progress: 0,
						completed: false,
					},
				},
			];

			// Устанавливаем мок для сервиса
			upgradeService.getAvailableUpgrades.mockResolvedValue(mockUpgrades);

			// Вызываем тестируемый метод
			await upgradeController.getAvailableUpgrades(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(upgradeService.getAvailableUpgrades).toHaveBeenCalledWith(
				userId
			);

			// Проверяем, что ответ был отправлен с правильными данными
			expect(res.json).toHaveBeenCalledWith(mockUpgrades);
			expect(next).not.toHaveBeenCalled();
		});

		it('should handle service error', async () => {
			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to get available upgrades';
			upgradeService.getAvailableUpgrades.mockRejectedValue(
				new Error(errorMessage)
			);

			// Вызываем метод контроллера
			await upgradeController.getAvailableUpgrades(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('getUserUpgradeStats', () => {
		it('should return user upgrade stats', async () => {
			// Подготавливаем тестовые данные
			const userId = req.initdata.id;
			const mockStats = {
				totalNodes: 10,
				completedNodes: 3,
				availableNodes: 5,
				lockedNodes: 2,
			};

			// Устанавливаем мок для сервиса
			upgradeService.getUserUpgradeStats.mockResolvedValue(mockStats);

			// Вызываем тестируемый метод
			await upgradeController.getUserUpgradeStats(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(upgradeService.getUserUpgradeStats).toHaveBeenCalledWith(
				userId
			);

			// Проверяем, что ответ был отправлен с правильными данными
			expect(res.json).toHaveBeenCalledWith(mockStats);
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe('getAllUpgradeNodes', () => {
		it('should return all upgrade nodes', async () => {
			// Подготавливаем тестовые данные
			const mockNodes = [
				{ id: 1, name: 'Node 1', requirements: [] },
				{ id: 2, name: 'Node 2', requirements: ['Node 1'] },
			];

			// Устанавливаем мок для сервиса
			upgradeService.getAllUpgradeNodes.mockResolvedValue(mockNodes);

			// Вызываем тестируемый метод
			await upgradeController.getAllUpgradeNodes(req, res, next);

			// Проверяем, что сервис был вызван
			expect(upgradeService.getAllUpgradeNodes).toHaveBeenCalled();

			// Проверяем, что ответ был отправлен с правильными данными
			expect(res.json).toHaveBeenCalledWith(mockNodes);
			expect(next).not.toHaveBeenCalled();
		});
	});
});
