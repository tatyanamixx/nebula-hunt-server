const { UserState } = require('../models/models');
const ApiError = require('../exceptions/api-error');

class StateHistoryService {
	/**
	 * Добавляет запись в историю состояния пользователя
	 * @param {number} userId - ID пользователя
	 * @param {string} type - Тип изменения (state_change, task_completed, upgrade_purchased, event_triggered, login, milestone)
	 * @param {string} category - Категория (production, economy, progress, achievement, system)
	 * @param {string} description - Описание изменения
	 * @param {Object} changes - Объект с изменениями
	 * @param {Object} metadata - Дополнительные метаданные
	 * @param {Object} transaction - Транзакция Sequelize
	 */
	async addHistoryEntry(
		userId,
		type,
		category,
		description,
		changes = {},
		metadata = {},
		transaction = null
	) {
		try {
			const userState = await UserState.findOne({
				where: { userId },
				transaction,
			});

			if (!userState) {
				throw ApiError.BadRequest('User state not found');
			}

			// Инициализируем историю, если её нет
			if (!userState.stateHistory) {
				userState.stateHistory = {
					entries: [],
					lastUpdate: null,
					version: '1.0',
				};
			}

			// Создаем новую запись
			const entry = {
				timestamp: new Date().toISOString(),
				type,
				category,
				description,
				changes,
				metadata: {
					source: metadata.source || 'system',
					trigger: metadata.trigger || 'automatic',
					relatedId: metadata.relatedId || null,
					...metadata,
				},
			};

			// Добавляем запись в начало массива (новые записи сверху)
			userState.stateHistory.entries.unshift(entry);

			// Ограничиваем количество записей (храним последние 1000)
			if (userState.stateHistory.entries.length > 1000) {
				userState.stateHistory.entries =
					userState.stateHistory.entries.slice(0, 1000);
			}

			// Обновляем время последнего обновления
			userState.stateHistory.lastUpdate = new Date().toISOString();

			await userState.save({ transaction });

			return entry;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to add history entry: ${err.message}`
			);
		}
	}

	/**
	 * Получает историю состояния пользователя с фильтрацией
	 * @param {number} userId - ID пользователя
	 * @param {Object} filters - Фильтры для истории
	 * @param {number} limit - Лимит записей
	 * @param {number} offset - Смещение
	 */
	async getHistory(userId, filters = {}, limit = 50, offset = 0) {
		try {
			const userState = await UserState.findOne({
				where: { userId },
			});

			if (!userState || !userState.stateHistory) {
				return {
					entries: [],
					total: 0,
					limit,
					offset,
				};
			}

			let entries = userState.stateHistory.entries;

			// Применяем фильтры
			if (filters.type) {
				entries = entries.filter(
					(entry) => entry.type === filters.type
				);
			}

			if (filters.category) {
				entries = entries.filter(
					(entry) => entry.category === filters.category
				);
			}

			if (filters.startDate) {
				entries = entries.filter(
					(entry) =>
						new Date(entry.timestamp) >= new Date(filters.startDate)
				);
			}

			if (filters.endDate) {
				entries = entries.filter(
					(entry) =>
						new Date(entry.timestamp) <= new Date(filters.endDate)
				);
			}

			if (filters.search) {
				const searchTerm = filters.search.toLowerCase();
				entries = entries.filter(
					(entry) =>
						entry.description.toLowerCase().includes(searchTerm) ||
						entry.type.toLowerCase().includes(searchTerm) ||
						entry.category.toLowerCase().includes(searchTerm)
				);
			}

			const total = entries.length;
			const paginatedEntries = entries.slice(offset, offset + limit);

			return {
				entries: paginatedEntries,
				total,
				limit,
				offset,
				hasMore: offset + limit < total,
			};
		} catch (err) {
			throw ApiError.Internal(`Failed to get history: ${err.message}`);
		}
	}

	/**
	 * Получает статистику по истории
	 * @param {number} userId - ID пользователя
	 * @param {string} period - Период (day, week, month, year, all)
	 */
	async getHistoryStats(userId, period = 'all') {
		try {
			const userState = await UserState.findOne({
				where: { userId },
			});

			if (!userState || !userState.stateHistory) {
				return {
					totalEntries: 0,
					byType: {},
					byCategory: {},
					recentActivity: [],
				};
			}

			let entries = userState.stateHistory.entries;

			// Фильтруем по периоду
			if (period !== 'all') {
				const now = new Date();
				let startDate;

				switch (period) {
					case 'day':
						startDate = new Date(
							now.getTime() - 24 * 60 * 60 * 1000
						);
						break;
					case 'week':
						startDate = new Date(
							now.getTime() - 7 * 24 * 60 * 60 * 1000
						);
						break;
					case 'month':
						startDate = new Date(
							now.getTime() - 30 * 24 * 60 * 60 * 1000
						);
						break;
					case 'year':
						startDate = new Date(
							now.getTime() - 365 * 24 * 60 * 60 * 1000
						);
						break;
					default:
						startDate = new Date(0);
				}

				entries = entries.filter(
					(entry) => new Date(entry.timestamp) >= startDate
				);
			}

			// Группируем по типу
			const byType = {};
			entries.forEach((entry) => {
				byType[entry.type] = (byType[entry.type] || 0) + 1;
			});

			// Группируем по категории
			const byCategory = {};
			entries.forEach((entry) => {
				byCategory[entry.category] =
					(byCategory[entry.category] || 0) + 1;
			});

			// Последняя активность (последние 10 записей)
			const recentActivity = entries.slice(0, 10);

			return {
				totalEntries: entries.length,
				byType,
				byCategory,
				recentActivity,
				period,
			};
		} catch (err) {
			throw ApiError.Internal(
				`Failed to get history stats: ${err.message}`
			);
		}
	}

	/**
	 * Очищает старые записи истории
	 * @param {number} userId - ID пользователя
	 * @param {number} daysToKeep - Количество дней для хранения
	 */
	async cleanupHistory(userId, daysToKeep = 90) {
		try {
			const userState = await UserState.findOne({
				where: { userId },
			});

			if (!userState || !userState.stateHistory) {
				return { removedEntries: 0 };
			}

			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

			const originalCount = userState.stateHistory.entries.length;
			userState.stateHistory.entries =
				userState.stateHistory.entries.filter(
					(entry) => new Date(entry.timestamp) >= cutoffDate
				);

			await userState.save();

			return {
				removedEntries:
					originalCount - userState.stateHistory.entries.length,
				remainingEntries: userState.stateHistory.entries.length,
			};
		} catch (err) {
			throw ApiError.Internal(
				`Failed to cleanup history: ${err.message}`
			);
		}
	}

	/**
	 * Создает запись о достижении
	 * @param {number} userId - ID пользователя
	 * @param {string} achievementName - Название достижения
	 * @param {Object} achievementData - Данные достижения
	 */
	async logAchievement(userId, achievementName, achievementData = {}) {
		return this.addHistoryEntry(
			userId,
			'milestone',
			'achievement',
			`Достижение: ${achievementName}`,
			achievementData,
			{
				source: 'achievement',
				trigger: 'condition',
				relatedId: achievementName,
			}
		);
	}

	/**
	 * Создает запись о изменении состояния
	 * @param {number} userId - ID пользователя
	 * @param {string} field - Поле, которое изменилось
	 * @param {any} oldValue - Старое значение
	 * @param {any} newValue - Новое значение
	 * @param {string} reason - Причина изменения
	 */
	async logStateChange(userId, field, oldValue, newValue, reason = '') {
		return this.addHistoryEntry(
			userId,
			'state_change',
			'production',
			`Изменение ${field}: ${oldValue} → ${newValue}${
				reason ? ` (${reason})` : ''
			}`,
			{
				field,
				oldValue,
				newValue,
			},
			{
				source: 'system',
				trigger: 'state_update',
				relatedId: field,
			}
		);
	}
}

module.exports = new StateHistoryService();
