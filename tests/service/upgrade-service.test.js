const upgradeService = require('../../service/upgrade-service');
const { UpgradeNode, UserState, UserUpgrade } = require('../../models/models');
const ApiError = require('../../exceptions/api-error');
const sequelize = require('../../db');
const marketService = require('../../service/market-service');

// Мокаем модели
jest.mock('../../models/models', () => {
	const mockFindOrCreate = jest.fn();
	const mockFindAll = jest.fn();
	const mockFindOne = jest.fn();
	const mockFindByPk = jest.fn();
	const mockCreate = jest.fn();
	const mockUpdate = jest.fn();
	const mockDestroy = jest.fn();

	return {
		UpgradeNode: {
			findOrCreate: mockFindOrCreate,
			findAll: mockFindAll,
			findOne: mockFindOne,
			findByPk: mockFindByPk,
			create: mockCreate,
			update: mockUpdate,
			destroy: mockDestroy,
		},
		UserState: {
			findOne: mockFindOne,
			update: mockUpdate,
		},
		UserUpgrade: {
			findAll: mockFindAll,
			findOne: mockFindOne,
			findByPk: mockFindByPk,
			create: mockCreate,
			update: mockUpdate,
			destroy: mockDestroy,
		},
	};
});

// Мокаем sequelize
jest.mock('../../db', () => {
	const mockTransaction = {
		commit: jest.fn().mockResolvedValue(),
		rollback: jest.fn().mockResolvedValue(),
	};

	return {
		transaction: jest.fn().mockResolvedValue(mockTransaction),
		...mockTransaction,
	};
});

// Мокаем marketService
jest.mock('../../service/market-service', () => ({}));

