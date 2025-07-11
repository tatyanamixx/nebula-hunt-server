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
});
