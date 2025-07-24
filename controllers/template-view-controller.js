/**
 * Контроллер для работы с view связок template-ребенок
 *
 * Предоставляет API endpoints для получения данных, объединяющих таблицы шаблонов
 * с таблицами пользовательских данных
 */

const templateViewService = require('../service/template-view-service');
const { ApiError } = require('../exceptions/api-error');

class TemplateViewController {
	/**
	 * Получить все апгрейды пользователя с данными шаблонов
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async getUserUpgradesWithTemplate(req, res) {
		try {
			const userId = req.user.id;
			const {
				limit,
				offset = 0,
				completed,
				category,
				templateSlug,
				order = 'createdAt:DESC',
			} = req.query;

			// Формируем условия фильтрации
			const where = {};
			if (completed !== undefined) {
				where.completed = completed === 'true';
			}
			if (category) {
				where.templateCategory = category;
			}
			if (templateSlug) {
				where.templateSlug = templateSlug;
			}

			// Парсим сортировку
			const orderArray = order.split(',').map((item) => {
				const [field, direction] = item.split(':');
				return [field, direction?.toUpperCase() || 'ASC'];
			});

			const options = {
				where,
				order: orderArray,
				limit: limit ? parseInt(limit) : undefined,
				offset: parseInt(offset),
			};

			const upgrades =
				await templateViewService.getUserUpgradesWithTemplate(
					userId,
					options
				);

			res.json({
				success: true,
				data: upgrades,
				pagination: {
					limit: options.limit,
					offset: options.offset,
					count: upgrades.length,
				},
			});
		} catch (error) {
			console.error('Ошибка при получении апгрейдов с шаблонами:', error);
			throw new ApiError(500, 'Ошибка при получении апгрейдов');
		}
	}

	/**
	 * Получить конкретный апгрейд пользователя с данными шаблона
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async getUserUpgradeWithTemplate(req, res) {
		try {
			const userId = req.user.id;
			const { upgradeId } = req.params;

			const upgrade =
				await templateViewService.getUserUpgradeWithTemplate(
					userId,
					upgradeId
				);

			if (!upgrade) {
				throw new ApiError(404, 'Апгрейд не найден');
			}

			res.json({
				success: true,
				data: upgrade,
			});
		} catch (error) {
			console.error('Ошибка при получении апгрейда с шаблоном:', error);
			if (error instanceof ApiError) {
				throw error;
			}
			throw new ApiError(500, 'Ошибка при получении апгрейда');
		}
	}

	/**
	 * Получить все задачи пользователя с данными шаблонов
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async getUserTasksWithTemplate(req, res) {
		try {
			const userId = req.user.id;
			const {
				limit,
				offset = 0,
				completed,
				active,
				templateSlug,
				order = 'createdAt:DESC',
			} = req.query;

			// Формируем условия фильтрации
			const where = {};
			if (completed !== undefined) {
				where.completed = completed === 'true';
			}
			if (active !== undefined) {
				where.active = active === 'true';
			}
			if (templateSlug) {
				where.templateSlug = templateSlug;
			}

			// Парсим сортировку
			const orderArray = order.split(',').map((item) => {
				const [field, direction] = item.split(':');
				return [field, direction?.toUpperCase() || 'ASC'];
			});

			const options = {
				where,
				order: orderArray,
				limit: limit ? parseInt(limit) : undefined,
				offset: parseInt(offset),
			};

			const tasks = await templateViewService.getUserTasksWithTemplate(
				userId,
				options
			);

			res.json({
				success: true,
				data: tasks,
				pagination: {
					limit: options.limit,
					offset: options.offset,
					count: tasks.length,
				},
			});
		} catch (error) {
			console.error('Ошибка при получении задач с шаблонами:', error);
			throw new ApiError(500, 'Ошибка при получении задач');
		}
	}

	/**
	 * Получить конкретную задачу пользователя с данными шаблона
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async getUserTaskWithTemplate(req, res) {
		try {
			const userId = req.user.id;
			const { taskId } = req.params;

			const task = await templateViewService.getUserTaskWithTemplate(
				userId,
				taskId
			);

			if (!task) {
				throw new ApiError(404, 'Задача не найдена');
			}

			res.json({
				success: true,
				data: task,
			});
		} catch (error) {
			console.error('Ошибка при получении задачи с шаблоном:', error);
			if (error instanceof ApiError) {
				throw error;
			}
			throw new ApiError(500, 'Ошибка при получении задачи');
		}
	}

	/**
	 * Получить все события пользователя с данными шаблонов
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async getUserEventsWithTemplate(req, res) {
		try {
			const userId = req.user.id;
			const {
				limit,
				offset = 0,
				status,
				templateType,
				templateSlug,
				order = 'triggeredAt:DESC',
			} = req.query;

			// Формируем условия фильтрации
			const where = {};
			if (status) {
				where.status = status.toUpperCase();
			}
			if (templateType) {
				where.templateType = templateType.toUpperCase();
			}
			if (templateSlug) {
				where.templateSlug = templateSlug;
			}

			// Парсим сортировку
			const orderArray = order.split(',').map((item) => {
				const [field, direction] = item.split(':');
				return [field, direction?.toUpperCase() || 'ASC'];
			});

			const options = {
				where,
				order: orderArray,
				limit: limit ? parseInt(limit) : undefined,
				offset: parseInt(offset),
			};

			const events = await templateViewService.getUserEventsWithTemplate(
				userId,
				options
			);

			res.json({
				success: true,
				data: events,
				pagination: {
					limit: options.limit,
					offset: options.offset,
					count: events.length,
				},
			});
		} catch (error) {
			console.error('Ошибка при получении событий с шаблонами:', error);
			throw new ApiError(500, 'Ошибка при получении событий');
		}
	}

	/**
	 * Получить конкретное событие пользователя с данными шаблона
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async getUserEventWithTemplate(req, res) {
		try {
			const userId = req.user.id;
			const { eventId } = req.params;

			const event = await templateViewService.getUserEventWithTemplate(
				userId,
				eventId
			);

			if (!event) {
				throw new ApiError(404, 'Событие не найдено');
			}

			res.json({
				success: true,
				data: event,
			});
		} catch (error) {
			console.error('Ошибка при получении события с шаблоном:', error);
			if (error instanceof ApiError) {
				throw error;
			}
			throw new ApiError(500, 'Ошибка при получении события');
		}
	}

	/**
	 * Получить все пакеты пользователя с данными шаблонов
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async getUserPackagesWithTemplate(req, res) {
		try {
			const userId = req.user.id;
			const {
				limit,
				offset = 0,
				isUsed,
				isLocked,
				resource,
				templateSlug,
				order = 'createdAt:DESC',
			} = req.query;

			// Формируем условия фильтрации
			const where = {};
			if (isUsed !== undefined) {
				where.isUsed = isUsed === 'true';
			}
			if (isLocked !== undefined) {
				where.isLocked = isLocked === 'true';
			}
			if (resource) {
				where.resource = resource;
			}
			if (templateSlug) {
				where.templateSlug = templateSlug;
			}

			// Парсим сортировку
			const orderArray = order.split(',').map((item) => {
				const [field, direction] = item.split(':');
				return [field, direction?.toUpperCase() || 'ASC'];
			});

			const options = {
				where,
				order: orderArray,
				limit: limit ? parseInt(limit) : undefined,
				offset: parseInt(offset),
			};

			const packages =
				await templateViewService.getUserPackagesWithTemplate(
					userId,
					options
				);

			res.json({
				success: true,
				data: packages,
				pagination: {
					limit: options.limit,
					offset: options.offset,
					count: packages.length,
				},
			});
		} catch (error) {
			console.error('Ошибка при получении пакетов с шаблонами:', error);
			throw new ApiError(500, 'Ошибка при получении пакетов');
		}
	}

	/**
	 * Получить конкретный пакет пользователя с данными шаблона
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async getUserPackageWithTemplate(req, res) {
		try {
			const userId = req.user.id;
			const { packageId } = req.params;

			const pkg = await templateViewService.getUserPackageWithTemplate(
				userId,
				packageId
			);

			if (!pkg) {
				throw new ApiError(404, 'Пакет не найден');
			}

			res.json({
				success: true,
				data: pkg,
			});
		} catch (error) {
			console.error('Ошибка при получении пакета с шаблоном:', error);
			if (error instanceof ApiError) {
				throw error;
			}
			throw new ApiError(500, 'Ошибка при получении пакета');
		}
	}

	/**
	 * Получить все артифакты пользователя с данными шаблонов
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async getUserArtifactsWithTemplate(req, res) {
		try {
			const userId = req.user.id;
			const {
				limit,
				offset = 0,
				tradable,
				templateRarity,
				templateSlug,
				order = 'createdAt:DESC',
			} = req.query;

			// Формируем условия фильтрации
			const where = {};
			if (tradable !== undefined) {
				where.tradable = tradable === 'true';
			}
			if (templateRarity) {
				where.templateRarity = templateRarity;
			}
			if (templateSlug) {
				where.templateSlug = templateSlug;
			}

			// Парсим сортировку
			const orderArray = order.split(',').map((item) => {
				const [field, direction] = item.split(':');
				return [field, direction?.toUpperCase() || 'ASC'];
			});

			const options = {
				where,
				order: orderArray,
				limit: limit ? parseInt(limit) : undefined,
				offset: parseInt(offset),
			};

			const artifacts =
				await templateViewService.getUserArtifactsWithTemplate(
					userId,
					options
				);

			res.json({
				success: true,
				data: artifacts,
				pagination: {
					limit: options.limit,
					offset: options.offset,
					count: artifacts.length,
				},
			});
		} catch (error) {
			console.error(
				'Ошибка при получении артифактов с шаблонами:',
				error
			);
			if (error instanceof ApiError) {
				throw error;
			}
			throw new ApiError(500, 'Ошибка при получении артифактов');
		}
	}

	/**
	 * Получить конкретный артифакт пользователя с данными шаблона
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async getUserArtifactWithTemplate(req, res) {
		try {
			const userId = req.user.id;
			const { artifactId } = req.params;

			const artifactData =
				await templateViewService.getUserArtifactWithTemplate(
					userId,
					artifactId
				);

			if (!artifactData) {
				throw new ApiError(404, 'Артифакт не найден');
			}

			res.json({
				success: true,
				data: artifactData,
			});
		} catch (error) {
			console.error('Ошибка при получении артифакта с шаблоном:', error);
			if (error instanceof ApiError) {
				throw error;
			}
			throw new ApiError(500, 'Ошибка при получении артифакта');
		}
	}

	/**
	 * Получить статистику по апгрейдам пользователя
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async getUserUpgradesStats(req, res) {
		try {
			const userId = req.user.id;

			const stats = await templateViewService.getUserUpgradesStats(
				userId
			);

			res.json({
				success: true,
				data: stats,
			});
		} catch (error) {
			console.error('Ошибка при получении статистики апгрейдов:', error);
			throw new ApiError(
				500,
				'Ошибка при получении статистики апгрейдов'
			);
		}
	}

	/**
	 * Получить статистику по задачам пользователя
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async getUserTasksStats(req, res) {
		try {
			const userId = req.user.id;

			const stats = await templateViewService.getUserTasksStats(userId);

			res.json({
				success: true,
				data: stats,
			});
		} catch (error) {
			console.error('Ошибка при получении статистики задач:', error);
			throw new ApiError(500, 'Ошибка при получении статистики задач');
		}
	}

	/**
	 * Получить статистику по событиям пользователя
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async getUserEventsStats(req, res) {
		try {
			const userId = req.user.id;

			const stats = await templateViewService.getUserEventsStats(userId);

			res.json({
				success: true,
				data: stats,
			});
		} catch (error) {
			console.error('Ошибка при получении статистики событий:', error);
			throw new ApiError(500, 'Ошибка при получении статистики событий');
		}
	}

	/**
	 * Получить статистику по пакетам пользователя
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async getUserPackagesStats(req, res) {
		try {
			const userId = req.user.id;

			const stats = await templateViewService.getUserPackagesStats(
				userId
			);

			res.json({
				success: true,
				data: stats,
			});
		} catch (error) {
			console.error('Ошибка при получении статистики пакетов:', error);
			throw new ApiError(500, 'Ошибка при получении статистики пакетов');
		}
	}

	/**
	 * Получить статистику по артифактам пользователя
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async getUserArtifactsStats(req, res) {
		try {
			const userId = req.user.id;
			const stats = await templateViewService.getUserArtifactsStats(
				userId
			);

			res.json({
				success: true,
				data: stats,
			});
		} catch (error) {
			console.error('Ошибка при получении статистики артифактов:', error);
			if (error instanceof ApiError) {
				throw error;
			}
			throw new ApiError(
				500,
				'Ошибка при получении статистики артифактов'
			);
		}
	}

	/**
	 * Получить полную статистику пользователя по всем типам данных
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async getUserFullStats(req, res) {
		try {
			const userId = req.user.id;

			const stats = await templateViewService.getUserFullStats(userId);

			res.json({
				success: true,
				data: stats,
			});
		} catch (error) {
			console.error('Ошибка при получении полной статистики:', error);
			throw new ApiError(500, 'Ошибка при получении статистики');
		}
	}
}

module.exports = new TemplateViewController();