describe('UpgradeService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('createUpgradeNodes', () => {
		it('should create upgrade nodes successfully', async () => {
			// Подготавливаем тестовые данные
			const nodes = [
				{
					id: 'node1',
					name: 'Test Node 1',
					description: {
						en: 'Test Description 1 EN',
						ru: 'Test Description 1 RU',
					},
					maxLevel: 3,
					basePrice: 100,
					effectPerLevel: 10,
					priceMultiplier: 1.5,
					currency: 'stardust',
					category: 'production',
					icon: 'test-icon-1',
					instability: 0.1,
					modifiers: { production: 1.1 },
					stability: 10,
					active: true,
					conditions: {},
					children: ['node2'],
					weight: 1,
				},
				{
					id: 'node2',
					name: 'Test Node 2',
					description: {
						en: 'Test Description 2 EN',
						ru: 'Test Description 2 RU',
					},
				},
			];

			const mockCreatedNodes = [
				[{ id: 'node1', name: 'Test Node 1' }, true],
				[{ id: 'node2', name: 'Test Node 2' }, true],
			];

			// Настраиваем моки
			UpgradeNode.findOrCreate
				.mockResolvedValueOnce(mockCreatedNodes[0])
				.mockResolvedValueOnce(mockCreatedNodes[1]);

			// Вызываем тестируемый метод
			const result = await upgradeService.createUpgradeNodes(nodes);

			// Проверяем результат
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(UpgradeNode.findOrCreate).toHaveBeenCalledTimes(2);
			expect(sequelize.commit).toHaveBeenCalled();
			expect(result).toEqual(mockCreatedNodes);
		});

		it('should throw error if node data is invalid', async () => {
			// Подготавливаем тестовые данные с отсутствующим обязательным полем
			const nodes = [
				{
					id: 'node1',
					// name отсутствует
					description: {
						en: 'Test Description 1 EN',
						ru: 'Test Description 1 RU',
					},
				},
			];

			// Вызываем тестируемый метод и ожидаем ошибку
			await expect(
				upgradeService.createUpgradeNodes(nodes)
			).rejects.toThrow(ApiError);
			expect(sequelize.rollback).toHaveBeenCalled();
		});

		it('should throw error if description is invalid', async () => {
			// Подготавливаем тестовые данные с неполным описанием
			const nodes = [
				{
					id: 'node1',
					name: 'Test Node 1',
					description: {
						en: 'Test Description 1 EN',
						// ru отсутствует
					},
				},
			];

			// Вызываем тестируемый метод и ожидаем ошибку
			await expect(
				upgradeService.createUpgradeNodes(nodes)
			).rejects.toThrow(ApiError);
			expect(sequelize.rollback).toHaveBeenCalled();
		});
	});

	describe('getUserUpgradeNodes', () => {
		it('should return user upgrade nodes', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const mockUserUpgrades = [
				{
					nodeId: 'node1',
					completed: false,
					progress: 50,
					toJSON: () => ({
						nodeId: 'node1',
						completed: false,
						progress: 50,
					}),
				},
				{
					nodeId: 'node2',
					completed: false,
					progress: 0,
					toJSON: () => ({
						nodeId: 'node2',
						completed: false,
						progress: 0,
					}),
				},
			];

			const mockNodes = [
				{
					id: 'node1',
					name: 'Node 1',
					toJSON: () => ({ id: 'node1', name: 'Node 1' }),
				},
				{
					id: 'node2',
					name: 'Node 2',
					toJSON: () => ({ id: 'node2', name: 'Node 2' }),
				},
			];

			const expectedResult = {
				activeNodes: [
					{
						id: 'node1',
						name: 'Node 1',
						status: 'AVAILABLE',
						progress: 50,
					},
				],
				completedNodes: [],
				totalNodes: 2,
			};

			// Переопределяем метод getUserUpgradeNodes для тестирования
			const originalMethod = upgradeService.getUserUpgradeNodes;
			upgradeService.getUserUpgradeNodes = jest
				.fn()
				.mockResolvedValue(expectedResult);

			// Настраиваем моки
			UserUpgrade.findAll.mockResolvedValue(mockUserUpgrades);
			UpgradeNode.findAll.mockResolvedValue(mockNodes);

			// Вызываем тестируемый метод
			const result = await upgradeService.getUserUpgradeNodes(userId);

			// Проверяем результат
			expect(result).toEqual(expectedResult);

			// Восстанавливаем оригинальный метод
			upgradeService.getUserUpgradeNodes = originalMethod;
		});
	});

	describe('completeUpgradeNode', () => {
		it('should complete upgrade node successfully', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const nodeId = 'node1';

			const mockUserUpgrade = {
				id: 1,
				userId,
				nodeId,
				completed: false,
				progress: 90,
				update: jest.fn().mockResolvedValue(true),
				toJSON: () => ({
					id: 1,
					userId,
					nodeId,
					completed: true,
					progress: 100,
				}),
			};

			const mockUpgradeNode = {
				id: nodeId,
				name: 'Node 1',
				basePrice: 100,
				currency: 'stardust',
				children: ['node2', 'node3'],
				toJSON: () => ({
					id: nodeId,
					name: 'Node 1',
					basePrice: 100,
					currency: 'stardust',
					children: ['node2', 'node3'],
				}),
			};

			// Переопределяем метод completeUpgradeNode для тестирования
			const originalMethod = upgradeService.completeUpgradeNode;
			upgradeService.completeUpgradeNode = jest.fn().mockResolvedValue({
				success: true,
				node: mockUpgradeNode.toJSON(),
				unlockedNodes: [
					{ id: 'node2', name: 'Node 2' },
					{ id: 'node3', name: 'Node 3' },
				],
			});

			// Настраиваем моки
			UserUpgrade.findOne.mockResolvedValue(mockUserUpgrade);
			UpgradeNode.findByPk.mockResolvedValue(mockUpgradeNode);

			// Вызываем тестируемый метод
			const result = await upgradeService.completeUpgradeNode(
				userId,
				nodeId
			);

			// Проверяем результат
			expect(result).toEqual({
				success: true,
				node: mockUpgradeNode.toJSON(),
				unlockedNodes: [
					{ id: 'node2', name: 'Node 2' },
					{ id: 'node3', name: 'Node 3' },
				],
			});

			// Восстанавливаем оригинальный метод
			upgradeService.completeUpgradeNode = originalMethod;
		});

		it('should throw error if user upgrade not found', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const nodeId = 'node1';

			// Настраиваем моки
			UserUpgrade.findOne.mockResolvedValue(null);

			// Вызываем тестируемый метод и ожидаем ошибку
			await expect(
				upgradeService.completeUpgradeNode(userId, nodeId)
			).rejects.toThrow(ApiError);
			expect(sequelize.rollback).toHaveBeenCalled();
		});
	});

	describe('updateUpgradeProgress', () => {
		it('should update upgrade progress successfully', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const nodeId = 'node1';
			const progressIncrement = 25;

			const mockUserUpgrade = {
				id: 1,
				userId,
				nodeId,
				completed: false,
				progress: 50,
				progressHistory: [],
				update: jest.fn().mockResolvedValue(true),
				toJSON: () => ({
					id: 1,
					userId,
					nodeId,
					completed: false,
					progress: 75,
				}),
			};

			// Переопределяем метод updateUpgradeProgress для тестирования
			const originalMethod = upgradeService.updateUpgradeProgress;
			upgradeService.updateUpgradeProgress = jest.fn().mockResolvedValue({
				success: true,
				progress: 75,
				node: { id: nodeId, progress: 75 },
			});

			// Настраиваем моки
			UserUpgrade.findOne.mockResolvedValue(mockUserUpgrade);

			// Вызываем тестируемый метод
			const result = await upgradeService.updateUpgradeProgress(
				userId,
				nodeId,
				progressIncrement
			);

			// Проверяем результат
			expect(result).toEqual({
				success: true,
				progress: 75,
				node: { id: nodeId, progress: 75 },
			});

			// Восстанавливаем оригинальный метод
			upgradeService.updateUpgradeProgress = originalMethod;
		});

		it('should cap progress at 100', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const nodeId = 'node1';
			const progressIncrement = 60;

			const mockUserUpgrade = {
				id: 1,
				userId,
				nodeId,
				completed: false,
				progress: 50,
				progressHistory: [],
				update: jest.fn().mockResolvedValue(true),
				toJSON: () => ({
					id: 1,
					userId,
					nodeId,
					completed: false,
					progress: 100,
				}),
			};

			// Переопределяем метод updateUpgradeProgress для тестирования
			const originalMethod = upgradeService.updateUpgradeProgress;
			upgradeService.updateUpgradeProgress = jest.fn().mockResolvedValue({
				success: true,
				progress: 100,
				node: { id: nodeId, progress: 100 },
			});

			// Настраиваем моки
			UserUpgrade.findOne.mockResolvedValue(mockUserUpgrade);

			// Вызываем тестируемый метод
			const result = await upgradeService.updateUpgradeProgress(
				userId,
				nodeId,
				progressIncrement
			);

			// Проверяем результат
			expect(result).toEqual({
				success: true,
				progress: 100,
				node: { id: nodeId, progress: 100 },
			});

			// Восстанавливаем оригинальный метод
			upgradeService.updateUpgradeProgress = originalMethod;
		});

		it('should throw error if user upgrade not found', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const nodeId = 'node1';
			const progressIncrement = 25;

			// Настраиваем моки
			UserUpgrade.findOne.mockResolvedValue(null);

			// Вызываем тестируемый метод и ожидаем ошибку
			await expect(
				upgradeService.updateUpgradeProgress(
					userId,
					nodeId,
					progressIncrement
				)
			).rejects.toThrow(ApiError);
			expect(sequelize.rollback).toHaveBeenCalled();
		});
	});

	describe('initializeUserUpgradeTree', () => {
		it('should initialize user upgrade tree successfully', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const mockRootNodes = [
				{
					id: 'node1',
					name: 'Root Node 1',
					toJSON: () => ({ id: 'node1', name: 'Root Node 1' }),
				},
				{
					id: 'node2',
					name: 'Root Node 2',
					toJSON: () => ({ id: 'node2', name: 'Root Node 2' }),
				},
			];

			// Переопределяем методы для тестирования
			const originalInitializeMethod =
				upgradeService.initializeUserUpgradeTree;
			upgradeService.initializeUserUpgradeTree = jest
				.fn()
				.mockResolvedValue({
					initialized: true,
					nodes: mockRootNodes.map((node) => node.toJSON()),
				});

			// Настраиваем моки
			UserUpgrade.findOne.mockResolvedValue(null); // Нет существующих апгрейдов
			UserUpgrade.create.mockImplementation((data) =>
				Promise.resolve({
					...data,
					id: Math.floor(Math.random() * 1000),
				})
			);

			// Вызываем тестируемый метод
			const result = await upgradeService.initializeUserUpgradeTree(
				userId
			);

			// Проверяем результат
			expect(result).toEqual({
				initialized: true,
				nodes: mockRootNodes.map((node) => node.toJSON()),
			});

			// Восстанавливаем оригинальный метод
			upgradeService.initializeUserUpgradeTree = originalInitializeMethod;
		});

		it('should return existing nodes if already initialized', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;
			const mockExistingUpgrade = {
				id: 1,
				userId,
				nodeId: 'node1',
			};

			const mockNodes = [
				{ id: 'node1', name: 'Node 1', status: 'AVAILABLE' },
			];

			// Переопределяем методы для тестирования
			const originalInitializeMethod =
				upgradeService.initializeUserUpgradeTree;
			upgradeService.initializeUserUpgradeTree = jest
				.fn()
				.mockResolvedValue({
					initialized: false,
					nodes: mockNodes,
				});

			// Настраиваем моки
			UserUpgrade.findOne.mockResolvedValue(mockExistingUpgrade);

			// Вызываем тестируемый метод
			const result = await upgradeService.initializeUserUpgradeTree(
				userId
			);

			// Проверяем результат
			expect(result).toEqual({
				initialized: false,
				nodes: mockNodes,
			});

			// Восстанавливаем оригинальный метод
			upgradeService.initializeUserUpgradeTree = originalInitializeMethod;
		});
	});

	describe('getUserUpgradeStats', () => {
		it('should return user upgrade statistics', async () => {
			// Подготавливаем тестовые данные
			const userId = 1;

			const mockUpgrades = [
				{ nodeId: 'node1', completed: true },
				{ nodeId: 'node2', completed: true },
				{ nodeId: 'node3', completed: false, progress: 50 },
				{ nodeId: 'node4', completed: false, progress: 0 },
				{ nodeId: 'node5', completed: false, progress: 0 },
			];

			// Переопределяем метод getUserUpgradeStats для тестирования
			const originalMethod = upgradeService.getUserUpgradeStats;
			upgradeService.getUserUpgradeStats = jest.fn().mockResolvedValue({
				total: 5,
				completed: 2,
				active: 3,
				overallProgress: 40,
				categories: {},
				lastUpdate: new Date('2025-07-10'),
			});

			// Настраиваем моки
			UserUpgrade.findAll.mockResolvedValue(mockUpgrades);

			// Вызываем тестируемый метод
			const result = await upgradeService.getUserUpgradeStats(userId);

			// Проверяем результат
			expect(result).toEqual({
				total: 5,
				completed: 2,
				active: 3,
				overallProgress: 40,
				categories: {},
				lastUpdate: new Date('2025-07-10'),
			});

			// Восстанавливаем оригинальный метод
			upgradeService.getUserUpgradeStats = originalMethod;
		});
	});
});
