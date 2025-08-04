const packageStoreService = require('../../service/package-store-service');
const {
	PackageStore,
	UserState,
	PackageTemplate,
} = require('../../models/models');
const ApiError = require('../../exceptions/api-error');
const sequelize = require('../../db');

// Мокаем модели и другие зависимости
jest.mock('../../models/models', () => ({
	PackageStore: {
		findOne: jest.fn(),
		findAll: jest.fn(),
		create: jest.fn(),
		findOrCreate: jest.fn(),
	},
	UserState: {
		findOne: jest.fn(),
	},
	PackageTemplate: {
		findAll: jest.fn(),
	},
}));

jest.mock('../../db', () => ({
	transaction: jest.fn(() => ({
		commit: jest.fn(),
		rollback: jest.fn(),
	})),
}));

describe('PackageStoreService', () => {
	beforeEach(() => {
		// Очищаем моки перед каждым тестом
		jest.clearAllMocks();
	});

	describe('initializePackageStore', () => {
		it('should create default welcome package if no active templates and no existing packages', async () => {
			// Mock данных
			PackageTemplate.findAll.mockResolvedValue([]);
			PackageStore.findOne.mockResolvedValue(null);
			PackageStore.create.mockResolvedValue({
				id: 'welcome_12345_1626345678',
				userId: 12345,
				amount: 100,
				resource: 'stardust',
				price: 0,
				currency: 'tgStars',
				status: 'ACTIVE',
				isUsed: false,
				isLocked: false,
			});

			const userId = 12345;
			const transaction = {};

			// Вызываем тестируемый метод
			await packageStoreService.initializePackageStore(
				userId,
				transaction
			);

			// Проверяем, что были вызваны нужные методы
			expect(PackageTemplate.findAll).toHaveBeenCalledWith({
				where: { status: 'ACTIVE' },
				transaction,
			});
			expect(PackageStore.findOne).toHaveBeenCalledWith({
				where: { userId },
				transaction,
			});
			expect(PackageStore.create).toHaveBeenCalledWith(
				expect.objectContaining({
					userId,
					amount: 100,
					resource: 'stardust',
					price: 0,
					currency: 'tgStars',
					status: 'ACTIVE',
					isUsed: false,
					isLocked: false,
				}),
				{ transaction }
			);
		});

		it('should not create default package if user already has packages and no active templates', async () => {
			// Mock данных
			PackageTemplate.findAll.mockResolvedValue([]);
			PackageStore.findOne.mockResolvedValue({
				id: 'existing_12345_1626345678',
				userId: 12345,
			});

			const userId = 12345;
			const transaction = {};

			// Вызываем тестируемый метод
			await packageStoreService.initializePackageStore(
				userId,
				transaction
			);

			// Проверяем, что были вызваны нужные методы
			expect(PackageTemplate.findAll).toHaveBeenCalledWith({
				where: { status: 'ACTIVE' },
				transaction,
			});
			expect(PackageStore.findOne).toHaveBeenCalledWith({
				where: { userId },
				transaction,
			});
			expect(PackageStore.create).not.toHaveBeenCalled();
		});

		it('should create packages from active templates that user does not have', async () => {
			// Mock активных шаблонов
			const activeTemplates = [
				{
					id: 'template1',
					amount: 100,
					resource: 'stardust',
					price: 0,
					currency: 'tgStars',
					status: 'ACTIVE',
				},
				{
					id: 'template2',
					amount: 50,
					resource: 'darkMatter',
					price: 10,
					currency: 'tonToken',
					status: 'ACTIVE',
				},
			];
			PackageTemplate.findAll.mockResolvedValue(activeTemplates);

			// Mock существующих пакетов пользователя (у пользователя уже есть пакет от template1)
			const existingPackages = [
				{
					id: 'template1_12345_1626345678',
					userId: 12345,
					amount: 100,
					resource: 'stardust',
				},
			];
			PackageStore.findAll.mockResolvedValue(existingPackages);
			PackageStore.create.mockResolvedValue({});

			const userId = 12345;
			const transaction = {};

			// Вызываем тестируемый метод
			await packageStoreService.initializePackageStore(
				userId,
				transaction
			);

			// Проверяем, что были вызваны нужные методы
			expect(PackageTemplate.findAll).toHaveBeenCalledWith({
				where: { status: 'ACTIVE' },
				transaction,
			});
			expect(PackageStore.findAll).toHaveBeenCalledWith({
				where: { userId },
				transaction,
			});

			// Должен быть создан только один новый пакет (для template2)
			expect(PackageStore.create).toHaveBeenCalledTimes(1);
			expect(PackageStore.create).toHaveBeenCalledWith(
				expect.objectContaining({
					userId,
					amount: 50,
					resource: 'darkMatter',
					price: 10,
					currency: 'tonToken',
					status: 'ACTIVE',
					isUsed: false,
					isLocked: false,
				}),
				{ transaction }
			);
		});

		it('should handle errors gracefully', async () => {
			// Mock ошибки
			PackageTemplate.findAll.mockRejectedValue(
				new Error('Database error')
			);

			const userId = 12345;
			const transaction = {};

			// Проверяем, что метод выбрасывает ошибку ApiError
			await expect(
				packageStoreService.initializePackageStore(userId, transaction)
			).rejects.toThrow(ApiError);
		});
	});

	describe('getUserPackages', () => {
		it('should initialize packages for user if they do not exist', async () => {
			// Mock активных шаблонов
			const activeTemplates = [
				{
					id: 'template1',
					slug: 'starter-pack',
					title: 'Starter Pack',
					description: 'Basic starter pack',
					amount: 100,
					resource: 'stardust',
					price: 0,
					currency: 'tgStars',
					status: true,
					icon: 'star',
					sortOrder: 1,
					toJSON: () => ({
						id: 'template1',
						slug: 'starter-pack',
						title: 'Starter Pack',
						description: 'Basic starter pack',
						amount: 100,
						resource: 'stardust',
						price: 0,
						currency: 'tgStars',
						status: true,
						icon: 'star',
						sortOrder: 1,
					}),
				},
			];

			// Mock findOrCreate для создания нового пакета
			const newPackage = {
				id: 'package1',
				userId: 12345,
				packageTemplateId: 'template1',
				amount: 100,
				resource: 'stardust',
				price: 0,
				currency: 'tgStars',
				status: true,
				isUsed: false,
				isLocked: false,
				packagetemplate: activeTemplates[0],
				toJSON: () => ({
					id: 'package1',
					userId: 12345,
					packageTemplateId: 'template1',
					amount: 100,
					resource: 'stardust',
					price: 0,
					currency: 'tgStars',
					status: true,
					isUsed: false,
					isLocked: false,
				}),
			};

			PackageTemplate.findAll.mockResolvedValue(activeTemplates);
			PackageStore.findOrCreate.mockResolvedValue([newPackage, true]); // true = created
			PackageStore.findAll.mockResolvedValue([newPackage]);

			const userId = 12345;

			// Вызываем тестируемый метод
			const result = await packageStoreService.getUserPackages(userId);

			// Проверяем, что были вызваны нужные методы
			expect(PackageTemplate.findAll).toHaveBeenCalledWith({
				where: { status: true },
				transaction: expect.any(Object),
			});
			expect(PackageStore.findOrCreate).toHaveBeenCalledWith({
				where: {
					userId,
					packageTemplateId: 'template1',
				},
				defaults: {
					packageTemplateId: 'template1',
					userId,
					amount: 100,
					resource: 'stardust',
					price: 0,
					currency: 'tgStars',
					status: true,
					isUsed: false,
					isLocked: false,
				},
				transaction: expect.any(Object),
			});

			// Проверяем результат
			expect(result).toHaveLength(1);
			expect(result[0]).toHaveProperty('id', 'package1');
			expect(result[0]).toHaveProperty('package');
			expect(result[0].package).toHaveProperty('slug', 'starter-pack');
		});

		it('should return existing packages without creating new ones', async () => {
			// Mock активных шаблонов
			const activeTemplates = [
				{
					id: 'template1',
					slug: 'starter-pack',
					title: 'Starter Pack',
					description: 'Basic starter pack',
					amount: 100,
					resource: 'stardust',
					price: 0,
					currency: 'tgStars',
					status: true,
					icon: 'star',
					sortOrder: 1,
					toJSON: () => ({
						id: 'template1',
						slug: 'starter-pack',
						title: 'Starter Pack',
						description: 'Basic starter pack',
						amount: 100,
						resource: 'stardust',
						price: 0,
						currency: 'tgStars',
						status: true,
						icon: 'star',
						sortOrder: 1,
					}),
				},
			];

			// Mock существующего пакета
			const existingPackage = {
				id: 'package1',
				userId: 12345,
				packageTemplateId: 'template1',
				amount: 100,
				resource: 'stardust',
				price: 0,
				currency: 'tgStars',
				status: true,
				isUsed: false,
				isLocked: false,
				packagetemplate: activeTemplates[0],
				toJSON: () => ({
					id: 'package1',
					userId: 12345,
					packageTemplateId: 'template1',
					amount: 100,
					resource: 'stardust',
					price: 0,
					currency: 'tgStars',
					status: true,
					isUsed: false,
					isLocked: false,
				}),
			};

			PackageTemplate.findAll.mockResolvedValue(activeTemplates);
			PackageStore.findOrCreate.mockResolvedValue([existingPackage, false]); // false = not created
			PackageStore.findAll.mockResolvedValue([existingPackage]);

			const userId = 12345;

			// Вызываем тестируемый метод
			const result = await packageStoreService.getUserPackages(userId);

			// Проверяем, что findOrCreate был вызван, но пакет не создавался
			expect(PackageStore.findOrCreate).toHaveBeenCalled();
			expect(result).toHaveLength(1);
			expect(result[0]).toHaveProperty('id', 'package1');
		});

		it('should return empty array when no active templates exist', async () => {
			PackageTemplate.findAll.mockResolvedValue([]);

			const userId = 12345;

			// Вызываем тестируемый метод
			const result = await packageStoreService.getUserPackages(userId);

			// Проверяем результат
			expect(result).toEqual([]);
			expect(PackageStore.findOrCreate).not.toHaveBeenCalled();
		});
	});
});
