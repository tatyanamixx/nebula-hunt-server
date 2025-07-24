/**
 * Тесты для сервиса работы с view связок template-ребенок
 */

const templateViewService = require('../../service/template-view-service');
const {
	UserUpgradeWithTemplate,
	UserTaskWithTemplate,
	UserEventWithTemplate,
	UserPackageWithTemplate,
	UserArtifactWithTemplate,
} = require('../../models/template-views');

// Мокаем модели
jest.mock('../../models/template-views');

describe('TemplateViewService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Сбрасываем моки для всех моделей
		UserUpgradeWithTemplate.findAll.mockResolvedValue([]);
		UserUpgradeWithTemplate.findOne.mockResolvedValue(null);
		UserTaskWithTemplate.findAll.mockResolvedValue([]);
		UserTaskWithTemplate.findOne.mockResolvedValue(null);
		UserEventWithTemplate.findAll.mockResolvedValue([]);
		UserEventWithTemplate.findOne.mockResolvedValue(null);
		UserPackageWithTemplate.findAll.mockResolvedValue([]);
		UserPackageWithTemplate.findOne.mockResolvedValue(null);
		UserArtifactWithTemplate.findAll.mockResolvedValue([]);
		UserArtifactWithTemplate.findOne.mockResolvedValue(null);
	});

	describe('getUserUpgradesWithTemplate', () => {
		it('должен возвращать апгрейды пользователя с данными шаблонов', async () => {
			const userId = 123;
			const mockUpgrades = [
				{
					id: 1,
					userId: 123,
					upgradeNodeTemplateId: 1,
					level: 5,
					progress: 75,
					completed: false,
					templateSlug: 'production-boost',
					templateName: 'Production Boost',
					templateMaxLevel: 10,
					templateCategory: 'production',
				},
			];

			UserUpgradeWithTemplate.findAll.mockResolvedValue(mockUpgrades);

			const result =
				await templateViewService.getUserUpgradesWithTemplate(userId);

			expect(UserUpgradeWithTemplate.findAll).toHaveBeenCalledWith({
				where: { userId },
				order: [['createdAt', 'DESC']],
				offset: 0,
			});
			expect(result).toEqual(mockUpgrades);
		});

		it('должен применять фильтры и опции', async () => {
			const userId = 123;
			const options = {
				where: { completed: false },
				order: [['level', 'DESC']],
				limit: 10,
				offset: 5,
			};

			UserUpgradeWithTemplate.findAll.mockResolvedValue([]);

			await templateViewService.getUserUpgradesWithTemplate(
				userId,
				options
			);

			expect(UserUpgradeWithTemplate.findAll).toHaveBeenCalledWith({
				where: { userId, completed: false },
				order: [['level', 'DESC']],
				limit: 10,
				offset: 5,
			});
		});
	});

	describe('getUserUpgradeWithTemplate', () => {
		it('должен возвращать конкретный апгрейд пользователя', async () => {
			const userId = 123;
			const upgradeId = 1;
			const mockUpgrade = {
				id: 1,
				userId: 123,
				upgradeNodeTemplateId: 1,
				level: 5,
				templateSlug: 'production-boost',
				templateName: 'Production Boost',
			};

			UserUpgradeWithTemplate.findOne.mockResolvedValue(mockUpgrade);

			const result = await templateViewService.getUserUpgradeWithTemplate(
				userId,
				upgradeId
			);

			expect(UserUpgradeWithTemplate.findOne).toHaveBeenCalledWith({
				where: { id: upgradeId, userId },
			});
			expect(result).toEqual(mockUpgrade);
		});
	});

	describe('getUserTasksWithTemplate', () => {
		it('должен возвращать задачи пользователя с данными шаблонов', async () => {
			const userId = 123;
			const mockTasks = [
				{
					id: 1,
					userId: 123,
					taskTemplateId: 1,
					progress: 50,
					completed: false,
					templateSlug: 'daily-login',
					templateTitle: { en: 'Daily Login', ru: 'Ежедневный вход' },
					templateIcon: '📅',
				},
			];

			UserTaskWithTemplate.findAll.mockResolvedValue(mockTasks);

			const result = await templateViewService.getUserTasksWithTemplate(
				userId
			);

			expect(UserTaskWithTemplate.findAll).toHaveBeenCalledWith({
				where: { userId },
				order: [['createdAt', 'DESC']],
				offset: 0,
			});
			expect(result).toEqual(mockTasks);
		});
	});

	describe('getUserEventsWithTemplate', () => {
		it('должен возвращать события пользователя с данными шаблонов', async () => {
			const userId = 123;
			const mockEvents = [
				{
					id: 1,
					userId: 123,
					eventTemplateId: 1,
					status: 'ACTIVE',
					templateSlug: 'bonus-event',
					templateName: 'Bonus Event',
					templateType: 'PERIODIC',
				},
			];

			UserEventWithTemplate.findAll.mockResolvedValue(mockEvents);

			const result = await templateViewService.getUserEventsWithTemplate(
				userId
			);

			expect(UserEventWithTemplate.findAll).toHaveBeenCalledWith({
				where: { userId },
				order: [['triggeredAt', 'DESC']],
				offset: 0,
			});
			expect(result).toEqual(mockEvents);
		});
	});

	describe('getUserPackagesWithTemplate', () => {
		it('должен возвращать пакеты пользователя с данными шаблонов', async () => {
			const userId = 123;
			const mockPackages = [
				{
					id: 1,
					userId: 123,
					packageTemplateId: 1,
					amount: 100,
					resource: 'stardust',
					isUsed: false,
					templateSlug: 'starter-pack',
					templateName: 'Starter Pack',
					templateAmount: 100,
				},
			];

			UserPackageWithTemplate.findAll.mockResolvedValue(mockPackages);

			const result =
				await templateViewService.getUserPackagesWithTemplate(userId);

			expect(UserPackageWithTemplate.findAll).toHaveBeenCalledWith({
				where: { userId },
				order: [['createdAt', 'DESC']],
				offset: 0,
			});
			expect(result).toEqual(mockPackages);
		});
	});

	describe('getUserUpgradesStats', () => {
		it('должен возвращать статистику по апгрейдам', async () => {
			const userId = 123;
			const mockUpgrades = [
				{
					completed: true,
					templateCategory: 'production',
					templateSlug: 'boost-1',
					templateMaxLevel: 10,
					level: 5,
				},
				{
					completed: false,
					templateCategory: 'production',
					templateSlug: 'boost-2',
					templateMaxLevel: 5,
					level: 3,
				},
				{
					completed: false,
					templateCategory: 'economy',
					templateSlug: 'discount-1',
					templateMaxLevel: 3,
					level: 1,
				},
			];

			UserUpgradeWithTemplate.findAll.mockResolvedValue(mockUpgrades);

			const result = await templateViewService.getUserUpgradesStats(
				userId
			);

			expect(result).toEqual({
				total: 3,
				completed: 1,
				active: 2,
				byCategory: {
					production: { total: 2, completed: 1, active: 1 },
					economy: { total: 1, completed: 0, active: 1 },
				},
				byTemplate: {
					'boost-1': {
						total: 1,
						completed: 1,
						active: 0,
						maxLevel: 10,
						currentLevel: 5,
					},
					'boost-2': {
						total: 1,
						completed: 0,
						active: 1,
						maxLevel: 5,
						currentLevel: 3,
					},
					'discount-1': {
						total: 1,
						completed: 0,
						active: 1,
						maxLevel: 3,
						currentLevel: 1,
					},
				},
			});
		});
	});

	describe('getUserTasksStats', () => {
		it('должен возвращать статистику по задачам', async () => {
			const userId = 123;
			const mockTasks = [
				{ completed: true, active: true, templateSlug: 'task-1' },
				{ completed: false, active: true, templateSlug: 'task-2' },
				{ completed: false, active: false, templateSlug: 'task-3' },
			];

			UserTaskWithTemplate.findAll.mockResolvedValue(mockTasks);

			const result = await templateViewService.getUserTasksStats(userId);

			expect(result).toEqual({
				total: 3,
				completed: 1,
				active: 1,
				inactive: 1,
				byTemplate: {
					'task-1': {
						total: 1,
						completed: 1,
						active: 0,
						inactive: 0,
					},
					'task-2': {
						total: 1,
						completed: 0,
						active: 1,
						inactive: 0,
					},
					'task-3': {
						total: 1,
						completed: 0,
						active: 0,
						inactive: 1,
					},
				},
			});
		});
	});

	describe('getUserEventsStats', () => {
		it('должен возвращать статистику по событиям', async () => {
			const userId = 123;
			const mockEvents = [
				{
					status: 'ACTIVE',
					templateType: 'PERIODIC',
					templateSlug: 'event-1',
				},
				{
					status: 'COMPLETED',
					templateType: 'PERIODIC',
					templateSlug: 'event-2',
				},
				{
					status: 'EXPIRED',
					templateType: 'RANDOM',
					templateSlug: 'event-3',
				},
			];

			UserEventWithTemplate.findAll.mockResolvedValue(mockEvents);

			const result = await templateViewService.getUserEventsStats(userId);

			expect(result).toEqual({
				total: 3,
				active: 1,
				completed: 1,
				expired: 1,
				cancelled: 0,
				byType: {
					PERIODIC: {
						total: 2,
						active: 1,
						completed: 1,
						expired: 0,
						cancelled: 0,
					},
					RANDOM: {
						total: 1,
						active: 0,
						completed: 0,
						expired: 1,
						cancelled: 0,
					},
				},
				byTemplate: {
					'event-1': {
						total: 1,
						active: 1,
						completed: 0,
						expired: 0,
						cancelled: 0,
					},
					'event-2': {
						total: 1,
						active: 0,
						completed: 1,
						expired: 0,
						cancelled: 0,
					},
					'event-3': {
						total: 1,
						active: 0,
						completed: 0,
						expired: 1,
						cancelled: 0,
					},
				},
			});
		});
	});

	describe('getUserPackagesStats', () => {
		it('должен возвращать статистику по пакетам', async () => {
			const userId = 123;
			const mockPackages = [
				{
					isUsed: true,
					isLocked: false,
					resource: 'stardust',
					amount: 100,
					templateSlug: 'pack-1',
				},
				{
					isUsed: false,
					isLocked: true,
					resource: 'stardust',
					amount: 200,
					templateSlug: 'pack-2',
				},
				{
					isUsed: false,
					isLocked: false,
					resource: 'darkMatter',
					amount: 50,
					templateSlug: 'pack-3',
				},
			];

			UserPackageWithTemplate.findAll.mockResolvedValue(mockPackages);

			const result = await templateViewService.getUserPackagesStats(
				userId
			);

			expect(result).toEqual({
				total: 3,
				used: 1,
				unused: 2,
				locked: 1,
				unlocked: 2,
				byResource: {
					stardust: {
						total: 2,
						used: 1,
						unused: 1,
						totalAmount: 300,
					},
					darkMatter: {
						total: 1,
						used: 0,
						unused: 1,
						totalAmount: 50,
					},
				},
				byTemplate: {
					'pack-1': {
						total: 1,
						used: 1,
						unused: 0,
						totalAmount: 100,
					},
					'pack-2': {
						total: 1,
						used: 0,
						unused: 1,
						totalAmount: 200,
					},
					'pack-3': { total: 1, used: 0, unused: 1, totalAmount: 50 },
				},
			});
		});
	});

	describe('getUserFullStats', () => {
		it('должен возвращать полную статистику пользователя', async () => {
			const userId = 123;
			const mockUpgradesStats = { total: 5, completed: 2 };
			const mockTasksStats = { total: 10, completed: 3 };
			const mockEventsStats = { total: 3, active: 1 };
			const mockPackagesStats = { total: 8, used: 4 };
			const mockArtifactsStats = { total: 15, tradable: 12 };

			// Мокаем методы статистики
			jest.spyOn(
				templateViewService,
				'getUserUpgradesStats'
			).mockResolvedValue(mockUpgradesStats);
			jest.spyOn(
				templateViewService,
				'getUserTasksStats'
			).mockResolvedValue(mockTasksStats);
			jest.spyOn(
				templateViewService,
				'getUserEventsStats'
			).mockResolvedValue(mockEventsStats);
			jest.spyOn(
				templateViewService,
				'getUserPackagesStats'
			).mockResolvedValue(mockPackagesStats);
			jest.spyOn(
				templateViewService,
				'getUserArtifactsStats'
			).mockResolvedValue(mockArtifactsStats);

			const result = await templateViewService.getUserFullStats(userId);

			expect(result).toEqual({
				upgrades: mockUpgradesStats,
				tasks: mockTasksStats,
				events: mockEventsStats,
				packages: mockPackagesStats,
				artifacts: mockArtifactsStats,
				summary: {
					totalUpgrades: 5,
					totalTasks: 10,
					totalEvents: 3,
					totalPackages: 8,
					totalArtifacts: 15,
					completedUpgrades: 2,
					completedTasks: 3,
					completedEvents: 0, // Не определено в mockEventsStats
					usedPackages: 4,
					tradableArtifacts: 12,
				},
			});
		});
	});

	describe('getUserArtifactsWithTemplate', () => {
		it('должен возвращать артифакты пользователя с данными шаблонов', async () => {
			const userId = 123;
			const mockArtifacts = [
				{
					id: 1,
					userId: 123,
					artifactTemplateId: 1,
					seed: 'artifact_001',
					name: 'Stardust Crystal',
					tradable: true,
					templateSlug: 'stardust-crystal',
					templateName: 'Stardust Crystal',
					templateRarity: 'RARE',
					templateEffects: { stardust: 0.2 },
				},
			];

			UserArtifactWithTemplate.findAll.mockResolvedValue(mockArtifacts);

			const result =
				await templateViewService.getUserArtifactsWithTemplate(userId);

			expect(UserArtifactWithTemplate.findAll).toHaveBeenCalledWith({
				where: { userId },
				order: [['createdAt', 'DESC']],
				offset: 0,
			});
			expect(result).toEqual(mockArtifacts);
		});

		it('должен применять фильтры и опции', async () => {
			const userId = 123;
			const options = {
				where: { tradable: true, templateRarity: 'RARE' },
				order: [['createdAt', 'DESC']],
				limit: 10,
				offset: 5,
			};

			UserArtifactWithTemplate.findAll.mockResolvedValue([]);

			await templateViewService.getUserArtifactsWithTemplate(
				userId,
				options
			);

			expect(UserArtifactWithTemplate.findAll).toHaveBeenCalledWith({
				where: { userId, tradable: true, templateRarity: 'RARE' },
				order: [['createdAt', 'DESC']],
				limit: 10,
				offset: 5,
			});
		});
	});

	describe('getUserArtifactWithTemplate', () => {
		it('должен возвращать конкретный артифакт пользователя', async () => {
			const userId = 123;
			const artifactId = 1;
			const mockArtifact = {
				id: 1,
				userId: 123,
				artifactTemplateId: 1,
				seed: 'artifact_001',
				name: 'Stardust Crystal',
				tradable: true,
				templateSlug: 'stardust-crystal',
				templateRarity: 'RARE',
			};

			UserArtifactWithTemplate.findOne.mockResolvedValue(mockArtifact);

			const result =
				await templateViewService.getUserArtifactWithTemplate(
					userId,
					artifactId
				);

			expect(UserArtifactWithTemplate.findOne).toHaveBeenCalledWith({
				where: { id: artifactId, userId },
			});
			expect(result).toEqual(mockArtifact);
		});
	});

	describe('getUserArtifactsStats', () => {
		it('должен возвращать статистику по артифактам', async () => {
			const userId = 123;
			const mockArtifacts = [
				{
					id: 1,
					tradable: true,
					templateRarity: 'COMMON',
					templateSlug: 'crystal-1',
				},
				{
					id: 2,
					tradable: false,
					templateRarity: 'RARE',
					templateSlug: 'crystal-2',
				},
				{
					id: 3,
					tradable: true,
					templateRarity: 'RARE',
					templateSlug: 'crystal-2',
				},
			];

			UserArtifactWithTemplate.findAll.mockResolvedValue(mockArtifacts);

			const result = await templateViewService.getUserArtifactsStats(
				userId
			);

			expect(result).toEqual({
				total: 3,
				tradable: 2,
				nonTradable: 1,
				byRarity: {
					COMMON: {
						total: 1,
						tradable: 1,
						nonTradable: 0,
					},
					RARE: {
						total: 2,
						tradable: 1,
						nonTradable: 1,
					},
				},
				byTemplate: {
					'crystal-1': {
						total: 1,
						tradable: 1,
						nonTradable: 0,
						rarity: 'COMMON',
					},
					'crystal-2': {
						total: 2,
						tradable: 1,
						nonTradable: 1,
						rarity: 'RARE',
					},
				},
			});
		});
	});
});
