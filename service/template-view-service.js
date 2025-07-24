/**
 * Сервис для работы с view связок template-ребенок
 *
 * Предоставляет методы для получения данных, объединяющих таблицы шаблонов
 * с таблицами пользовательских данных
 */

const {
	UserUpgradeWithTemplate,
	UserTaskWithTemplate,
	UserEventWithTemplate,
	UserPackageWithTemplate,
	UserArtifactWithTemplate,
} = require('../models/template-views');
const { Op } = require('sequelize');

class TemplateViewService {
	/**
	 * Получить все апгрейды пользователя с данными шаблонов
	 * @param {number} userId - ID пользователя
	 * @param {Object} options - Дополнительные опции запроса
	 * @returns {Promise<Array>} Массив апгрейдов с данными шаблонов
	 */
	async getUserUpgradesWithTemplate(userId, options = {}) {
		const {
			where = {},
			order = [['createdAt', 'DESC']],
			limit,
			offset = 0,
		} = options;

		const queryOptions = {
			where: {
				userId,
				...where,
			},
			order,
			offset,
		};

		if (limit) {
			queryOptions.limit = limit;
		}

		return await UserUpgradeWithTemplate.findAll(queryOptions);
	}

	/**
	 * Получить конкретный апгрейд пользователя с данными шаблона
	 * @param {number} userId - ID пользователя
	 * @param {number} upgradeId - ID апгрейда
	 * @returns {Promise<Object|null>} Апгрейд с данными шаблона или null
	 */
	async getUserUpgradeWithTemplate(userId, upgradeId) {
		return await UserUpgradeWithTemplate.findOne({
			where: {
				id: upgradeId,
				userId,
			},
		});
	}

	/**
	 * Получить все задачи пользователя с данными шаблонов
	 * @param {number} userId - ID пользователя
	 * @param {Object} options - Дополнительные опции запроса
	 * @returns {Promise<Array>} Массив задач с данными шаблонов
	 */
	async getUserTasksWithTemplate(userId, options = {}) {
		const {
			where = {},
			order = [['createdAt', 'DESC']],
			limit,
			offset = 0,
		} = options;

		const queryOptions = {
			where: {
				userId,
				...where,
			},
			order,
			offset,
		};

		if (limit) {
			queryOptions.limit = limit;
		}

		return await UserTaskWithTemplate.findAll(queryOptions);
	}

	/**
	 * Получить конкретную задачу пользователя с данными шаблона
	 * @param {number} userId - ID пользователя
	 * @param {number} taskId - ID задачи
	 * @returns {Promise<Object|null>} Задача с данными шаблона или null
	 */
	async getUserTaskWithTemplate(userId, taskId) {
		return await UserTaskWithTemplate.findOne({
			where: {
				id: taskId,
				userId,
			},
		});
	}

	/**
	 * Получить все события пользователя с данными шаблонов
	 * @param {number} userId - ID пользователя
	 * @param {Object} options - Дополнительные опции запроса
	 * @returns {Promise<Array>} Массив событий с данными шаблонов
	 */
	async getUserEventsWithTemplate(userId, options = {}) {
		const {
			where = {},
			order = [['triggeredAt', 'DESC']],
			limit,
			offset = 0,
		} = options;

		const queryOptions = {
			where: {
				userId,
				...where,
			},
			order,
			offset,
		};

		if (limit) {
			queryOptions.limit = limit;
		}

		return await UserEventWithTemplate.findAll(queryOptions);
	}

	/**
	 * Получить конкретное событие пользователя с данными шаблона
	 * @param {number} userId - ID пользователя
	 * @param {number} eventId - ID события
	 * @returns {Promise<Object|null>} Событие с данными шаблона или null
	 */
	async getUserEventWithTemplate(userId, eventId) {
		return await UserEventWithTemplate.findOne({
			where: {
				id: eventId,
				userId,
			},
		});
	}

	/**
	 * Получить все пакеты пользователя с данными шаблонов
	 * @param {number} userId - ID пользователя
	 * @param {Object} options - Дополнительные опции запроса
	 * @returns {Promise<Array>} Массив пакетов с данными шаблонов
	 */
	async getUserPackagesWithTemplate(userId, options = {}) {
		const {
			where = {},
			order = [['createdAt', 'DESC']],
			limit,
			offset = 0,
		} = options;

		const queryOptions = {
			where: {
				userId,
				...where,
			},
			order,
			offset,
		};

		if (limit) {
			queryOptions.limit = limit;
		}

		return await UserPackageWithTemplate.findAll(queryOptions);
	}

	/**
	 * Получить конкретный пакет пользователя с данными шаблона
	 * @param {number} userId - ID пользователя
	 * @param {number} packageId - ID пакета
	 * @returns {Promise<Object|null>} Пакет с данными шаблона или null
	 */
	async getUserPackageWithTemplate(userId, packageId) {
		return await UserPackageWithTemplate.findOne({
			where: {
				id: packageId,
				userId,
			},
		});
	}

