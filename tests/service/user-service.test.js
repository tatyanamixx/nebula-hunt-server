const userService = require('../../service/user-service');
const tokenService = require('../../service/token-service');
const ApiError = require('../../exceptions/api-error');
const stateService = require('../../service/state-service');
const marketService = require('../../service/market-service');
const UserDto = require('../../dtos/user-dto');
const upgradeService = require('../../service/upgrade-service');
const taskService = require('../../service/task-service');
const packageStoreService = require('../../service/package-store-service');

// Мокаем зависимости
jest.mock('../../service/token-service');
jest.mock('../../service/logger-service', () => ({
	info: jest.fn(),
	error: jest.fn(),
	debug: jest.fn(),
	warn: jest.fn(),
}));
jest.mock('../../service/state-service');
jest.mock('../../service/market-service');

// Мокаем UserDto
jest.mock('../../dtos/user-dto', () => {
	return jest.fn().mockImplementation((user) => {
		return {
			id: user.id,
			username: user.username,
			role: user.role || 'USER',
		};
	});
});

// Мокаем модели вместо Sequelize
jest.mock('../../models/models', () => {
	// Создаем моки для всех моделей
	const User = {
		findOrCreate: jest.fn(),
		findOne: jest.fn(),
		findByPk: jest.fn(),
		findAll: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	};

	const UserState = {
		findOne: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
	};

	const Token = {
		findOne: jest.fn(),
		create: jest.fn(),
		destroy: jest.fn(),
	};

	return {
		User,
		UserState,
		Token,
	};
});

// Получаем мокированные модели
const { User, UserState, Token } = require('../../models/models');

// Мокаем транзакции
jest.mock('../../db', () => {
	// Создаем мок транзакции
	const mockTransaction = {
		commit: jest.fn().mockResolvedValue(true),
		rollback: jest.fn().mockResolvedValue(true),
		finished: false,
	};

	// Мокируем sequelize с методом transaction
	return {
		transaction: jest.fn().mockResolvedValue(mockTransaction),
	};
});

// Мокируем дополнительные сервисы, используемые в user-service
jest.mock('../../service/galaxy-service', () => ({
	createGalaxy: jest.fn().mockImplementation((userId, galaxyData) => {
		return Promise.resolve({
			id: 1,
			userId,
			...galaxyData,
		});
	}),
	getUserGalaxies: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../service/event-service', () => ({
	initializeUserEvents: jest.fn().mockResolvedValue({}),
	checkAndTriggerEvents: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../service/task-service', () => ({
	activateUserTasks: jest.fn().mockResolvedValue({}),
	initializeUserTasks: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../service/upgrade-service', () => ({
	activateUserUpgradeNodes: jest.fn().mockResolvedValue({}),
	initializeUserUpgradeTree: jest.fn().mockResolvedValue({
		activeNodes: [],
		completedNodes: [],
		nodeStates: {},
		treeStructure: {},
	}),
}));

jest.mock('../../service/artifact-service', () => ({
	getUserArtifacts: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../service/package-store-service', () => ({
	initializePackageStore: jest.fn().mockResolvedValue({}),
	getUserPackages: jest.fn().mockResolvedValue([
		{
			id: 'template1_12345_1626345678',
			userId: 12345,
			amount: 100,
			resource: 'stardust',
			status: 'ACTIVE',
			isUsed: false,
			isLocked: false,
		},
	]),
}));

jest.mock('../../service/prometheus-service', () => ({
	prometheusMetrics: {
		userRegistrationCounter: { inc: jest.fn() },
	},
}));

