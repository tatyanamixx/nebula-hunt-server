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
	initializeUserTasks: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../service/event-service', () => ({
	initializeUserEvents: jest.fn().mockResolvedValue({}),
}));

describe('StateService', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// Mock transaction
		sequelize.transaction.mockImplementation(() => {
			return {
				commit: jest.fn().mockResolvedValue(),
				rollback: jest.fn().mockResolvedValue(),
				finished: false,
			};
		});

		// Mock sequelize.literal
		sequelize.literal = jest.fn().mockImplementation((str) => str);
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
