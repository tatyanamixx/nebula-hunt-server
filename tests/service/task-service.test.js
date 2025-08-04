const taskService = require('../../service/task-service');
const { TaskTemplate, UserTask, UserState } = require('../../models/models');
const ApiError = require('../../exceptions/api-error');
const sequelize = require('../../db');
const marketService = require('../../service/market-service');

// Мокаем модели и другие зависимости
jest.mock('../../models/models', () => ({
	TaskTemplate: {
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

jest.mock('../../service/market-service', () => ({}));

describe('TaskService', () => {
	let transaction;
	let mockCommit;
	let mockRollback;

	beforeEach(() => {
		// Очищаем все моки перед каждым тестом
		jest.clearAllMocks();

		// Создаем мок для транзакции
		mockCommit = jest.fn();
		mockRollback = jest.fn();
		transaction = { commit: mockCommit, rollback: mockRollback };
		sequelize.transaction.mockResolvedValue(transaction);
	});

	describe('createTasks', () => {
		it('should create tasks successfully', async () => {
			// Подготавливаем тестовые данные
			const tasks = [
				{
					id: 'task1',
					title: { en: 'Test Task 1', ru: 'Тестовое задание 1' },
					description: { en: 'Description 1', ru: 'Описание 1' },
					reward: 100,
					condition: { targetProgress: 100 },
					icon: 'icon1',
				},
				{
					id: 'task2',
					title: { en: 'Test Task 2', ru: 'Тестовое задание 2' },
					description: { en: 'Description 2', ru: 'Описание 2' },
					reward: 200,
					condition: { targetProgress: 200 },
					icon: 'icon2',
				},
			];

			// Мокаем создание задач
			TaskTemplate.create.mockImplementation((task) =>
				Promise.resolve(task)
			);

			// Вызываем тестируемый метод
			const result = await taskService.createTasks(tasks);

			// Проверяем, что транзакция была создана
			expect(sequelize.transaction).toHaveBeenCalled();

			// Проверяем, что TaskTemplate.create был вызван для каждой задачи
			expect(TaskTemplate.create).toHaveBeenCalledTimes(2);
			expect(TaskTemplate.create).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'task1',
				}),
				{ transaction }
			);
			expect(TaskTemplate.create).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'task2',
				}),
				{ transaction }
			);

			// Проверяем, что транзакция была подтверждена
			expect(mockCommit).toHaveBeenCalled();
			expect(mockRollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result).toHaveLength(2);
			expect(result[0].id).toBe('task1');
			expect(result[1].id).toBe('task2');
		});

		it('should handle validation error', async () => {
			// Подготавливаем тестовые данные с отсутствующими полями
			const tasks = [
				{
					id: 'task1',
					// Отсутствует title
					description: { en: 'Description 1', ru: 'Описание 1' },
					reward: 100,
					condition: { targetProgress: 100 },
					icon: 'icon1',
				},
			];

			// Вызываем тестируемый метод и ожидаем ошибку
			await expect(taskService.createTasks(tasks)).rejects.toThrow(
				ApiError
			);

			// Проверяем, что транзакция была создана
			expect(sequelize.transaction).toHaveBeenCalled();

			// Проверяем, что транзакция была отменена
			expect(mockRollback).toHaveBeenCalled();
			expect(mockCommit).not.toHaveBeenCalled();

			// Проверяем, что TaskTemplate.create не был вызван
			expect(TaskTemplate.create).not.toHaveBeenCalled();
		});

		it('should handle database error', async () => {
			// Подготавливаем тестовые данные
			const tasks = [
				{
					id: 'task1',
					title: { en: 'Test Task 1', ru: 'Тестовое задание 1' },
					description: { en: 'Description 1', ru: 'Описание 1' },
					reward: 100,
					condition: { targetProgress: 100 },
					icon: 'icon1',
				},
			];

			// Мокаем ошибку при создании задачи
			const errorMessage = 'Database error';
			TaskTemplate.create.mockRejectedValue(new Error(errorMessage));

			// Вызываем тестируемый метод и ожидаем ошибку
			await expect(taskService.createTasks(tasks)).rejects.toThrow(
				errorMessage
			);

			// Проверяем, что транзакция была создана
			expect(sequelize.transaction).toHaveBeenCalled();

			// Проверяем, что транзакция была отменена
			expect(mockRollback).toHaveBeenCalled();
			expect(mockCommit).not.toHaveBeenCalled();
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
					completedAt: null,
					tasktemplate: {
						id: 'task1',
						title: { en: 'Task 1', ru: 'Задание 1' },
						description: { en: 'Description 1', ru: 'Описание 1' },
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
				transaction,
			});

			// Проверяем, что транзакция была подтверждена
			expect(mockCommit).toHaveBeenCalled();
			expect(mockRollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result).toHaveLength(1);
			expect(result[0].taskId).toBe('task1');
			expect(result[0].task).toBeDefined();
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
				completedAt: null,
				tasktemplate: {
					id: 'task1',
					title: { en: 'Task 1', ru: 'Задание 1' },
					description: { en: 'Description 1', ru: 'Описание 1' },
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
				transaction,
			});

			// Проверяем, что транзакция была подтверждена
			expect(mockCommit).toHaveBeenCalled();
			expect(mockRollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result.taskId).toBe(taskId);
			expect(result.task).toBeDefined();
		});

		it('should throw error if user task not found', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const taskId = 'task1';

			// Мокаем отсутствие задачи пользователя
			UserTask.findOne.mockResolvedValue(null);

			// Вызываем метод сервиса и ожидаем ошибку
			await expect(
				taskService.getUserTask(userId, taskId)
			).rejects.toThrow('User task not found');

			// Проверяем, что транзакция была отменена
			expect(mockRollback).toHaveBeenCalled();
			expect(mockCommit).not.toHaveBeenCalled();
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
				save: jest.fn(),
			};
			const task = {
				id: taskId,
				title: { en: 'Task 1', ru: 'Задание 1' },
				description: { en: 'Description 1', ru: 'Описание 1' },
				reward: 100,
				condition: { targetProgress: 100, rewardType: 'stardust' },
				icon: 'icon1',
			};

			// Мокаем поиск задачи пользователя
			UserTask.findOne.mockResolvedValue(userTask);

			// Мокаем поиск задачи
			TaskTemplate.findByPk.mockResolvedValue(task);

			// Мокаем поиск состояния пользователя
			const userState = {
				state: { ownedTasksCount: 5 },
				save: jest.fn(),
			};
			UserState.findOne.mockResolvedValue(userState);

			// Вызываем метод сервиса
			const result = await taskService.completeTask(userId, taskId);

			// Проверяем, что транзакция была создана
			expect(sequelize.transaction).toHaveBeenCalled();

			// Проверяем, что UserTask.findOne был вызван с правильными параметрами
			expect(UserTask.findOne).toHaveBeenCalledWith({
				where: { userId, taskId },
				transaction,
			});

			// Проверяем, что TaskTemplate.findByPk был вызван с правильными параметрами
			expect(TaskTemplate.findByPk).toHaveBeenCalledWith(taskId, {
				transaction,
			});

			// Проверяем, что задача была помечена как завершенная
			expect(userTask.completed).toBe(true);
			expect(userTask.save).toHaveBeenCalledWith({
				transaction,
			});

			// Проверяем, что состояние пользователя было обновлено
			expect(userState.state.ownedTasksCount).toBe(6);
			expect(userState.save).toHaveBeenCalledWith({
				transaction,
			});

			// Проверяем, что транзакция была подтверждена
			expect(mockCommit).toHaveBeenCalled();
			expect(mockRollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result.task).toBe(userTask);
			expect(result.reward).toBe(100);
			expect(result.rewardType).toBe('stardust');
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
			).rejects.toThrow('Not enough progress');

			// Проверяем, что транзакция была отменена
			expect(mockRollback).toHaveBeenCalled();
			expect(mockCommit).not.toHaveBeenCalled();
		});
	});

	describe('completeTask', () => {
		it('should complete task successfully', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const slug = 'task1';
			const userTask = {
				id: 1,
				userId,
				taskId: 1,
				completed: false,
				save: jest.fn(),
				tasktemplate: {
					reward: 100,
				},
			};

			// Мокаем поиск задачи пользователя
			UserTask.findOne.mockResolvedValue(userTask);

			// Мокаем поиск состояния пользователя
			const userState = {
				state: { ownedTasksCount: 5 },
				save: jest.fn(),
			};
			UserState.findOne.mockResolvedValue(userState);

			// Вызываем метод сервиса
			const result = await taskService.completeTask(userId, slug);

			// Проверяем, что задача была завершена
			expect(userTask.completed).toBe(true);
			expect(userTask.reward).toBe(100);
			expect(userTask.save).toHaveBeenCalled();

			// Проверяем, что состояние пользователя было обновлено
			expect(userState.save).toHaveBeenCalled();

			// Проверяем, что транзакция была подтверждена
			expect(mockCommit).toHaveBeenCalled();
			expect(mockRollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result).toBe(userTask);
		});

		it('should handle already completed task', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const slug = 'task1';
			const userTask = {
				id: 1,
				userId,
				taskId: 1,
				completed: true,
				save: jest.fn(),
			};

			// Мокаем поиск задачи пользователя
			UserTask.findOne.mockResolvedValue(userTask);

			// Вызываем метод сервиса
			const result = await taskService.completeTask(userId, slug);

			// Проверяем, что транзакция была откачена
			expect(mockRollback).toHaveBeenCalled();
			expect(mockCommit).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result).toBe(userTask);
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
					active: false,
				},
			];

			// Мокаем поиск задач пользователя
			UserTask.findAll.mockResolvedValue(userTasks);

			// Вызываем метод сервиса
			const result = await taskService.getUserTaskStats(userId);

			// Проверяем, что UserTask.findAll был вызван с правильными параметрами
			expect(UserTask.findAll).toHaveBeenCalledWith({
				where: { userId },
				transaction,
			});

			// Проверяем, что транзакция была подтверждена
			expect(mockCommit).toHaveBeenCalled();
			expect(mockRollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result).toHaveProperty('total', 2);
			expect(result).toHaveProperty('completed', 1);
			expect(result).toHaveProperty('active', 1);
			expect(result).toHaveProperty('overallProgress');
			expect(result).toHaveProperty('lastUpdate');
		});
	});

	describe('getUserTask', () => {
		it('should get user task with initialization logic', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const slug = 'task1';
			
			// Мокаем шаблоны задач
			const taskTemplates = [
				{
					id: 1,
					slug: 'task1',
					active: true,
					toJSON: () => ({ id: 1, slug: 'task1', active: true }),
				},
			];
			TaskTemplate.findAll.mockResolvedValue(taskTemplates);

			// Мокаем существующие задачи пользователя
			const existingUserTasks = [];
			UserTask.findAll.mockResolvedValue(existingUserTasks);

			// Мокаем findOrCreate для создания новых задач
			UserTask.findOrCreate.mockResolvedValue([
				{
					id: 1,
					userId,
					taskTemplateId: 1,
					completed: false,
					active: true,
					toJSON: () => ({ id: 1, userId, taskTemplateId: 1, completed: false, active: true }),
				},
				true, // created
			]);

			// Мокаем поиск конкретной задачи
			const userTask = {
				id: 1,
				userId,
				taskTemplateId: 1,
				completed: false,
				active: true,
				tasktemplate: {
					id: 1,
					slug: 'task1',
					title: { en: 'Task 1', ru: 'Задание 1' },
					description: { en: 'Description 1', ru: 'Описание 1' },
					reward: 100,
					condition: { targetProgress: 100 },
					icon: 'icon1',
					active: true,
				},
			};
			UserTask.findOne.mockResolvedValue(userTask);

			// Мокаем состояние пользователя
			const userState = {
				state: { ownedTasksCount: 0, activeTasksCount: 0 },
				save: jest.fn(),
			};
			UserState.findOne.mockResolvedValue(userState);

			// Вызываем метод сервиса
			const result = await taskService.getUserTask(userId, slug);

			// Проверяем, что транзакция была создана
			expect(sequelize.transaction).toHaveBeenCalled();

			// Проверяем, что TaskTemplate.findAll был вызван для инициализации
			expect(TaskTemplate.findAll).toHaveBeenCalledWith({
				transaction: expect.anything(),
			});

			// Проверяем, что UserTask.findAll был вызван для получения существующих задач
			expect(UserTask.findAll).toHaveBeenCalledWith({
				where: { userId },
				transaction: expect.anything(),
			});

			// Проверяем, что UserTask.findOrCreate был вызван для создания новых задач
			expect(UserTask.findOrCreate).toHaveBeenCalled();

			// Проверяем, что UserState.findOne был вызван для обновления счетчиков
			expect(UserState.findOne).toHaveBeenCalledWith({
				where: { userId },
				transaction: expect.anything(),
			});

			// Проверяем, что транзакция была подтверждена
			expect(mockCommit).toHaveBeenCalled();
			expect(mockRollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result).toHaveProperty('id', 1);
			expect(result).toHaveProperty('slug', 'task1');
			expect(result).toHaveProperty('task');
		});

		it('should handle task template not found', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const slug = 'nonexistent';

			// Мокаем отсутствие шаблона задачи
			TaskTemplate.findOne.mockResolvedValue(null);

			// Вызываем метод сервиса и ожидаем ошибку
			await expect(
				taskService.getUserTask(userId, slug)
			).rejects.toThrow('Task template not found');

			// Проверяем, что транзакция была отменена
			expect(mockRollback).toHaveBeenCalled();
			expect(mockCommit).not.toHaveBeenCalled();
		});

		it('should handle user task not found', async () => {
			// Подготавливаем тестовые данные
			const userId = 123;
			const slug = 'task1';

			// Мокаем шаблон задачи
			const taskTemplate = {
				id: 1,
				slug: 'task1',
				active: true,
			};
			TaskTemplate.findOne.mockResolvedValue(taskTemplate);

			// Мокаем отсутствие задачи пользователя
			UserTask.findOne.mockResolvedValue(null);

			// Вызываем метод сервиса и ожидаем ошибку
			await expect(
				taskService.getUserTask(userId, slug)
			).rejects.toThrow('User task not found');

			// Проверяем, что транзакция была отменена
			expect(mockRollback).toHaveBeenCalled();
			expect(mockCommit).not.toHaveBeenCalled();
		});
	});

	// Добавьте тесты для других методов сервиса задач
});