	/**
	 * Получить все артифакты пользователя с данными шаблонов
	 * @param {number} userId - ID пользователя
	 * @param {Object} options - Дополнительные опции запроса
	 * @returns {Promise<Array>} Массив артифактов с данными шаблонов
	 */
	async getUserArtifactsWithTemplate(userId, options = {}) {
		const {
			where = {},
			order = [['createdAt', 'DESC']],
			limit,
			offset = 0,
		} = options;

		const queryOptions = {
			where: {
				userId,
				...where,
			},
			order,
			offset,
		};

		if (limit) {
			queryOptions.limit = limit;
		}

		return await UserArtifactWithTemplate.findAll(queryOptions);
	}

	/**
	 * Получить конкретный артифакт пользователя с данными шаблона
	 * @param {number} userId - ID пользователя
	 * @param {number} artifactId - ID артифакта
	 * @returns {Promise<Object|null>} Артифакт с данными шаблона или null
	 */
	async getUserArtifactWithTemplate(userId, artifactId) {
		return await UserArtifactWithTemplate.findOne({
			where: {
				id: artifactId,
				userId,
			},
		});
	}

	/**
	 * Получить статистику по апгрейдам пользователя
	 * @param {number} userId - ID пользователя
	 * @returns {Promise<Object>} Статистика по апгрейдам
	 */
	async getUserUpgradesStats(userId) {
		const upgrades = await UserUpgradeWithTemplate.findAll({
			where: { userId },
		});

		const stats = {
			total: upgrades.length,
			completed: upgrades.filter((u) => u.completed).length,
			active: upgrades.filter((u) => !u.completed).length,
			byCategory: {},
			byTemplate: {},
		};

		upgrades.forEach((upgrade) => {
			// Статистика по категориям
			const category = upgrade.templateCategory || 'unknown';
			if (!stats.byCategory[category]) {
				stats.byCategory[category] = {
					total: 0,
					completed: 0,
					active: 0,
				};
			}
			stats.byCategory[category].total++;
			if (upgrade.completed) {
				stats.byCategory[category].completed++;
			} else {
				stats.byCategory[category].active++;
			}

			// Статистика по шаблонам
			const templateSlug = upgrade.templateSlug || 'unknown';
			if (!stats.byTemplate[templateSlug]) {
				stats.byTemplate[templateSlug] = {
					total: 0,
					completed: 0,
					active: 0,
					maxLevel: upgrade.templateMaxLevel || 0,
					currentLevel: upgrade.level || 0,
				};
			}
			stats.byTemplate[templateSlug].total++;
			if (upgrade.completed) {
				stats.byTemplate[templateSlug].completed++;
			} else {
				stats.byTemplate[templateSlug].active++;
			}
		});

		return stats;
	}

	/**
	 * Получить статистику по задачам пользователя
	 * @param {number} userId - ID пользователя
	 * @returns {Promise<Object>} Статистика по задачам
	 */
	async getUserTasksStats(userId) {
		const tasks = await UserTaskWithTemplate.findAll({
			where: { userId },
		});

		const stats = {
			total: tasks.length,
			completed: tasks.filter((t) => t.completed).length,
			active: tasks.filter((t) => !t.completed && t.active).length,
			inactive: tasks.filter((t) => !t.active).length,
			byTemplate: {},
		};

		tasks.forEach((task) => {
			const templateSlug = task.templateSlug || 'unknown';
			if (!stats.byTemplate[templateSlug]) {
				stats.byTemplate[templateSlug] = {
					total: 0,
					completed: 0,
					active: 0,
					inactive: 0,
				};
			}
			stats.byTemplate[templateSlug].total++;
			if (task.completed) {
				stats.byTemplate[templateSlug].completed++;
			} else if (task.active) {
				stats.byTemplate[templateSlug].active++;
			} else {
				stats.byTemplate[templateSlug].inactive++;
			}
		});

		return stats;
	}

	/**
	 * Получить статистику по событиям пользователя
	 * @param {number} userId - ID пользователя
	 * @returns {Promise<Object>} Статистика по событиям
	 */
	async getUserEventsStats(userId) {
		const events = await UserEventWithTemplate.findAll({
			where: { userId },
		});

		const stats = {
			total: events.length,
			active: events.filter((e) => e.status === 'ACTIVE').length,
			completed: events.filter((e) => e.status === 'COMPLETED').length,
			expired: events.filter((e) => e.status === 'EXPIRED').length,
			cancelled: events.filter((e) => e.status === 'CANCELLED').length,
			byType: {},
			byTemplate: {},
		};

		events.forEach((event) => {
			// Статистика по типам событий
			const eventType = event.templateType || 'unknown';
			if (!stats.byType[eventType]) {
				stats.byType[eventType] = {
					total: 0,
					active: 0,
					completed: 0,
					expired: 0,
					cancelled: 0,
				};
			}
			stats.byType[eventType].total++;
			stats.byType[eventType][event.status.toLowerCase()]++;

			// Статистика по шаблонам
			const templateSlug = event.templateSlug || 'unknown';
			if (!stats.byTemplate[templateSlug]) {
				stats.byTemplate[templateSlug] = {
					total: 0,
					active: 0,
					completed: 0,
					expired: 0,
					cancelled: 0,
				};
			}
			stats.byTemplate[templateSlug].total++;
			stats.byTemplate[templateSlug][event.status.toLowerCase()]++;
		});

		return stats;
	}

