const taskService = require('../../service/task-service');
const { Task, UserTask, UserState } = require('../../models/models');
const ApiError = require('../../exceptions/api-error');
const sequelize = require('../../db');
const marketService = require('../../service/market-service');

// Мокаем модели и другие зависимости
jest.mock('../../models/models', () => ({
	Task: {
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
	},
	UserTask: {
		create: jest.fn(),
		findAll: jest.fn(),
		findOne: jest.fn(),
		count: jest.fn(),
		sum: jest.fn(),
	},
	UserState: {
		findOne: jest.fn(),
	},
}));

jest.mock('../../db', () => ({
	transaction: jest.fn(),
}));

jest.mock('../../service/market-service', () => ({
	registerTaskReward: jest.fn(),
}));

describe('TaskService', () => {
	// Мок для транзакции
	const mockTransaction = {
		commit: jest.fn(),
		rollback: jest.fn(),
	};

	beforeEach(() => {
		// Очищаем все моки перед каждым тестом
		jest.clearAllMocks();

		// Настраиваем мок для транзакции
		sequelize.transaction.mockResolvedValue(mockTransaction);
	});

	describe('createTasks', () => {
		it('should create tasks successfully', async () => {
			// Подготавливаем тестовые данные
			const tasks = [
				{
					id: 'task1',
					title: 'Test Task 1',
					description: 'Description 1',
					reward: 100,
					condition: { targetProgress: 100 },
					icon: 'icon1',
				},
				{
					id: 'task2',
					title: 'Test Task 2',
					description: 'Description 2',
					reward: 200,
					condition: { targetProgress: 200 },
					icon: 'icon2',
				},
			];

			// Мокаем создание задач
			Task.create.mockImplementation((task) => Promise.resolve(task));

			// Вызываем метод сервиса
			const result = await taskService.createTasks(tasks);

			// Проверяем, что транзакция была создана
			expect(sequelize.transaction).toHaveBeenCalled();

			// Проверяем, что Task.create был вызван для каждой задачи
			expect(Task.create).toHaveBeenCalledTimes(2);
			expect(Task.create).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'task1',
					title: 'Test Task 1',
				}),
				{ transaction: mockTransaction }
			);
			expect(Task.create).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'task2',
					title: 'Test Task 2',
				}),
				{ transaction: mockTransaction }
			);

			// Проверяем, что транзакция была зафиксирована
			expect(mockTransaction.commit).toHaveBeenCalled();

			// Проверяем результат
			expect(result).toHaveLength(2);
			expect(result[0]).toHaveProperty('id', 'task1');
			expect(result[1]).toHaveProperty('id', 'task2');
		});

		it('should handle invalid task data', async () => {
			// Подготавливаем тестовые данные с неполной информацией
			const tasks = [
				{
					id: 'task1',
					// Отсутствует title
					description: 'Description 1',
					reward: 100,
					condition: { targetProgress: 100 },
					icon: 'icon1',
				},
			];

			// Вызываем метод сервиса и ожидаем ошибку
			await expect(taskService.createTasks(tasks)).rejects.toThrow(
				ApiError
			);

			// Проверяем, что транзакция была отменена
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});

	describe('initializeUserTasks', () => {
		it('should initialize user tasks successfully', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const tasks = [
				{
					id: 'task1',
					title: 'Test Task 1',
					description: 'Description 1',
					reward: 100,
					condition: { targetProgress: 100 },
					icon: 'icon1',
					active: true,
					toJSON: () => ({
						id: 'task1',
						title: 'Test Task 1',
						description: 'Description 1',
						reward: 100,
						condition: { targetProgress: 100 },
						icon: 'icon1',
						active: true,
					}),
				},
			];

			// Мокаем поиск активных задач
			Task.findAll.mockResolvedValue(tasks);

			// Мокаем создание записей о задачах пользователя
			UserTask.create.mockImplementation((task) => ({
				...task,
				toJSON: () => task,
			}));

			// Мокаем поиск состояния пользователя
			const userState = {
				state: { ownedTasksCount: 5 },
				save: jest.fn(),
			};
			UserState.findOne.mockResolvedValue(userState);

			// Вызываем метод сервиса
			const result = await taskService.initializeUserTasks(userId);

			// Проверяем, что транзакция была создана
			expect(sequelize.transaction).toHaveBeenCalled();

			// Проверяем, что Task.findAll был вызван с правильными параметрами
			expect(Task.findAll).toHaveBeenCalledWith({
				where: { active: true },
				transaction: mockTransaction,
			});

			// Проверяем, что UserTask.create был вызван для каждой задачи
			expect(UserTask.create).toHaveBeenCalledWith(
				expect.objectContaining({
					userId,
					taskId: 'task1',
					progress: 0,
				}),
				{ transaction: mockTransaction }
			);

			// Проверяем, что UserState.findOne был вызван с правильными параметрами
			expect(UserState.findOne).toHaveBeenCalledWith({
				where: { userId },
				transaction: mockTransaction,
			});

			// Проверяем, что состояние пользователя было обновлено
			expect(userState.state.ownedTasksCount).toBe(0);
			expect(userState.save).toHaveBeenCalledWith({
				transaction: mockTransaction,
			});

			// Проверяем, что транзакция была зафиксирована
			expect(mockTransaction.commit).toHaveBeenCalled();

			// Проверяем результат
			expect(result).toHaveProperty('tasks');
			expect(result.tasks).toHaveLength(1);
		});

		it('should handle case with no active tasks', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;

			// Мокаем поиск активных задач (пустой массив)
			Task.findAll.mockResolvedValue([]);

			// Вызываем метод сервиса
			const result = await taskService.initializeUserTasks(userId);

			// Проверяем, что транзакция была создана
			expect(sequelize.transaction).toHaveBeenCalled();

			// Проверяем, что Task.findAll был вызван с правильными параметрами
			expect(Task.findAll).toHaveBeenCalledWith({
				where: { active: true },
				transaction: mockTransaction,
			});

			// Проверяем, что UserTask.create не был вызван
			expect(UserTask.create).not.toHaveBeenCalled();

			// Проверяем, что транзакция была зафиксирована
			expect(mockTransaction.commit).toHaveBeenCalled();

			// Проверяем результат
			expect(result).toHaveProperty('tasks');
			expect(result.tasks).toHaveLength(0);
		});
	});

	describe('getUserTasks', () => {
		it('should get user tasks successfully', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const userTasks = [
				{
					id: 1,
					userId,
					taskId: 'task1',
					progress: 50,
					targetProgress: 100,
					completed: false,
					reward: 0,
					progressHistory: [],
					lastProgressUpdate: new Date(),
					active: true,
					task: {
						id: 'task1',
						title: 'Test Task 1',
						description: 'Description 1',
						reward: 100,
						condition: { targetProgress: 100 },
						icon: 'icon1',
						active: true,
					},
				},
			];

			// Мокаем поиск задач пользователя
			UserTask.findAll.mockResolvedValue(userTasks);

			// Вызываем метод сервиса
			const result = await taskService.getUserTasks(userId);

			// Проверяем, что транзакция была создана
			expect(sequelize.transaction).toHaveBeenCalled();

			// Проверяем, что UserTask.findAll был вызван с правильными параметрами
			expect(UserTask.findAll).toHaveBeenCalledWith({
				where: { userId },
				include: [expect.any(Object)],
				transaction: mockTransaction,
			});

			// Проверяем, что транзакция была зафиксирована
			expect(mockTransaction.commit).toHaveBeenCalled();

			// Проверяем результат
			expect(result).toHaveLength(1);
			expect(result[0]).toHaveProperty('taskId', 'task1');
			expect(result[0]).toHaveProperty('progress', 50);
			expect(result[0]).toHaveProperty('task');
		});
	});

	describe('getUserTask', () => {
		it('should get specific user task successfully', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const taskId = 'task1';
			const userTask = {
				id: 1,
				userId,
				taskId,
				progress: 50,
				targetProgress: 100,
				completed: false,
				reward: 0,
				progressHistory: [],
				lastProgressUpdate: new Date(),
				active: true,
				task: {
					id: taskId,
					title: 'Test Task 1',
					description: 'Description 1',
					reward: 100,
					condition: { targetProgress: 100 },
					icon: 'icon1',
					active: true,
				},
			};

			// Мокаем поиск задачи пользователя
			UserTask.findOne.mockResolvedValue(userTask);

			// Вызываем метод сервиса
			const result = await taskService.getUserTask(userId, taskId);

			// Проверяем, что транзакция была создана
			expect(sequelize.transaction).toHaveBeenCalled();

			// Проверяем, что UserTask.findOne был вызван с правильными параметрами
			expect(UserTask.findOne).toHaveBeenCalledWith({
				where: { userId, taskId },
				include: [expect.any(Object)],
				transaction: mockTransaction,
			});

			// Проверяем, что транзакция была зафиксирована
			expect(mockTransaction.commit).toHaveBeenCalled();

			// Проверяем результат
			expect(result).toHaveProperty('taskId', taskId);
			expect(result).toHaveProperty('progress', 50);
			expect(result).toHaveProperty('task');
		});

		it('should throw error if user task not found', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const taskId = 'task1';

			// Мокаем поиск задачи пользователя (не найдена)
			UserTask.findOne.mockResolvedValue(null);

			// Вызываем метод сервиса и ожидаем ошибку
			await expect(
				taskService.getUserTask(userId, taskId)
			).rejects.toThrow(ApiError);

			// Проверяем, что транзакция была отменена
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});

	describe('completeTask', () => {
		it('should complete task successfully', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const taskId = 'task1';
			const userTask = {
				id: 1,
				userId,
				taskId,
				progress: 100,
				targetProgress: 100,
				completed: false,
				reward: 0,
				save: jest.fn(),
			};
			const task = {
				id: taskId,
				title: 'Test Task 1',
				reward: 100,
				condition: { rewardType: 'stardust' },
			};
			const userState = {
				state: { ownedTasksCount: 5 },
				save: jest.fn(),
			};

			// Мокаем поиск задачи пользователя
			UserTask.findOne.mockResolvedValue(userTask);

			// Мокаем поиск задачи
			Task.findByPk.mockResolvedValue(task);

			// Мокаем поиск состояния пользователя
			UserState.findOne.mockResolvedValue(userState);

			// Мокаем регистрацию награды
			marketService.registerTaskReward.mockResolvedValue({});

			// Вызываем метод сервиса
			const result = await taskService.completeTask(userId, taskId);

			// Проверяем, что транзакция была создана
			expect(sequelize.transaction).toHaveBeenCalled();

			// Проверяем, что UserTask.findOne был вызван с правильными параметрами
			expect(UserTask.findOne).toHaveBeenCalledWith({
				where: { userId, taskId },
				transaction: mockTransaction,
			});

			// Проверяем, что Task.findByPk был вызван с правильными параметрами
			expect(Task.findByPk).toHaveBeenCalledWith(taskId, {
				transaction: mockTransaction,
			});

			// Проверяем, что задача была помечена как завершенная
			expect(userTask.completed).toBe(true);
			expect(userTask.save).toHaveBeenCalledWith({
				transaction: mockTransaction,
			});

			// Проверяем, что награда была зарегистрирована
			expect(marketService.registerTaskReward).toHaveBeenCalledWith({
				userId,
				taskId,
				amount: 100,
				currency: 'stardust',
			});

			// Проверяем, что состояние пользователя было обновлено
			expect(userState.state.ownedTasksCount).toBe(6);
			expect(userState.save).toHaveBeenCalledWith({
				transaction: mockTransaction,
			});

			// Проверяем, что транзакция была зафиксирована
			expect(mockTransaction.commit).toHaveBeenCalled();

			// Проверяем результат
			expect(result).toHaveProperty('task', userTask);
			expect(result).toHaveProperty('reward', 100);
			expect(result).toHaveProperty('rewardType', 'stardust');
		});

		it('should throw error if task progress is insufficient', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const taskId = 'task1';
			const userTask = {
				id: 1,
				userId,
				taskId,
				progress: 50,
				targetProgress: 100,
				completed: false,
			};

			// Мокаем поиск задачи пользователя
			UserTask.findOne.mockResolvedValue(userTask);

			// Вызываем метод сервиса и ожидаем ошибку
			await expect(
				taskService.completeTask(userId, taskId)
			).rejects.toThrow(ApiError);

			// Проверяем, что транзакция была отменена
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});

	describe('updateTaskProgress', () => {
		it('should update task progress successfully', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const taskId = 'task1';
			const progress = 25;
			const userTask = {
				id: 1,
				userId,
				taskId,
				progress: 50,
				targetProgress: 100,
				completed: false,
				reward: 0,
				progressHistory: [],
				lastProgressUpdate: new Date(),
				save: jest.fn(),
				task: {
					reward: 100,
				},
			};

			// Мокаем поиск задачи пользователя
			UserTask.findOne.mockResolvedValue(userTask);

			// Вызываем метод сервиса
			const result = await taskService.updateTaskProgress(
				userId,
				taskId,
				progress
			);

			// Проверяем, что транзакция была создана
			expect(sequelize.transaction).toHaveBeenCalled();

			// Проверяем, что UserTask.findOne был вызван с правильными параметрами
			expect(UserTask.findOne).toHaveBeenCalledWith({
				where: { userId, taskId },
				include: [expect.any(Object)],
				transaction: mockTransaction,
			});

			// Проверяем, что прогресс был обновлен
			expect(userTask.progress).toBe(75); // 50 + 25
			expect(userTask.progressHistory).toHaveLength(1);
			expect(userTask.save).toHaveBeenCalledWith({
				transaction: mockTransaction,
			});

			// Проверяем, что транзакция была зафиксирована
			expect(mockTransaction.commit).toHaveBeenCalled();

			// Проверяем результат
			expect(result).toBe(userTask);
		});

		it('should complete task if progress reaches target', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const taskId = 'task1';
			const progress = 60;
			const userTask = {
				id: 1,
				userId,
				taskId,
				progress: 50,
				targetProgress: 100,
				completed: false,
				reward: 0,
				progressHistory: [],
				lastProgressUpdate: new Date(),
				save: jest.fn(),
				task: {
					reward: 100,
				},
			};
			const userState = {
				state: { ownedTasksCount: 5 },
				save: jest.fn(),
			};

			// Мокаем поиск задачи пользователя
			UserTask.findOne.mockResolvedValue(userTask);

			// Мокаем поиск состояния пользователя
			UserState.findOne.mockResolvedValue(userState);

			// Вызываем метод сервиса
			const result = await taskService.updateTaskProgress(
				userId,
				taskId,
				progress
			);

			// Проверяем, что прогресс был обновлен до максимального значения
			expect(userTask.progress).toBe(100); // Ограничено targetProgress
			expect(userTask.completed).toBe(true);
			expect(userTask.reward).toBe(100);
			expect(userTask.save).toHaveBeenCalledTimes(2);

			// Проверяем, что состояние пользователя было обновлено
			expect(userState.state.ownedTasksCount).toBe(6);
			expect(userState.save).toHaveBeenCalled();

			// Проверяем, что транзакция была зафиксирована
			expect(mockTransaction.commit).toHaveBeenCalled();
		});
	});

	describe('getUserTaskStats', () => {
		it('should get user task stats successfully', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const userTasks = [
				{
					id: 1,
					userId,
					taskId: 'task1',
					progress: 50,
					targetProgress: 100,
					completed: false,
					active: true,
				},
				{
					id: 2,
					userId,
					taskId: 'task2',
					progress: 100,
					targetProgress: 100,
					completed: true,
					active: true,
				},
				{
					id: 3,
					userId,
					taskId: 'task3',
					progress: 75,
					targetProgress: 100,
					completed: false,
					active: true,
				},
			];

			// Мокаем поиск задач пользователя
			UserTask.findAll.mockResolvedValue(userTasks);

			// Вызываем метод сервиса
			const result = await taskService.getUserTaskStats(userId);

			// Проверяем, что транзакция была создана
			expect(sequelize.transaction).toHaveBeenCalled();

			// Проверяем, что UserTask.findAll был вызван с правильными параметрами
			expect(UserTask.findAll).toHaveBeenCalledWith({
				where: { userId },
				transaction: mockTransaction,
			});

			// Проверяем, что транзакция была зафиксирована
			expect(mockTransaction.commit).toHaveBeenCalled();

			// Проверяем результат
			expect(result).toHaveProperty('total', 3);
			expect(result).toHaveProperty('completed', 1);
			expect(result).toHaveProperty('active', 2);
			expect(result).toHaveProperty('overallProgress', 62.5); // (50 + 75) / (100 + 100) = 125 / 200 = 0.625 * 100 = 62.5
		});
	});
});
