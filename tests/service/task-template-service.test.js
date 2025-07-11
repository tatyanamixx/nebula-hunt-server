const taskTemplateService = require('../../service/task-template-service');
const { TaskTemplate } = require('../../models/models');
const ApiError = require('../../exceptions/api-error');
const sequelize = require('../../db');

// Мокаем модели и зависимости
jest.mock('../../models/models', () => ({
	TaskTemplate: {
		findAll: jest.fn(),
		findByPk: jest.fn(),
		create: jest.fn(),
		findOne: jest.fn(),
	},
}));

jest.mock('../../db', () => ({
	transaction: jest.fn(),
}));

describe('TaskTemplateService', () => {
	// Мок для транзакции
	const mockTransaction = {
		commit: jest.fn().mockResolvedValue(undefined),
		rollback: jest.fn().mockResolvedValue(undefined),
	};

	beforeEach(() => {
		jest.clearAllMocks();
		sequelize.transaction.mockResolvedValue(mockTransaction);
	});

	describe('createTaskTemplates', () => {
		it('should create multiple task templates successfully', async () => {
			// Mock данных
			const tasksData = [
				{
					id: 'task1',
					title: 'Task 1',
					description: 'Description 1',
					reward: { type: 'stardust', amount: 100 },
					condition: { type: 'collect', target: 10 },
					icon: 'icon1.png',
					active: true,
				},
				{
					id: 'task2',
					title: 'Task 2',
					description: 'Description 2',
					reward: { type: 'darkMatter', amount: 50 },
					condition: { type: 'visit', target: 5 },
					icon: 'icon2.png',
					active: true,
				},
			];

			const createdTasks = tasksData.map((task) => ({
				...task,
				toJSON: () => task,
			}));

			// Мокаем результаты запросов
			TaskTemplate.create
				.mockResolvedValueOnce(createdTasks[0])
				.mockResolvedValueOnce(createdTasks[1]);

			// Вызываем тестируемый метод
			const result = await taskTemplateService.createTaskTemplates(
				tasksData
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(TaskTemplate.create).toHaveBeenCalledTimes(2);

			// Проверяем первый вызов create
			expect(TaskTemplate.create).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({
					id: 'task1',
					title: 'Task 1',
					description: 'Description 1',
					reward: { type: 'stardust', amount: 100 },
					condition: { type: 'collect', target: 10 },
					icon: 'icon1.png',
					active: true,
				}),
				{ transaction: mockTransaction }
			);

			// Проверяем второй вызов create
			expect(TaskTemplate.create).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({
					id: 'task2',
					title: 'Task 2',
					description: 'Description 2',
					reward: { type: 'darkMatter', amount: 50 },
					condition: { type: 'visit', target: 5 },
					icon: 'icon2.png',
					active: true,
				}),
				{ transaction: mockTransaction }
			);

			expect(mockTransaction.commit).toHaveBeenCalled();
			expect(mockTransaction.rollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result).toHaveLength(2);
			expect(result).toEqual(createdTasks);
		});

		it('should throw ApiError if task data is invalid', async () => {
			// Mock данных с отсутствующим обязательным полем (title)
			const invalidTasksData = [
				{
					id: 'task1',
					// title отсутствует
					description: 'Description 1',
					reward: { type: 'stardust', amount: 100 },
					condition: { type: 'collect', target: 10 },
					icon: 'icon1.png',
				},
			];

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(
				taskTemplateService.createTaskTemplates(invalidTasksData)
			).rejects.toThrow(
				'Failed to create task templates: Invalid task template data structure'
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(TaskTemplate.create).not.toHaveBeenCalled();
			expect(mockTransaction.commit).not.toHaveBeenCalled();
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});

		it('should throw ApiError if database operation fails', async () => {
			// Mock данных
			const tasksData = [
				{
					id: 'task1',
					title: 'Task 1',
					description: 'Description 1',
					reward: { type: 'stardust', amount: 100 },
					condition: { type: 'collect', target: 10 },
					icon: 'icon1.png',
					active: true,
				},
			];

			// Мокаем ошибку при создании задачи
			const error = new Error('Database error');
			TaskTemplate.create.mockRejectedValue(error);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(
				taskTemplateService.createTaskTemplates(tasksData)
			).rejects.toThrow(
				'Failed to create task templates: Database error'
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(TaskTemplate.create).toHaveBeenCalledTimes(1);
			expect(mockTransaction.commit).not.toHaveBeenCalled();
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});

	describe('getAllTaskTemplates', () => {
		it('should return all task templates without filter', async () => {
			// Mock данных
			const taskTemplates = [
				{
					id: 'task1',
					title: 'Task 1',
					active: true,
				},
				{
					id: 'task2',
					title: 'Task 2',
					active: false,
				},
			];

			// Мокаем результаты запросов
			TaskTemplate.findAll.mockResolvedValue(taskTemplates);

			// Вызываем тестируемый метод
			const result = await taskTemplateService.getAllTaskTemplates();

			// Проверяем, что были вызваны нужные методы
			expect(TaskTemplate.findAll).toHaveBeenCalledWith({
				where: {},
				order: [['id', 'ASC']],
			});

			// Проверяем результат
			expect(result).toEqual(taskTemplates);
		});

		it('should return active task templates with filter', async () => {
			// Mock данных
			const taskTemplates = [
				{
					id: 'task1',
					title: 'Task 1',
					active: true,
				},
			];

			// Мокаем результаты запросов
			TaskTemplate.findAll.mockResolvedValue(taskTemplates);

			// Вызываем тестируемый метод с фильтром
			const result = await taskTemplateService.getAllTaskTemplates({
				active: true,
			});

			// Проверяем, что были вызваны нужные методы
			expect(TaskTemplate.findAll).toHaveBeenCalledWith({
				where: { active: true },
				order: [['id', 'ASC']],
			});

			// Проверяем результат
			expect(result).toEqual(taskTemplates);
		});

		it('should throw ApiError if database query fails', async () => {
			// Мокаем ошибку при запросе к базе данных
			const error = new Error('Database error');
			TaskTemplate.findAll.mockRejectedValue(error);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(
				taskTemplateService.getAllTaskTemplates()
			).rejects.toThrow('Failed to get task templates: Database error');

			// Проверяем, что были вызваны нужные методы
			expect(TaskTemplate.findAll).toHaveBeenCalled();
		});
	});

	describe('getTaskTemplateById', () => {
		it('should return task template by id', async () => {
			// Mock данных
			const taskId = 'task1';
			const taskTemplate = {
				id: taskId,
				title: 'Task 1',
				description: 'Description 1',
				reward: { type: 'stardust', amount: 100 },
				condition: { type: 'collect', target: 10 },
				icon: 'icon1.png',
				active: true,
			};

			// Мокаем результаты запросов
			TaskTemplate.findByPk.mockResolvedValue(taskTemplate);

			// Вызываем тестируемый метод
			const result = await taskTemplateService.getTaskTemplateById(
				taskId
			);

			// Проверяем, что были вызваны нужные методы
			expect(TaskTemplate.findByPk).toHaveBeenCalledWith(taskId);

			// Проверяем результат
			expect(result).toEqual(taskTemplate);
		});

		it('should throw ApiError if task template not found', async () => {
			// Mock данных
			const taskId = 'nonexistent';

			// Мокаем результаты запросов
			TaskTemplate.findByPk.mockResolvedValue(null);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(
				taskTemplateService.getTaskTemplateById(taskId)
			).rejects.toThrow(
				'Failed to get task template: Task template not found'
			);

			// Проверяем, что были вызваны нужные методы
			expect(TaskTemplate.findByPk).toHaveBeenCalledWith(taskId);
		});

		it('should throw ApiError if database query fails', async () => {
			// Mock данных
			const taskId = 'task1';

			// Мокаем ошибку при запросе к базе данных
			const error = new Error('Database error');
			TaskTemplate.findByPk.mockRejectedValue(error);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(
				taskTemplateService.getTaskTemplateById(taskId)
			).rejects.toThrow('Failed to get task template: Database error');

			// Проверяем, что были вызваны нужные методы
			expect(TaskTemplate.findByPk).toHaveBeenCalledWith(taskId);
		});
	});

	describe('updateTaskTemplate', () => {
		it('should update task template successfully', async () => {
			// Mock данных
			const taskId = 'task1';
			const taskData = {
				title: 'Updated Task 1',
				description: 'Updated Description 1',
			};

			const existingTask = {
				id: taskId,
				title: 'Task 1',
				description: 'Description 1',
				reward: { type: 'stardust', amount: 100 },
				condition: { type: 'collect', target: 10 },
				icon: 'icon1.png',
				active: true,
				update: jest.fn().mockResolvedValue(true),
			};

			const updatedTask = {
				...existingTask,
				...taskData,
			};

			// Мокаем результаты запросов
			TaskTemplate.findByPk.mockResolvedValue(existingTask);
			existingTask.update.mockImplementation(() => {
				Object.assign(existingTask, taskData);
				return Promise.resolve(existingTask);
			});

			// Вызываем тестируемый метод
			const result = await taskTemplateService.updateTaskTemplate(
				taskId,
				taskData
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(TaskTemplate.findByPk).toHaveBeenCalledWith(taskId, {
				transaction: mockTransaction,
			});
			expect(existingTask.update).toHaveBeenCalledWith(taskData, {
				transaction: mockTransaction,
			});
			expect(mockTransaction.commit).toHaveBeenCalled();
			expect(mockTransaction.rollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result).toEqual(updatedTask);
		});

		it('should throw ApiError if task template not found', async () => {
			// Mock данных
			const taskId = 'nonexistent';
			const taskData = {
				title: 'Updated Task',
			};

			// Мокаем результаты запросов
			TaskTemplate.findByPk.mockResolvedValue(null);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(
				taskTemplateService.updateTaskTemplate(taskId, taskData)
			).rejects.toThrow(
				'Failed to update task template: Task template not found'
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(TaskTemplate.findByPk).toHaveBeenCalledWith(taskId, {
				transaction: mockTransaction,
			});
			expect(mockTransaction.commit).not.toHaveBeenCalled();
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});

		it('should throw ApiError if database operation fails', async () => {
			// Mock данных
			const taskId = 'task1';
			const taskData = {
				title: 'Updated Task 1',
			};

			const existingTask = {
				id: taskId,
				title: 'Task 1',
				update: jest.fn(),
			};

			// Мокаем ошибку при обновлении задачи
			const error = new Error('Database error');
			existingTask.update.mockRejectedValue(error);
			TaskTemplate.findByPk.mockResolvedValue(existingTask);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(
				taskTemplateService.updateTaskTemplate(taskId, taskData)
			).rejects.toThrow('Failed to update task template: Database error');

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(TaskTemplate.findByPk).toHaveBeenCalled();
			expect(existingTask.update).toHaveBeenCalled();
			expect(mockTransaction.commit).not.toHaveBeenCalled();
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});

	describe('deleteTaskTemplate', () => {
		it('should delete task template successfully', async () => {
			// Mock данных
			const taskId = 'task1';
			const existingTask = {
				id: taskId,
				title: 'Task 1',
				destroy: jest.fn().mockResolvedValue(true),
			};

			// Мокаем результаты запросов
			TaskTemplate.findByPk.mockResolvedValue(existingTask);

			// Вызываем тестируемый метод
			const result = await taskTemplateService.deleteTaskTemplate(taskId);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(TaskTemplate.findByPk).toHaveBeenCalledWith(taskId, {
				transaction: mockTransaction,
			});
			expect(existingTask.destroy).toHaveBeenCalledWith({
				transaction: mockTransaction,
			});
			expect(mockTransaction.commit).toHaveBeenCalled();
			expect(mockTransaction.rollback).not.toHaveBeenCalled();

			// Проверяем результат
			expect(result).toEqual({
				success: true,
				message: `Task template ${taskId} deleted successfully`,
			});
		});

		it('should throw ApiError if task template not found', async () => {
			// Mock данных
			const taskId = 'nonexistent';

			// Мокаем результаты запросов
			TaskTemplate.findByPk.mockResolvedValue(null);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(
				taskTemplateService.deleteTaskTemplate(taskId)
			).rejects.toThrow(
				'Failed to delete task template: Task template not found'
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(TaskTemplate.findByPk).toHaveBeenCalled();
			expect(mockTransaction.commit).not.toHaveBeenCalled();
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});

		it('should throw ApiError if database operation fails', async () => {
			// Mock данных
			const taskId = 'task1';
			const existingTask = {
				id: taskId,
				title: 'Task 1',
				destroy: jest.fn(),
			};

			// Мокаем ошибку при удалении задачи
			const error = new Error('Database error');
			existingTask.destroy.mockRejectedValue(error);
			TaskTemplate.findByPk.mockResolvedValue(existingTask);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(
				taskTemplateService.deleteTaskTemplate(taskId)
			).rejects.toThrow('Failed to delete task template: Database error');

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(TaskTemplate.findByPk).toHaveBeenCalled();
			expect(existingTask.destroy).toHaveBeenCalled();
			expect(mockTransaction.commit).not.toHaveBeenCalled();
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});

	describe('setTaskTemplateStatus', () => {
		it('should activate task template successfully', async () => {
			// Mock данных
			const taskId = 'task1';
			const existingTask = {
				id: taskId,
				title: 'Task 1',
				active: false,
				save: jest.fn().mockResolvedValue(true),
			};

			// Мокаем результаты запросов
			TaskTemplate.findByPk.mockResolvedValue(existingTask);

			// Вызываем тестируемый метод
			const result = await taskTemplateService.setTaskTemplateStatus(
				taskId,
				true
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(TaskTemplate.findByPk).toHaveBeenCalledWith(taskId, {
				transaction: mockTransaction,
			});
			expect(existingTask.save).toHaveBeenCalledWith({
				transaction: mockTransaction,
			});
			expect(mockTransaction.commit).toHaveBeenCalled();
			expect(mockTransaction.rollback).not.toHaveBeenCalled();

			// Проверяем, что статус был изменен
			expect(existingTask.active).toBe(true);

			// Проверяем результат
			expect(result).toEqual(existingTask);
		});

		it('should deactivate task template successfully', async () => {
			// Mock данных
			const taskId = 'task1';
			const existingTask = {
				id: taskId,
				title: 'Task 1',
				active: true,
				save: jest.fn().mockResolvedValue(true),
			};

			// Мокаем результаты запросов
			TaskTemplate.findByPk.mockResolvedValue(existingTask);

			// Вызываем тестируемый метод
			const result = await taskTemplateService.setTaskTemplateStatus(
				taskId,
				false
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(TaskTemplate.findByPk).toHaveBeenCalledWith(taskId, {
				transaction: mockTransaction,
			});
			expect(existingTask.save).toHaveBeenCalledWith({
				transaction: mockTransaction,
			});
			expect(mockTransaction.commit).toHaveBeenCalled();
			expect(mockTransaction.rollback).not.toHaveBeenCalled();

			// Проверяем, что статус был изменен
			expect(existingTask.active).toBe(false);

			// Проверяем результат
			expect(result).toEqual(existingTask);
		});

		it('should throw ApiError if task template not found', async () => {
			// Mock данных
			const taskId = 'nonexistent';

			// Мокаем результаты запросов
			TaskTemplate.findByPk.mockResolvedValue(null);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(
				taskTemplateService.setTaskTemplateStatus(taskId, true)
			).rejects.toThrow(
				'Failed to update task template status: Task template not found'
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(TaskTemplate.findByPk).toHaveBeenCalled();
			expect(mockTransaction.commit).not.toHaveBeenCalled();
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});

		it('should throw ApiError if database operation fails', async () => {
			// Mock данных
			const taskId = 'task1';
			const existingTask = {
				id: taskId,
				title: 'Task 1',
				active: false,
				save: jest.fn(),
			};

			// Мокаем ошибку при сохранении задачи
			const error = new Error('Database error');
			existingTask.save.mockRejectedValue(error);
			TaskTemplate.findByPk.mockResolvedValue(existingTask);

			// Вызываем тестируемый метод и проверяем, что он выбрасывает ошибку
			await expect(
				taskTemplateService.setTaskTemplateStatus(taskId, true)
			).rejects.toThrow(
				'Failed to update task template status: Database error'
			);

			// Проверяем, что были вызваны нужные методы
			expect(sequelize.transaction).toHaveBeenCalled();
			expect(TaskTemplate.findByPk).toHaveBeenCalled();
			expect(existingTask.save).toHaveBeenCalled();
			expect(mockTransaction.commit).not.toHaveBeenCalled();
			expect(mockTransaction.rollback).toHaveBeenCalled();
		});
	});
});
