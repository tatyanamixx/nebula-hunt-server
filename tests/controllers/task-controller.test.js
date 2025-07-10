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
			initdata: {
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
					title: 'Test Task 1',
					description: 'Description 1',
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
			expect(taskService.getUserTasks).toHaveBeenCalledWith(
				req.initdata.id
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith({ tasks });
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
				req.initdata.id,
				taskId
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(task);
		});

		it('should handle missing taskId', async () => {
			// Вызываем метод контроллера без taskId
			await taskController.getUserTask(req, res, next);

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

	describe('getAllTasks', () => {
		it('should get all tasks successfully', async () => {
			// Мокаем ответ от сервиса
			const tasks = [
				{ id: 'task1', title: 'Task 1' },
				{ id: 'task2', title: 'Task 2' },
			];
			taskService.getAllTasks.mockResolvedValue(tasks);

			// Вызываем метод контроллера
			await taskController.getAllTasks(req, res, next);

			// Проверяем, что сервис был вызван
			expect(taskService.getAllTasks).toHaveBeenCalled();

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(tasks);
		});

		it('should handle service error', async () => {
			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to get all tasks';
			taskService.getAllTasks.mockRejectedValue(new Error(errorMessage));

			// Вызываем метод контроллера
			await taskController.getAllTasks(req, res, next);

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
			req.body = { taskId };

			// Мокаем ответ от сервиса
			const result = {
				task: { id: 1, taskId, completed: true },
				reward: 100,
			};
			taskService.completeTask.mockResolvedValue(result);

			// Вызываем метод контроллера
			await taskController.completeTask(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(taskService.completeTask).toHaveBeenCalledWith(
				req.initdata.id,
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
			req.body = { taskId };

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

	describe('updateTaskProgress', () => {
		it('should update task progress successfully', async () => {
			// Подготавливаем тестовые данные
			const taskId = 'task123';
			const progress = 25;
			req.body = { taskId, progress };

			// Мокаем ответ от сервиса
			const result = { id: 1, taskId, progress: 75 };
			taskService.updateTaskProgress.mockResolvedValue(result);

			// Вызываем метод контроллера
			await taskController.updateTaskProgress(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(taskService.updateTaskProgress).toHaveBeenCalledWith(
				req.initdata.id,
				taskId,
				progress
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(result);
		});

		it('should handle missing taskId or progress', async () => {
			// Вызываем метод контроллера без taskId и progress
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

	describe('getTaskProgress', () => {
		it('should get task progress successfully', async () => {
			// Подготавливаем тестовые данные
			const taskId = 'task123';
			req.params = { taskId };

			// Мокаем ответ от сервиса
			const progress = { taskId, progress: 50, targetProgress: 100 };
			taskService.getTaskProgress.mockResolvedValue(progress);

			// Вызываем метод контроллера
			await taskController.getTaskProgress(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(taskService.getTaskProgress).toHaveBeenCalledWith(
				req.initdata.id,
				taskId
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(progress);
		});

		it('should handle missing taskId', async () => {
			// Вызываем метод контроллера без taskId
			await taskController.getTaskProgress(req, res, next);

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
			const errorMessage = 'Failed to get task progress';
			taskService.getTaskProgress.mockRejectedValue(
				new Error(errorMessage)
			);

			// Вызываем метод контроллера
			await taskController.getTaskProgress(req, res, next);

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
				req.initdata.id
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

	describe('getUserTaskStats', () => {
		it('should get user task stats successfully', async () => {
			// Мокаем ответ от сервиса
			const stats = {
				total: 10,
				completed: 5,
				active: 5,
				overallProgress: 50,
			};
			taskService.getUserTaskStats.mockResolvedValue(stats);

			// Вызываем метод контроллера
			await taskController.getUserTaskStats(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(taskService.getUserTaskStats).toHaveBeenCalledWith(
				req.initdata.id
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(stats);
		});

		it('should handle service error', async () => {
			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to get user task stats';
			taskService.getUserTaskStats.mockRejectedValue(
				new Error(errorMessage)
			);

			// Вызываем метод контроллера
			await taskController.getUserTaskStats(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});

	describe('updateTask', () => {
		it('should update task successfully', async () => {
			// Подготавливаем тестовые данные
			const taskId = 'task123';
			const taskData = { title: 'Updated Task', reward: 150 };
			req.params = { taskId };
			req.body = taskData;

			// Мокаем ответ от сервиса
			const updatedTask = { id: taskId, ...taskData };
			taskService.updateTask.mockResolvedValue(updatedTask);

			// Вызываем метод контроллера
			await taskController.updateTask(req, res, next);

			// Проверяем, что сервис был вызван с правильными параметрами
			expect(taskService.updateTask).toHaveBeenCalledWith(
				taskId,
				taskData
			);

			// Проверяем ответ
			expect(res.json).toHaveBeenCalledWith(updatedTask);
		});

		it('should handle missing taskId', async () => {
			// Вызываем метод контроллера без taskId
			await taskController.updateTask(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error).toBeInstanceOf(ApiError);
			expect(error.status).toBe(400);
		});

		it('should handle service error', async () => {
			// Подготавливаем тестовые данные
			const taskId = 'task123';
			const taskData = { title: 'Updated Task', reward: 150 };
			req.params = { taskId };
			req.body = taskData;

			// Мокаем ошибку от сервиса
			const errorMessage = 'Failed to update task';
			taskService.updateTask.mockRejectedValue(new Error(errorMessage));

			// Вызываем метод контроллера
			await taskController.updateTask(req, res, next);

			// Проверяем, что next был вызван с ошибкой
			expect(next).toHaveBeenCalled();
			const error = next.mock.calls[0][0];
			expect(error.message).toBe(errorMessage);
		});
	});
});
