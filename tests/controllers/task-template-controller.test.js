const taskTemplateController = require('../../controllers/task-template-controller');
const taskTemplateService = require('../../service/task-template-service');
const ApiError = require('../../exceptions/api-error');

// Мокаем сервисы и зависимости
jest.mock('../../service/task-template-service', () => ({
	getAllTaskTemplates: jest.fn(),
	getTaskTemplateById: jest.fn(),
	createTaskTemplate: jest.fn(),
	updateTaskTemplate: jest.fn(),
	deleteTaskTemplate: jest.fn(),
	setTaskTemplateStatus: jest.fn(),
}));

describe('TaskTemplateController', () => {
	let req, res, next;

	beforeEach(() => {
		// Очищаем моки перед каждым тестом
		jest.clearAllMocks();

		// Создаем моки для req, res и next
		req = {
			body: {},
			params: {},
			query: {},
		};

		res = {
			json: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
		};

		next = jest.fn();
	});

	describe('createTaskTemplate', () => {
		it('should create a task template and return it', async () => {
			// Mock данных
			const taskData = {
				id: 'task1',
				title: 'Task 1',
				description: 'Description 1',
				reward: { type: 'stardust', amount: 100 },
				condition: { type: 'collect', target: 10 },
				icon: 'icon1.png',
			};

			const createdTask = { ...taskData, active: true };

			req.body = taskData;
			taskTemplateService.createTaskTemplate.mockResolvedValue(
				createdTask
			);

			// Вызываем тестируемый метод
			await taskTemplateController.createTaskTemplate(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(taskTemplateService.createTaskTemplate).toHaveBeenCalledWith(
				taskData
			);
			expect(res.json).toHaveBeenCalledWith(createdTask);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error if task data is missing', async () => {
			// Mock данных - отсутствуют данные задачи
			req.body = null;

			// Вызываем тестируемый метод
			await taskTemplateController.createTaskTemplate(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(
				taskTemplateService.createTaskTemplate
			).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 400,
					message: 'Invalid request: task data required',
				})
			);
		});

		it('should call next with error if service throws', async () => {
			// Mock данных
			const taskData = {
				id: 'task1',
				title: 'Task 1',
			};

			req.body = taskData;

			// Мокаем ошибку сервиса
			const error = new Error('Service error');
			taskTemplateService.createTaskTemplate.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await taskTemplateController.createTaskTemplate(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(taskTemplateService.createTaskTemplate).toHaveBeenCalledWith(
				taskData
			);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('getAllTaskTemplates', () => {
		it('should return all task templates without filter', async () => {
			// Mock данных
			const tasks = [
				{ id: 'task1', title: 'Task 1', active: true },
				{ id: 'task2', title: 'Task 2', active: false },
			];

			taskTemplateService.getAllTaskTemplates.mockResolvedValue(tasks);

			// Вызываем тестируемый метод
			await taskTemplateController.getAllTaskTemplates(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(
				taskTemplateService.getAllTaskTemplates
			).toHaveBeenCalledWith({});
			expect(res.json).toHaveBeenCalledWith(tasks);
			expect(next).not.toHaveBeenCalled();
		});

		it('should return task templates with active filter', async () => {
			// Mock данных
			const tasks = [{ id: 'task1', title: 'Task 1', active: true }];

			req.query = { active: 'true' };
			taskTemplateService.getAllTaskTemplates.mockResolvedValue(tasks);

			// Вызываем тестируемый метод
			await taskTemplateController.getAllTaskTemplates(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(
				taskTemplateService.getAllTaskTemplates
			).toHaveBeenCalledWith({ active: true });
			expect(res.json).toHaveBeenCalledWith(tasks);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error if service throws', async () => {
			// Мокаем ошибку сервиса
			const error = new Error('Service error');
			taskTemplateService.getAllTaskTemplates.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await taskTemplateController.getAllTaskTemplates(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(taskTemplateService.getAllTaskTemplates).toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('getTaskTemplate', () => {
		it('should return task template by id', async () => {
			// Mock данных
			const taskId = 'task1';
			const task = {
				id: taskId,
				title: 'Task 1',
				description: 'Description 1',
				active: true,
			};

			req.params = { taskId };
			taskTemplateService.getTaskTemplateById.mockResolvedValue(task);

			// Вызываем тестируемый метод
			await taskTemplateController.getTaskTemplate(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(
				taskTemplateService.getTaskTemplateById
			).toHaveBeenCalledWith(taskId);
			expect(res.json).toHaveBeenCalledWith(task);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error if service throws', async () => {
			// Mock данных
			const taskId = 'nonexistent';
			req.params = { taskId };

			// Мокаем ошибку сервиса
			const error = new Error('Task not found');
			taskTemplateService.getTaskTemplateById.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await taskTemplateController.getTaskTemplate(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(
				taskTemplateService.getTaskTemplateById
			).toHaveBeenCalledWith(taskId);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('updateTaskTemplate', () => {
		it('should update task template and return it', async () => {
			// Mock данных
			const taskId = 'task1';
			const taskData = {
				title: 'Updated Task 1',
				description: 'Updated Description',
			};

			const updatedTask = {
				id: taskId,
				...taskData,
				active: true,
			};

			req.params = { taskId };
			req.body = taskData;
			taskTemplateService.updateTaskTemplate.mockResolvedValue(
				updatedTask
			);

			// Вызываем тестируемый метод
			await taskTemplateController.updateTaskTemplate(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(taskTemplateService.updateTaskTemplate).toHaveBeenCalledWith(
				taskId,
				taskData
			);
			expect(res.json).toHaveBeenCalledWith(updatedTask);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error if taskId is missing', async () => {
			// Mock данных - отсутствует taskId
			req.params = {};
			req.body = { title: 'Updated Task' };

			// Вызываем тестируемый метод
			await taskTemplateController.updateTaskTemplate(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(
				taskTemplateService.updateTaskTemplate
			).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 400,
					message: 'Task ID is required',
				})
			);
		});

		it('should call next with error if service throws', async () => {
			// Mock данных
			const taskId = 'task1';
			const taskData = { title: 'Updated Task' };

			req.params = { taskId };
			req.body = taskData;

			// Мокаем ошибку сервиса
			const error = new Error('Service error');
			taskTemplateService.updateTaskTemplate.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await taskTemplateController.updateTaskTemplate(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(taskTemplateService.updateTaskTemplate).toHaveBeenCalledWith(
				taskId,
				taskData
			);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('deleteTaskTemplate', () => {
		it('should delete task template and return success message', async () => {
			// Mock данных
			const taskId = 'task1';
			const result = {
				success: true,
				message: `Task template ${taskId} deleted successfully`,
			};

			req.params = { taskId };
			taskTemplateService.deleteTaskTemplate.mockResolvedValue(result);

			// Вызываем тестируемый метод
			await taskTemplateController.deleteTaskTemplate(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(taskTemplateService.deleteTaskTemplate).toHaveBeenCalledWith(
				taskId
			);
			expect(res.json).toHaveBeenCalledWith(result);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error if taskId is missing', async () => {
			// Mock данных - отсутствует taskId
			req.params = {};

			// Вызываем тестируемый метод
			await taskTemplateController.deleteTaskTemplate(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(
				taskTemplateService.deleteTaskTemplate
			).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 400,
					message: 'Task ID is required',
				})
			);
		});

		it('should call next with error if service throws', async () => {
			// Mock данных
			const taskId = 'task1';
			req.params = { taskId };

			// Мокаем ошибку сервиса
			const error = new Error('Service error');
			taskTemplateService.deleteTaskTemplate.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await taskTemplateController.deleteTaskTemplate(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(taskTemplateService.deleteTaskTemplate).toHaveBeenCalledWith(
				taskId
			);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('activateTaskTemplate', () => {
		it('should activate task template and return it', async () => {
			// Mock данных
			const taskId = 'task1';
			const activatedTask = {
				id: taskId,
				title: 'Task 1',
				active: true,
			};

			req.params = { taskId };
			taskTemplateService.setTaskTemplateStatus.mockResolvedValue(
				activatedTask
			);

			// Вызываем тестируемый метод
			await taskTemplateController.activateTaskTemplate(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(
				taskTemplateService.setTaskTemplateStatus
			).toHaveBeenCalledWith(taskId, true);
			expect(res.json).toHaveBeenCalledWith(activatedTask);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error if taskId is missing', async () => {
			// Mock данных - отсутствует taskId
			req.params = {};

			// Вызываем тестируемый метод
			await taskTemplateController.activateTaskTemplate(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(
				taskTemplateService.setTaskTemplateStatus
			).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 400,
					message: 'Task ID is required',
				})
			);
		});

		it('should call next with error if service throws', async () => {
			// Mock данных
			const taskId = 'task1';
			req.params = { taskId };

			// Мокаем ошибку сервиса
			const error = new Error('Service error');
			taskTemplateService.setTaskTemplateStatus.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await taskTemplateController.activateTaskTemplate(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(
				taskTemplateService.setTaskTemplateStatus
			).toHaveBeenCalledWith(taskId, true);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('deactivateTaskTemplate', () => {
		it('should deactivate task template and return it', async () => {
			// Mock данных
			const taskId = 'task1';
			const deactivatedTask = {
				id: taskId,
				title: 'Task 1',
				active: false,
			};

			req.params = { taskId };
			taskTemplateService.setTaskTemplateStatus.mockResolvedValue(
				deactivatedTask
			);

			// Вызываем тестируемый метод
			await taskTemplateController.deactivateTaskTemplate(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(
				taskTemplateService.setTaskTemplateStatus
			).toHaveBeenCalledWith(taskId, false);
			expect(res.json).toHaveBeenCalledWith(deactivatedTask);
			expect(next).not.toHaveBeenCalled();
		});

		it('should call next with error if taskId is missing', async () => {
			// Mock данных - отсутствует taskId
			req.params = {};

			// Вызываем тестируемый метод
			await taskTemplateController.deactivateTaskTemplate(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(
				taskTemplateService.setTaskTemplateStatus
			).not.toHaveBeenCalled();
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 400,
					message: 'Task ID is required',
				})
			);
		});

		it('should call next with error if service throws', async () => {
			// Mock данных
			const taskId = 'task1';
			req.params = { taskId };

			// Мокаем ошибку сервиса
			const error = new Error('Service error');
			taskTemplateService.setTaskTemplateStatus.mockRejectedValue(error);

			// Вызываем тестируемый метод
			await taskTemplateController.deactivateTaskTemplate(req, res, next);

			// Проверяем, что были вызваны нужные методы
			expect(
				taskTemplateService.setTaskTemplateStatus
			).toHaveBeenCalledWith(taskId, false);
			expect(res.json).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(error);
		});
	});
});
