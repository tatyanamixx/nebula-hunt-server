const taskController = require('../../controllers/task-controller');
const taskService = require('../../service/task-service');
const ApiError = require('../../exceptions/api-error');

// Мокаем сервис задач
jest.mock('../../service/task-service');

describe('TaskController', () => {
	let req;
	let res;
	let next;

	beforeEach(() => {
		// Очищаем все моки перед каждым тестом
		jest.clearAllMocks();

		// Создаем моки для req, res и next
		req = {
			user: {
				id: 123456789,
				username: 'testuser',
			},
			body: {},
			params: {},
		};

		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		next = jest.fn();
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
			req.body = { tasks };

			// Мокаем ответ от сервиса
			taskService.createTasks.mockResolvedValue(tasks);

			// Вызываем метод контроллера
			await taskController.createTasks(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(taskService.createTasks).toHaveBeenCalledWith(tasks);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(tasks);
		});

		it('should handle missing tasks array', async () => {
			// Подготавливаем тестовые данные без tasks
			req.body = {};

			// Вызываем метод контроллера
			await taskController.createTasks(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error).toBeInstanceOf(ApiError);
			expect(error.status).toBe(400);
		});

		it('should handle service error', async () => {
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
			req.body = { tasks };

			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to create tasks';
			taskService.createTasks.mockRejectedValue(new Error(errorMessage));

			// Вызываем метод контроллера
			await taskController.createTasks(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('getUserTasks', () => {
		it('should get user tasks successfully', async () => {
			// Мокаем ответ от сервиса
			const tasks = [
				{ id: 1, taskId: 'task1', progress: 50 },
				{ id: 2, taskId: 'task2', progress: 75 },
			];
			taskService.getUserTasks.mockResolvedValue(tasks);

			// Вызываем метод контроллера
			await taskController.getUserTasks(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(taskService.getUserTasks).toHaveBeenCalledWith(req.user.id);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(tasks);
		});

		it('should handle service error', async () => {
			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to get user tasks';
			taskService.getUserTasks.mockRejectedValue(new Error(errorMessage));

			// Вызываем метод контроллера
			await taskController.getUserTasks(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('getActiveTasks', () => {
		it('should get active tasks successfully', async () => {
			// Мокаем ответ от сервиса
			const tasks = [
				{ id: 1, taskId: 'task1', progress: 50, active: true },
				{ id: 2, taskId: 'task2', progress: 75, active: true },
			];
			taskService.getActiveTasks.mockResolvedValue(tasks);

			// Вызываем метод контроллера
			await taskController.getActiveTasks(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(taskService.getActiveTasks).toHaveBeenCalledWith(
				req.user.id
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(tasks);
		});

		it('should handle service error', async () => {
			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to get active tasks';
			taskService.getActiveTasks.mockRejectedValue(
				new Error(errorMessage)
			);

			// Вызываем метод контроллера
			await taskController.getActiveTasks(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('getUserTask', () => {
		it('should get specific user task successfully', async () => {
			// Подготавливаем тестовые данные
			const taskId = 'task123';
			req.params = { taskId };

			// Мокаем ответ от сервиса
			const task = { id: 1, taskId, progress: 50 };
			taskService.getUserTask.mockResolvedValue(task);

			// Вызываем метод контроллера
			await taskController.getUserTask(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(taskService.getUserTask).toHaveBeenCalledWith(
				req.user.id,
				taskId
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(task);
		});

		it('should handle service error', async () => {
			// Подготавливаем тестовые данные
			const taskId = 'task123';
			req.params = { taskId };

			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to get user task';
			taskService.getUserTask.mockRejectedValue(new Error(errorMessage));

			// Вызываем метод контроллера
			await taskController.getUserTask(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('updateTaskProgress', () => {
		it('should update task progress successfully', async () => {
			// Подготавливаем тестовые данные
			const taskId = 'task123';
			const progress = 25;
			req.body = { taskId, progress };

			// Мокаем ответ от сервиса
			const updatedTask = { id: 1, taskId, progress: 75 };
			taskService.updateTaskProgress.mockResolvedValue(updatedTask);

			// Вызываем метод контроллера
			await taskController.updateTaskProgress(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(taskService.updateTaskProgress).toHaveBeenCalledWith(
				req.user.id,
				taskId,
				progress
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(updatedTask);
		});

		it('should handle missing taskId', async () => {
			// Подготавливаем тестовые данные без taskId
			const progress = 25;
			req.body = { progress };

			// Вызываем метод контроллера
			await taskController.updateTaskProgress(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error).toBeInstanceOf(ApiError);
			expect(error.status).toBe(400);
		});

		it('should handle missing progress', async () => {
			// Подготавливаем тестовые данные без progress
			const taskId = 'task123';
			req.body = { taskId };

			// Вызываем метод контроллера
			await taskController.updateTaskProgress(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error).toBeInstanceOf(ApiError);
			expect(error.status).toBe(400);
		});

		it('should handle service error', async () => {
			// Подготавливаем тестовые данные
			const taskId = 'task123';
			const progress = 25;
			req.body = { taskId, progress };

			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to update task progress';
			taskService.updateTaskProgress.mockRejectedValue(
				new Error(errorMessage)
			);

			// Вызываем метод контроллера
			await taskController.updateTaskProgress(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('completeTask', () => {
		it('should complete task successfully', async () => {
			// Подготавливаем тестовые данные
			const taskId = 'task123';
			req.params = { taskId };

			// Мокаем ответ от сервиса
			const result = {
				task: { id: 1, taskId, completed: true },
				reward: 100,
				rewardType: 'stardust',
			};
			taskService.completeTask.mockResolvedValue(result);

			// Вызываем метод контроллера
			await taskController.completeTask(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(taskService.completeTask).toHaveBeenCalledWith(
				req.user.id,
				taskId
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(result);
		});

		it('should handle missing taskId', async () => {
			// Вызываем метод контроллера без taskId
			await taskController.completeTask(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error).toBeInstanceOf(ApiError);
			expect(error.status).toBe(400);
		});

		it('should handle service error', async () => {
			// Подготавливаем тестовые данные
			const taskId = 'task123';
			req.params = { taskId };

			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to complete task';
			taskService.completeTask.mockRejectedValue(new Error(errorMessage));

			// Вызываем метод контроллера
			await taskController.completeTask(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('initializeUserTasks', () => {
		it('should initialize user tasks successfully', async () => {
			// Мокаем ответ от сервиса
			const result = { tasks: [] };
			taskService.initializeUserTasks.mockResolvedValue(result);

			// Вызываем метод контроллера
			await taskController.initializeUserTasks(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(taskService.initializeUserTasks).toHaveBeenCalledWith(
				req.user.id
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(result);
		});

		it('should handle service error', async () => {
			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to initialize user tasks';
			taskService.initializeUserTasks.mockRejectedValue(
				new Error(errorMessage)
			);

			// Вызываем метод контроллера
			await taskController.initializeUserTasks(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});
});
