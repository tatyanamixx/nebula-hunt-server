const stateService = require('../../service/state-service');
const {
	UserState,
	User,
	UserUpgrade,
	UserTask,
	UserEvent,
	UserEventSetting,
} = require('../../models/models');
const ApiError = require('../../exceptions/api-error');
const sequelize = require('../../db');
const { Op } = require('sequelize');
const { LEADERBOARD_LIMIT } = require('../../config/constants');

// Mock the models and sequelize
jest.mock('../../models/models', () => {
	const mockUserState = {
		findAll: jest.fn(),
		findOne: jest.fn(),
		count: jest.fn(),
		create: jest.fn(),
	};

	const mockUser = {};

	const mockUserUpgrade = {
		findAll: jest.fn().mockResolvedValue([]),
	};

	const mockUserTask = {
		findAll: jest.fn().mockResolvedValue([]),
	};

	const mockUserEvent = {
		findAll: jest.fn().mockResolvedValue([]),
	};

	const mockUserEventSetting = {
		findOne: jest.fn().mockResolvedValue(null),
	};

	return {
		UserState: mockUserState,
		User: mockUser,
		UserUpgrade: mockUserUpgrade,
		UserTask: mockUserTask,
		UserEvent: mockUserEvent,
		UserEventSetting: mockUserEventSetting,
	};
});
jest.mock('../../db');
jest.mock('sequelize');
jest.mock('../../service/upgrade-service', () => ({
	initializeUserUpgradeTree: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../service/task-service', () => ({
	
}));
jest.mock('../../service/event-service', () => ({
	initializeUserEvents: jest.fn().mockResolvedValue({}),
}));