describe('UserService', () => {
	describe('registration', () => {
		beforeEach(() => {
			// Очищаем моки перед каждым тестом
			jest.clearAllMocks();

			// Настраиваем моки для stateService и marketService
			stateService.createUserState = jest
				.fn()
				.mockImplementation((userId, initialState) => {
					return Promise.resolve({
						userId,
						state: initialState.state || { totalStars: 0 },
						save: jest.fn().mockResolvedValue(true),
					});
				});

			marketService.getPackageOffers = jest.fn().mockResolvedValue([
				{ id: 1, price: 100, currency: 'tgStars' },
				{ id: 2, price: 200, currency: 'tgStars' },
			]);

			// Мок для User.findOrCreate
			User.findOrCreate = jest.fn().mockResolvedValue([
				{
					id: 1234567891011,
					username: 'testuser2',
					role: 'USER',
				},
				true,
			]);

			// Мок для генерации токенов
			tokenService.generateTokens = jest.fn().mockReturnValue({
				accessToken: 'test-access-token',
				refreshToken: 'test-refresh-token',
			});
			tokenService.saveToken = jest.fn().mockResolvedValue({});
		});

		it('should create new user successfully with package offers', async () => {
			const userData = {
				id: 1234567891011,
				username: 'testuser2',
				referral: '987654432',
				userState: { state: { totalStars: 0 } },
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
			const result = await userService.registration(
				userData.id,
				userData.username,
				userData.referral,
				userData.userState,
				userData.galaxies
			);

			// Проверяем вызовы методов
			expect(stateService.createUserState).toHaveBeenCalled();
			expect(
				upgradeService.initializeUserUpgradeTree
			).toHaveBeenCalledWith(userData.id, expect.anything());
			expect(taskService.initializeUserTasks).toHaveBeenCalledWith(
				userData.id,
				expect.anything()
			);
			expect(marketService.getPackageOffers).toHaveBeenCalledWith(
				userData.id
			);

			// Проверяем результат
			expect(result.user).toBeDefined();
			expect(result.user.id).toBe(userData.id);
			expect(result.user.username).toBe(userData.username);
			expect(result.userState).toBeDefined();
			expect(result.userGalaxies).toBeDefined();
			expect(result.packageOffers).toBeDefined();
			expect(result.packageOffers).toHaveLength(2);
			expect(result.packageOffers[0].id).toBe(1);
			expect(result.packageOffers[1].id).toBe(2);
			expect(result.accessToken).toBeDefined();
			expect(result.refreshToken).toBeDefined();

			// Проверяем, что upgradeTree не возвращается отдельно
			expect(result.upgradeTree).toBeUndefined();
		});

		it('should throw error for duplicate user', async () => {
			// Настраиваем мок для имитации ошибки ApiError.BadRequest
			User.findOrCreate = jest.fn().mockImplementation(() => {
				throw new ApiError(400, 'User already exists');
			});

			const userData = {
				id: 123456789101112,
				username: 'testuser',
				referral: '7894332',
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

			await expect(
				userService.registration(
					userData.id,
					userData.username,
					userData.referral,
					userData.userState,
					userData.galaxies
				)
			).rejects.toThrow();
		});

		it('should handle error when getPackageOffers fails', async () => {
			// Настраиваем мок для имитации ошибки в marketService
			marketService.getPackageOffers = jest
				.fn()
				.mockImplementation(() => {
					throw new Error('Failed to get package offers');
				});

			const userData = {
				id: 1234567891011,
				username: 'testuser2',
				referral: '987654432',
				userState: { state: { totalStars: 0 } },
				galaxies: [],
			};

			// Проверяем, что функция регистрации все равно выполнится успешно
			await expect(
				userService.registration(
					userData.id,
					userData.username,
					userData.referral,
					userData.userState,
					userData.galaxies
				)
			).rejects.toThrow();
		});
	});

	describe('login', () => {
		beforeEach(() => {
			// Очищаем моки перед каждым тестом
			jest.clearAllMocks();

			// Настраиваем моки
			User.findOne = jest.fn().mockResolvedValue(null);
			User.findByPk = jest.fn().mockResolvedValue({
				id: 12345,
				username: 'testuser',
				role: 'USER',
				blocked: false,
			});

			stateService.getUserState = jest.fn().mockImplementation(() => {
				return Promise.resolve({
					state: { totalStars: 100 },
					upgrades: {
						items: [
							{
								id: 1,
								userId: 12345,
								nodeId: 'node1',
								completed: false,
							},
							{
								id: 2,
								userId: 12345,
								nodeId: 'node2',
								completed: true,
							},
						],
						completed: 1,
						active: 1,
					},
					tasks: {
						items: [
							{
								id: 1,
								userId: 12345,
								taskId: 'task1',
								completed: false,
								active: true,
							},
							{
								id: 2,
								userId: 12345,
								taskId: 'task2',
								completed: true,
								active: true,
							},
						],
						completed: 1,
						active: 1,
					},
					events: {
						active: [],
						settings: {},
					},
					save: jest.fn().mockResolvedValue(true),
				});
			});

			tokenService.generateTokens = jest.fn().mockReturnValue({
				accessToken: 'test-access-token',
				refreshToken: 'test-refresh-token',
			});

			tokenService.saveToken = jest.fn().mockResolvedValue({});

			marketService.getPackageOffers = jest.fn().mockResolvedValue([
				{ id: 1, price: 100, currency: 'tgStars' },
				{ id: 2, price: 200, currency: 'tgStars' },
			]);
		});

		it('should login user successfully with package offers', async () => {
			const userId = 12345;
			const result = await userService.login(userId);

			// Проверяем вызовы методов
			expect(User.findByPk).toHaveBeenCalledWith(
				userId,
				expect.anything()
			);
			expect(stateService.getUserState).toHaveBeenCalledWith(userId);
			expect(
				upgradeService.activateUserUpgradeNodes
			).toHaveBeenCalledWith(userId, expect.anything());
			expect(marketService.getPackageOffers).toHaveBeenCalledWith(userId);
			expect(tokenService.generateTokens).toHaveBeenCalled();
			expect(tokenService.saveToken).toHaveBeenCalled();

			// Проверяем результат
			expect(result.user).toBeDefined();
			expect(result.userState).toBeDefined();
			expect(result.userState.upgrades).toBeDefined();
			expect(result.userState.tasks).toBeDefined();
			expect(result.userGalaxies).toBeDefined();
			expect(result.userArtifacts).toBeDefined();
			expect(result.packageOffers).toBeDefined();
			expect(result.packageOffers).toHaveLength(2);
			expect(result.packageOffers[0].id).toBe(1);
			expect(result.packageOffers[1].id).toBe(2);
			expect(result.accessToken).toBeDefined();
			expect(result.refreshToken).toBeDefined();
		});

		it('should initialize upgrades when user has no upgrades', async () => {
			// Mock state with no upgrades
			stateService.getUserState = jest.fn().mockImplementation(() => {
				return Promise.resolve({
					state: { totalStars: 100 },
					upgrades: {
						items: [],
						completed: 0,
						active: 0,
					},
					tasks: {
						items: [
							{
								id: 1,
								userId: 12345,
								taskId: 'task1',
								completed: false,
								active: true,
							},
						],
						completed: 0,
						active: 1,
					},
					events: {
						active: [],
						settings: {},
					},
					save: jest.fn().mockResolvedValue(true),
				});
			});

			const userId = 12345;
			await userService.login(userId);

			// Verify that initializeUserUpgradeTree was called
			expect(
				upgradeService.initializeUserUpgradeTree
			).toHaveBeenCalledWith(userId, expect.anything());
			expect(
				upgradeService.activateUserUpgradeNodes
			).not.toHaveBeenCalled();
		});

		it('should initialize tasks when user has no tasks', async () => {
			// Mock state with no tasks
			stateService.getUserState = jest.fn().mockImplementation(() => {
				return Promise.resolve({
					state: { totalStars: 100 },
					upgrades: {
						items: [
							{
								id: 1,
								userId: 12345,
								nodeId: 'node1',
								completed: false,
							},
						],
						completed: 0,
						active: 1,
					},
					tasks: {
						items: [],
						completed: 0,
						active: 0,
					},
					events: {
						active: [],
						settings: {},
					},
					save: jest.fn().mockResolvedValue(true),
				});
			});

			const userId = 12345;
			await userService.login(userId);

			// Verify that initializeUserTasks was called
			expect(taskService.initializeUserTasks).toHaveBeenCalledWith(
				userId,
				expect.anything()
			);
		});

		it('should initialize package store when user has no packages', async () => {
			// Mock state with no packages
			stateService.getUserState = jest.fn().mockImplementation(() => {
				return Promise.resolve({
					state: { totalStars: 100 },
					upgrades: {
						items: [
							{
								id: 1,
								userId: 12345,
								nodeId: 'node1',
								completed: false,
							},
						],
						completed: 0,
						active: 1,
					},
					tasks: {
						items: [
							{
								id: 1,
								userId: 12345,
								taskId: 'task1',
								completed: false,
								active: true,
							},
						],
						completed: 0,
						active: 1,
					},
					events: {
						active: [],
						settings: {},
					},
					packages: {
						available: [],
						count: 0,
					},
					save: jest.fn().mockResolvedValue(true),
				});
			});

			const userId = 12345;
			await userService.login(userId);

			// Verify that initializePackageStore was called
			expect(
				packageStoreService.initializePackageStore
			).toHaveBeenCalledWith(userId, expect.anything());
		});

		it('should throw error when user not found', async () => {
			User.findByPk = jest.fn().mockResolvedValue(null);

			await expect(userService.login(99999)).rejects.toThrow();
		});

		it('should throw error when user is blocked', async () => {
			User.findByPk = jest.fn().mockResolvedValue({
				id: 12345,
				username: 'testuser',
				role: 'USER',
				blocked: true,
			});

			await expect(userService.login(12345)).rejects.toThrow();
		});

		it('should handle error when getPackageOffers fails', async () => {
			// Настраиваем мок для имитации ошибки в marketService
			marketService.getPackageOffers = jest
				.fn()
				.mockImplementation(() => {
					throw new Error('Failed to get package offers');
				});

			await expect(userService.login(12345)).rejects.toThrow();
		});
	});

	describe('refresh', () => {
		beforeEach(() => {
			// Очищаем моки перед каждым тестом
			jest.clearAllMocks();
		});

		it('should refresh tokens successfully', async () => {
			// Подготавливаем тестовые данные
			const testUserId = 12345;
			const testRefreshToken = 'valid-refresh-token';
			const testUserData = {
				id: testUserId,
				username: 'testuser',
				role: 'USER',
			};
			const mockTokens = {
				accessToken: 'new-access-token',
				refreshToken: 'new-refresh-token',
			};

			// Настраиваем моки
			tokenService.validateRefreshToken.mockReturnValue({
				id: testUserId,
			});
			tokenService.findToken.mockResolvedValue({
				userId: testUserId,
				token: testRefreshToken,
			});
			tokenService.generateTokens.mockReturnValue(mockTokens);
			tokenService.saveToken.mockResolvedValue({});

			// Мокаем модель User для findByPk
			User.findByPk = jest.fn().mockResolvedValue({
				id: testUserId,
				username: 'testuser',
				role: 'USER',
				blocked: false,
			});

			// Вызываем тестируемый метод
			const result = await userService.refresh(testRefreshToken);

			// Проверяем результаты
			expect(tokenService.validateRefreshToken).toHaveBeenCalledWith(
				testRefreshToken
			);
			expect(tokenService.findToken).toHaveBeenCalledWith(
				testRefreshToken,
				expect.anything()
			);
			expect(User.findByPk).toHaveBeenCalledWith(
				testUserId,
				expect.anything()
			);
			expect(tokenService.generateTokens).toHaveBeenCalled();
			expect(tokenService.saveToken).toHaveBeenCalledWith(
				testUserId,
				mockTokens.refreshToken,
				expect.anything()
			);

			expect(result).toHaveProperty(
				'accessToken',
				mockTokens.accessToken
			);
			expect(result).toHaveProperty(
				'refreshToken',
				mockTokens.refreshToken
			);
			expect(result).toHaveProperty('user');
			expect(result.user).toHaveProperty('id', testUserId);
		});

		it('should throw error when refresh token is missing', async () => {
			await expect(userService.refresh(null)).rejects.toThrow();
		});

		it('should throw error when refresh token is invalid', async () => {
			tokenService.validateRefreshToken.mockReturnValue(null);

			await expect(
				userService.refresh('invalid-token')
			).rejects.toThrow();
		});

		it('should throw error when token not found in database', async () => {
			tokenService.validateRefreshToken.mockReturnValue({ id: 12345 });
			tokenService.findToken.mockResolvedValue(null);

			await expect(
				userService.refresh('token-not-in-db')
			).rejects.toThrow();
		});

		it('should throw error when user not found', async () => {
			tokenService.validateRefreshToken.mockReturnValue({ id: 99999 });
			tokenService.findToken.mockResolvedValue({
				userId: 99999,
				token: 'valid-token',
			});
			User.findByPk = jest.fn().mockResolvedValue(null);

			await expect(userService.refresh('valid-token')).rejects.toThrow();
		});

		it('should throw error when user is blocked', async () => {
			tokenService.validateRefreshToken.mockReturnValue({ id: 12345 });
			tokenService.findToken.mockResolvedValue({
				userId: 12345,
				token: 'valid-token',
			});
			User.findByPk = jest.fn().mockResolvedValue({
				id: 12345,
				username: 'blocked-user',
				role: 'USER',
				blocked: true,
			});

			await expect(userService.refresh('valid-token')).rejects.toThrow();
		});
	});

	describe('getFriends', () => {
		beforeEach(() => {
			// Очищаем моки перед каждым тестом
			jest.clearAllMocks();
		});

		it('should return list of friends successfully', async () => {
			// Подготавливаем тестовые данные
			const testUserId = 12345;
			const mockFriends = [
				{
					id: 54321,
					username: 'friend1',
					referral: testUserId,
					createdAt: new Date(),
					UserState: { state: { totalStars: 50 } },
				},
				{
					id: 67890,
					username: 'friend2',
					referral: testUserId,
					createdAt: new Date(),
					UserState: { state: { totalStars: 100 } },
				},
			];

			// Мокаем модели
			User.findByPk = jest.fn().mockResolvedValue({
				id: testUserId,
				username: 'testuser',
			});

			User.findAll = jest.fn().mockResolvedValue(mockFriends);

			// Вызываем тестируемый метод
			const result = await userService.getFriends(testUserId);

			// Проверяем результаты
			expect(User.findByPk).toHaveBeenCalledWith(
				testUserId,
				expect.anything()
			);
			expect(User.findAll).toHaveBeenCalledWith({
				where: { referral: testUserId },
				attributes: ['id', 'username', 'referral', 'createdAt'],
				include: [expect.any(Object)],
				transaction: expect.anything(),
			});

			expect(result).toHaveProperty('count', 2);
			expect(result).toHaveProperty('friends');
			expect(result.friends).toHaveLength(2);
			expect(result.friends[0]).toHaveProperty('id', mockFriends[0].id);
			expect(result.friends[1]).toHaveProperty('id', mockFriends[1].id);
		});

		it('should throw error when user ID is missing', async () => {
			await expect(userService.getFriends(null)).rejects.toThrow();
		});

		it('should throw error when user not found', async () => {
			User.findByPk = jest.fn().mockResolvedValue(null);

			await expect(userService.getFriends(99999)).rejects.toThrow();
		});

		it('should return empty list when user has no friends', async () => {
			// Мокаем модели
			User.findByPk = jest.fn().mockResolvedValue({
				id: 12345,
				username: 'testuser',
			});

			User.findAll = jest.fn().mockResolvedValue([]);

			// Вызываем тестируемый метод
			const result = await userService.getFriends(12345);

			// Проверяем результаты
			expect(result).toHaveProperty('count', 0);
			expect(result).toHaveProperty('friends');
			expect(result.friends).toHaveLength(0);
		});
	});
});
