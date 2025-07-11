const userStateController = require('../../controllers/user-state-controller');
const userStateService = require('../../service/state-service');
const ApiError = require('../../exceptions/api-error');

// Мокаем сервис состояния пользователя
jest.mock('../../service/state-service');
jest.mock('../../service/logger-service', () => ({
	info: jest.fn(),
	error: jest.fn(),
	warn: jest.fn(),
	debug: jest.fn(),
}));

describe('UserStateController', () => {
	let req;
	let res;
	let next;

	beforeEach(() => {
		// Очищаем все моки перед каждым тестом
		jest.clearAllMocks();

		// Создаем моки для req, res и next
		req = {
			initdata: {
				id: 123456789,
				username: 'testuser',
			},
			body: {},
		};

		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		next = jest.fn();
	});

	describe('getUserState', () => {
		it('should get user state successfully', async () => {
			// Мокаем ответ от сервиса
			const userState = {
				userId: 123456789,
				stardust: 100,
				darkMatter: 50,
				tgStars: 25,
				upgrades: {
					items: [],
					completed: 0,
					active: 0,
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
			};
			userStateService.getUserState.mockResolvedValue(userState);

			// Вызываем метод контроллера
			await userStateController.getUserState(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(userStateService.getUserState).toHaveBeenCalledWith(
				req.initdata.id
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(userState);
		});

		it('should handle service error', async () => {
			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to get user state';
			userStateService.getUserState.mockRejectedValue(
				new Error(errorMessage)
			);

			// Вызываем метод контроллера
			await userStateController.getUserState(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('updateUserState', () => {
		it('should update user state successfully', async () => {
			// Подготавливаем тестовые данные
			const userStateData = {
				stardust: 150,
				darkMatter: 75,
				tgStars: 30,
			};
			req.body = userStateData;

			// Мокаем ответ от сервиса
			const updatedState = {
				userId: 123456789,
				userState: {
					stardust: 150,
					darkMatter: 75,
					tgStars: 30,
					upgrades: {
						items: [],
						completed: 0,
						active: 0,
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
				},
			};
			userStateService.updateUserState.mockResolvedValue(updatedState);

			// Вызываем метод контроллера
			await userStateController.updateUserState(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(userStateService.updateUserState).toHaveBeenCalledWith(
				req.initdata.id,
				userStateData
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(updatedState);
		});

		it('should handle service error', async () => {
			// Подготавливаем тестовые данные
			const userStateData = {
				stardust: 150,
				darkMatter: 75,
				tgStars: 30,
			};
			req.body = userStateData;

			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to update user state';
			userStateService.updateUserState.mockRejectedValue(
				new Error(errorMessage)
			);

			// Вызываем метод контроллера
			await userStateController.updateUserState(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('getLeaderboard', () => {
		it('should get leaderboard successfully', async () => {
			// Мокаем ответ от сервиса
			const leaderboard = {
				leaderboard: [
					{
						userId: 111111,
						username: 'user1',
						stars: 500,
						rating: 1,
					},
					{
						userId: 222222,
						username: 'user2',
						stars: 400,
						rating: 2,
					},
					{
						userId: 333333,
						username: 'user3',
						stars: 300,
						rating: 3,
					},
				],
				userRating: 42,
				totalUsers: 100,
			};
			userStateService.leaderboard.mockResolvedValue(leaderboard);

			// Вызываем метод контроллера
			await userStateController.getLeaderboard(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(userStateService.leaderboard).toHaveBeenCalledWith(
				req.initdata.id
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(leaderboard);
		});

		it('should handle service error', async () => {
			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to get leaderboard';
			userStateService.leaderboard.mockRejectedValue(
				new Error(errorMessage)
			);

			// Вызываем метод контроллера
			await userStateController.getLeaderboard(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});
});