describe('StateService', () => {
	let mockTransaction;

	beforeEach(() => {
		jest.clearAllMocks();

		// Create mock transaction object
		mockTransaction = {
			commit: jest.fn().mockResolvedValue(undefined),
			rollback: jest.fn().mockResolvedValue(undefined),
		};

		// Mock transaction
		sequelize.transaction.mockImplementation(() =>
			Promise.resolve(mockTransaction)
		);

		// Mock sequelize.literal
		sequelize.literal = jest.fn().mockImplementation((str) => str);
	});

	describe('getUserState', () => {
		it('should return user state with related data', async () => {
			// Mock user state
			const mockUserStateObj = {
				userId: 123456789,
				stardust: 100,
				darkMatter: 50,
				tgStars: 25,
				toJSON: jest.fn().mockReturnValue({
					userId: 123456789,
					stardust: 100,
					darkMatter: 50,
					tgStars: 25,
				}),
				save: jest.fn().mockResolvedValue(true),
			};

			// Mock related data
			const mockUserUpgrades = [
				{
					id: 1,
					userId: 123456789,
					nodeId: 'upgrade1',
					completed: true,
				},
				{
					id: 2,
					userId: 123456789,
					nodeId: 'upgrade2',
					completed: false,
				},
			];

			const mockUserTasks = [
				{
					id: 1,
					userId: 123456789,
					taskId: 'task1',
					completed: true,
					active: false,
				},
				{
					id: 2,
					userId: 123456789,
					taskId: 'task2',
					completed: false,
					active: true,
				},
			];

			const mockUserEvents = [
				{
					id: 1,
					userId: 123456789,
					eventId: 'event1',
					status: 'ACTIVE',
				},
			];

			const mockUserEventSettings = {
				id: 1,
				userId: 123456789,
				eventMultipliers: {
					production: 1.5,
				},
			};

			// Set up mocks
			UserState.findOne.mockResolvedValue(mockUserStateObj);
			UserUpgrade.findAll.mockResolvedValue(mockUserUpgrades);
			UserTask.findAll.mockResolvedValue(mockUserTasks);
			UserEvent.findAll.mockResolvedValue(mockUserEvents);
			UserEventSetting.findOne.mockResolvedValue(mockUserEventSettings);

			// Call the method
			const result = await stateService.getUserState(123456789);

			// Verify transaction was created
			expect(sequelize.transaction).toHaveBeenCalled();

			// Verify UserState.findOne was called with correct parameters
			expect(UserState.findOne).toHaveBeenCalledWith({
				where: { userId: 123456789 },
				transaction: mockTransaction,
			});

			// Verify related data was fetched
			expect(UserUpgrade.findAll).toHaveBeenCalledWith({
				where: { userId: 123456789 },
				transaction: mockTransaction,
			});

			expect(UserTask.findAll).toHaveBeenCalledWith({
				where: { userId: 123456789 },
				transaction: mockTransaction,
			});

			expect(UserEvent.findAll).toHaveBeenCalledWith({
				where: {
					userId: 123456789,
					status: 'ACTIVE',
				},
				transaction: mockTransaction,
			});

			expect(UserEventSetting.findOne).toHaveBeenCalledWith({
				where: { userId: 123456789 },
				transaction: mockTransaction,
			});

			// Verify result structure
			expect(result).toHaveProperty('userId', 123456789);
			expect(result).toHaveProperty('stardust', 100);
			expect(result).toHaveProperty('darkMatter', 50);
			expect(result).toHaveProperty('tgStars', 25);

			// Verify aggregated data
			expect(result).toHaveProperty('upgrades');
			expect(result.upgrades).toHaveProperty('items', mockUserUpgrades);
			expect(result.upgrades).toHaveProperty('completed', 1);
			expect(result.upgrades).toHaveProperty('active', 1);

			expect(result).toHaveProperty('tasks');
			expect(result.tasks).toHaveProperty('items', mockUserTasks);
			expect(result.tasks).toHaveProperty('completed', 1);
			expect(result.tasks).toHaveProperty('active', 1);

			expect(result).toHaveProperty('events');
			expect(result.events).toHaveProperty('active', mockUserEvents);
			expect(result.events).toHaveProperty(
				'settings',
				mockUserEventSettings
			);

			// Verify transaction was committed
			expect(mockTransaction.commit).toHaveBeenCalled();
		});

		it('should handle case when user state does not exist', async () => {
			// Mock user state not found
			UserState.findOne.mockResolvedValue(null);

			// Call the method
			const result = await stateService.getUserState(123456789);

			// Verify transaction was created
			expect(sequelize.transaction).toHaveBeenCalled();

			// Verify UserState.findOne was called with correct parameters
			expect(UserState.findOne).toHaveBeenCalledWith({
				where: { userId: 123456789 },
				transaction: mockTransaction,
			});

			// Verify result is null
			expect(result).toBeNull();

			// Verify transaction was committed
			expect(mockTransaction.commit).toHaveBeenCalled();
		});

		it('should handle errors properly', async () => {
			// Mock an error
			const mockError = new Error('Database error');
			UserState.findOne.mockRejectedValue(mockError);

			// Call the method and expect error
			await expect(stateService.getUserState(123456789)).rejects.toThrow(
				ApiError
			);

			// Verify transaction was created
			expect(sequelize.transaction).toHaveBeenCalled();

			// Verify transaction was rolled back
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});

	describe('updateUserState', () => {
		it('should update existing user state', async () => {
			// Mock existing user state
			const mockUserState = {
				userId: 123456789,
				stardust: 100,
				darkMatter: 50,
				tgStars: 25,
				chaosLevel: 0.5,
				stabilityLevel: 0.3,
				entropyVelocity: 0.1,
				toJSON: jest.fn().mockReturnValue({
					userId: 123456789,
					stardust: 100,
					darkMatter: 50,
					tgStars: 25,
					chaosLevel: 0.5,
					stabilityLevel: 0.3,
					entropyVelocity: 0.1,
				}),
				save: jest.fn().mockResolvedValue(true),
			};

			// Mock related data
			const mockUserUpgrades = [
				{
					id: 1,
					userId: 123456789,
					nodeId: 'upgrade1',
					completed: true,
				},
			];

			const mockUserTasks = [
				{
					id: 1,
					userId: 123456789,
					taskId: 'task1',
					completed: true,
					active: false,
				},
			];

			const mockUserEvents = [
				{
					id: 1,
					userId: 123456789,
					eventId: 'event1',
					status: 'ACTIVE',
				},
			];

			const mockUserEventSettings = {
				id: 1,
				userId: 123456789,
				eventMultipliers: {
					production: 1.5,
				},
			};

			// Set up mocks
			UserState.findOne.mockResolvedValue(mockUserState);
			UserUpgrade.findAll.mockResolvedValue(mockUserUpgrades);
			UserTask.findAll.mockResolvedValue(mockUserTasks);
			UserEvent.findAll.mockResolvedValue(mockUserEvents);
			UserEventSetting.findOne.mockResolvedValue(mockUserEventSettings);

			// New state data to update
			const newStateData = {
				state: { totalStars: 200 },
				chaosLevel: 0.7,
				stabilityLevel: 0.4,
				entropyVelocity: 0.2,
			};

			// Call the method
			const result = await stateService.updateUserState(
				123456789,
				newStateData
			);

			// Verify transaction was created
			expect(sequelize.transaction).toHaveBeenCalled();

			// Verify UserState.findOne was called with correct parameters
			expect(UserState.findOne).toHaveBeenCalledWith({
				where: { userId: 123456789 },
				transaction: mockTransaction,
			});

			// Verify user state was updated
			expect(mockUserState.state).toBe(newStateData.state);
			expect(mockUserState.chaosLevel).toBe(newStateData.chaosLevel);
			expect(mockUserState.stabilityLevel).toBe(
				newStateData.stabilityLevel
			);
			expect(mockUserState.entropyVelocity).toBe(
				newStateData.entropyVelocity
			);
			expect(mockUserState.save).toHaveBeenCalled();

			// Verify related data was fetched
			expect(UserUpgrade.findAll).toHaveBeenCalled();
			expect(UserTask.findAll).toHaveBeenCalled();
			expect(UserEvent.findAll).toHaveBeenCalled();
			expect(UserEventSetting.findOne).toHaveBeenCalled();

			// Verify result structure
			expect(result).toHaveProperty('userId', 123456789);
			expect(result).toHaveProperty('userState');

			// Verify transaction was committed
			expect(mockTransaction.commit).toHaveBeenCalled();
		});

		it('should create new user state if it does not exist', async () => {
			// Mock user state not found
			UserState.findOne.mockResolvedValue(null);

			// Mock create new state
			const newUserState = {
				userId: 123456789,
				state: { totalStars: 100 },
				chaosLevel: 0.5,
				stabilityLevel: 0.3,
				entropyVelocity: 0.1,
			};
			UserState.create.mockResolvedValue(newUserState);

			// New state data
			const stateData = {
				state: { totalStars: 100 },
				chaosLevel: 0.5,
				stabilityLevel: 0.3,
				entropyVelocity: 0.1,
			};

			// Call the method
			const result = await stateService.updateUserState(
				123456789,
				stateData
			);

			// Verify transaction was created
			expect(sequelize.transaction).toHaveBeenCalled();

			// Verify UserState.findOne was called
			expect(UserState.findOne).toHaveBeenCalled();

			// Verify UserState.create was called with correct parameters
			expect(UserState.create).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: 123456789,
					state: stateData.state,
					chaosLevel: stateData.chaosLevel,
					stabilityLevel: stateData.stabilityLevel,
					entropyVelocity: stateData.entropyVelocity,
				}),
				{ transaction: mockTransaction }
			);

			// Verify result structure
			expect(result).toHaveProperty('userId', 123456789);
			expect(result).toHaveProperty('userState', newUserState);

			// Verify transaction was committed
			expect(mockTransaction.commit).toHaveBeenCalled();
		});

		it('should handle errors properly', async () => {
			// Mock an error
			const mockError = new Error('Database error');
			UserState.findOne.mockRejectedValue(mockError);

			// New state data
			const stateData = {
				state: { totalStars: 100 },
			};

			// Call the method and expect error
			await expect(
				stateService.updateUserState(123456789, stateData)
			).rejects.toThrow(ApiError);

			// Verify transaction was created
			expect(sequelize.transaction).toHaveBeenCalled();

			// Verify transaction was rolled back
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});

	describe('leaderboard', () => {
		it('should return top users based on LEADERBOARD_LIMIT', async () => {
			// Create mock users
			const mockUsers = Array(LEADERBOARD_LIMIT + 10)
				.fill()
				.map((_, i) => ({
					toJSON: () => ({
						userId: i + 1,
						state: { totalStars: LEADERBOARD_LIMIT - i },
						User: { username: `user${i + 1}` },
					}),
				}));

			// Mock UserState.findAll
			UserState.findAll.mockResolvedValue(
				mockUsers.slice(0, LEADERBOARD_LIMIT)
			);

			// Mock UserState.findOne for the current user (not in top list)
			UserState.findOne.mockResolvedValue({
				toJSON: () => ({
					userId: LEADERBOARD_LIMIT + 5,
					state: { totalStars: 5 },
					updatedAt: new Date(),
					User: { username: `user${LEADERBOARD_LIMIT + 5}` },
				}),
				state: { totalStars: 5 },
				updatedAt: new Date(),
				save: jest.fn().mockResolvedValue(true),
			});

			// Mock UserState.count for user ranking
			UserState.count.mockResolvedValue(LEADERBOARD_LIMIT + 4);

			const result = await stateService.leaderboard(
				LEADERBOARD_LIMIT + 5
			);

			// Check that findAll was called with the correct limit
			expect(UserState.findAll).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: LEADERBOARD_LIMIT,
				}),
				expect.anything()
			);

			// Check that the result includes the leaderboard with LEADERBOARD_LIMIT users
			expect(result.leaderboard.length).toBe(LEADERBOARD_LIMIT + 1); // +1 for the current user

			// Check that the current user is included at the end
			const lastUser = result.leaderboard[result.leaderboard.length - 1];
			expect(lastUser.userId).toBe(LEADERBOARD_LIMIT + 5);
			expect(lastUser.rating).toBe(LEADERBOARD_LIMIT + 5);
		});

		it('should not add user to the end if already in the top list', async () => {
			// Create mock users with the requested user in the top list
			const userId = 5;
			const mockUsers = Array(LEADERBOARD_LIMIT)
				.fill()
				.map((_, i) => ({
					toJSON: () => ({
						userId: i + 1,
						state: { totalStars: LEADERBOARD_LIMIT - i },
						User: { username: `user${i + 1}` },
					}),
				}));

			// Replace one user with our target user
			mockUsers[4] = {
				toJSON: () => ({
					userId,
					state: { totalStars: LEADERBOARD_LIMIT - 4 },
					User: { username: `user${userId}` },
				}),
			};

			// Mock UserState.findAll
			UserState.findAll.mockResolvedValue(mockUsers);

			// Mock UserState.findOne for the current user
			UserState.findOne.mockResolvedValue({
				toJSON: () => ({
					userId,
					state: { totalStars: LEADERBOARD_LIMIT - 4 },
					updatedAt: new Date(),
					User: { username: `user${userId}` },
				}),
				state: { totalStars: LEADERBOARD_LIMIT - 4 },
				updatedAt: new Date(),
				save: jest.fn().mockResolvedValue(true),
			});

			// Mock UserState.count for user ranking
			UserState.count.mockResolvedValue(4);

			const result = await stateService.leaderboard(userId);

			// Check that the result includes only LEADERBOARD_LIMIT users (no duplication)
			expect(result.leaderboard.length).toBe(LEADERBOARD_LIMIT);

			// Check that user's rating is correctly set
			expect(result.userRating).toBe(5);
		});

		it('should handle errors properly', async () => {
			// Mock an error
			const mockError = new Error('Database error');
			UserState.findOne.mockRejectedValue(mockError);

			await expect(stateService.leaderboard(1)).rejects.toThrow(ApiError);
		});
	});
});