	/**
	 * Получить статистику по пакетам пользователя
	 * @param {number} userId - ID пользователя
	 * @returns {Promise<Object>} Статистика по пакетам
	 */
	async getUserPackagesStats(userId) {
		const packages = await UserPackageWithTemplate.findAll({
			where: { userId },
		});

		const stats = {
			total: packages.length,
			used: packages.filter((p) => p.isUsed).length,
			unused: packages.filter((p) => !p.isUsed).length,
			locked: packages.filter((p) => p.isLocked).length,
			unlocked: packages.filter((p) => !p.isLocked).length,
			byResource: {},
			byTemplate: {},
		};

		packages.forEach((pkg) => {
			// Статистика по ресурсам
			const resource = pkg.resource || 'unknown';
			if (!stats.byResource[resource]) {
				stats.byResource[resource] = {
					total: 0,
					used: 0,
					unused: 0,
					totalAmount: 0,
				};
			}
			stats.byResource[resource].total++;
			stats.byResource[resource].totalAmount += pkg.amount || 0;
			if (pkg.isUsed) {
				stats.byResource[resource].used++;
			} else {
				stats.byResource[resource].unused++;
			}

			// Статистика по шаблонам
			const templateSlug = artifact.templateSlug || 'unknown';
			if (!stats.byTemplate[templateSlug]) {
				stats.byTemplate[templateSlug] = {
					total: 0,
					used: 0,
					unused: 0,
					totalAmount: 0,
				};
			}
			stats.byTemplate[templateSlug].total++;
			stats.byTemplate[templateSlug].totalAmount += pkg.amount || 0;
			if (pkg.isUsed) {
				stats.byTemplate[templateSlug].used++;
			} else {
				stats.byTemplate[templateSlug].unused++;
			}
		});

		return stats;
	}

	/**
	 * Получить статистику по артифактам пользователя
	 * @param {number} userId - ID пользователя
	 * @returns {Promise<Object>} Статистика по артифактам
	 */
	async getUserArtifactsStats(userId) {
		const artifacts = await UserArtifactWithTemplate.findAll({
			where: { userId },
		});

		const stats = {
			total: artifacts.length,
			tradable: artifacts.filter((a) => a.tradable).length,
			nonTradable: artifacts.filter((a) => !a.tradable).length,
			byRarity: {},
			byTemplate: {},
		};

		artifacts.forEach((artifact) => {
			// Статистика по редкости
			const rarity = artifact.templateRarity || 'unknown';
			if (!stats.byRarity[rarity]) {
				stats.byRarity[rarity] = {
					total: 0,
					tradable: 0,
					nonTradable: 0,
				};
			}
			stats.byRarity[rarity].total++;
			if (artifact.tradable) {
				stats.byRarity[rarity].tradable++;
			} else {
				stats.byRarity[rarity].nonTradable++;
			}

			// Статистика по шаблонам
			const templateSlug = pkg.templateSlug || 'unknown';
			if (!stats.byTemplate[templateSlug]) {
				stats.byTemplate[templateSlug] = {
					total: 0,
					tradable: 0,
					nonTradable: 0,
					rarity: artifact.templateRarity || 'unknown',
				};
			}
			stats.byTemplate[templateSlug].total++;
			if (artifact.tradable) {
				stats.byTemplate[templateSlug].tradable++;
			} else {
				stats.byTemplate[templateSlug].nonTradable++;
			}
		});

		return stats;
	}

	/**
	 * Получить полную статистику пользователя по всем типам данных
	 * @param {number} userId - ID пользователя
	 * @returns {Promise<Object>} Полная статистика пользователя
	 */
	async getUserFullStats(userId) {
		const [
			upgradesStats,
			tasksStats,
			eventsStats,
			packagesStats,
			artifactsStats,
		] = await Promise.all([
			this.getUserUpgradesStats(userId),
			this.getUserTasksStats(userId),
			this.getUserEventsStats(userId),
			this.getUserPackagesStats(userId),
			this.getUserArtifactsStats(userId),
		]);

		return {
			upgrades: upgradesStats,
			tasks: tasksStats,
			events: eventsStats,
			packages: packagesStats,
			artifacts: artifactsStats,
			summary: {
				totalUpgrades: upgradesStats.total,
				totalTasks: tasksStats.total,
				totalEvents: eventsStats.total,
				totalPackages: packagesStats.total,
				totalArtifacts: artifactsStats.total,
				completedUpgrades: upgradesStats.completed,
				completedTasks: tasksStats.completed,
				completedEvents: eventsStats.completed,
				usedPackages: packagesStats.used,
				tradableArtifacts: artifactsStats.tradable,
			},
		};
	}
}

module.exports = new TemplateViewService();
