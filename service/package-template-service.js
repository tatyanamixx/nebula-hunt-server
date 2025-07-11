const {
	PackageTemplate,
	MarketOffer,
	PackageStore,
} = require('../models/models');
const ApiError = require('../exceptions/api-error');
const { SYSTEM_USER_ID } = require('../config/constants');
const { offers } = require('../config/market.config');
const marketService = require('./market-service');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const sequelize = require('../db');

class PackageTemplateService {
	/**
	 * Получение всех активных шаблонов пакетов
	 * @param {Object} params Параметры запроса (категория, сортировка и т.д.)
	 * @returns {Promise<Array>} Массив шаблонов пакетов
	 */
	async getAllTemplates({ category, sortBy = 'sortOrder', sortDir = 'ASC' }) {
		const t = await sequelize.transaction();

		try {
			const where = { status: 'ACTIVE' };

			if (category) {
				where.category = category;
			}

			// Проверяем, что срок действия не истек
			where.validUntil = {
				[Op.or]: [
					{ [Op.is]: null }, // Бессрочные шаблоны
					{ [Op.gt]: new Date() }, // Срок действия не истек
				],
			};

			const templates = await PackageTemplate.findAll({
				where,
				order: [[sortBy, sortDir]],
				transaction: t,
			});

			await t.commit();
			return templates;
		} catch (err) {
			await t.rollback();
			throw new ApiError(500, `Failed to get templates: ${err.message}`);
		}
	}

	/**
	 * Получение шаблона пакета по ID
	 * @param {string} id ID шаблона
	 * @returns {Promise<Object>} Шаблон пакета
	 */
	async getTemplateById(id) {
		const t = await sequelize.transaction();

		try {
			const template = await PackageTemplate.findByPk(id, {
				transaction: t,
			});

			if (!template) {
				await t.rollback();
				throw new ApiError(404, 'Шаблон пакета не найден');
			}

			await t.commit();
			return template;
		} catch (err) {
			await t.rollback();
			throw err instanceof ApiError
				? err
				: new ApiError(500, `Failed to get template: ${err.message}`);
		}
	}

	/**
	 * Создание шаблона пакета
	 * @param {Object} templateData Данные шаблона
	 * @returns {Promise<Object>} Созданный шаблон
	 */
	async createTemplate(templateData) {
		const t = await sequelize.transaction();

		try {
			// Генерируем ID, если не указан
			if (!templateData.id) {
				templateData.id = `pkg_${uuidv4().substring(0, 8)}`;
			}

			const template = await PackageTemplate.create(templateData, {
				transaction: t,
			});

			await t.commit();
			return template;
		} catch (err) {
			await t.rollback();
			throw new ApiError(
				500,
				`Failed to create template: ${err.message}`
			);
		}
	}

	/**
	 * Обновление шаблона пакета
	 * @param {string} id ID шаблона
	 * @param {Object} templateData Новые данные шаблона
	 * @returns {Promise<Object>} Обновленный шаблон
	 */
	async updateTemplate(id, templateData) {
		const t = await sequelize.transaction();

		try {
			const template = await PackageTemplate.findByPk(id, {
				transaction: t,
			});

			if (!template) {
				await t.rollback();
				throw new ApiError(404, 'Шаблон пакета не найден');
			}

			// Обновляем данные
			await template.update(templateData, { transaction: t });

			await t.commit();
			return template;
		} catch (err) {
			await t.rollback();
			throw err instanceof ApiError
				? err
				: new ApiError(
						500,
						`Failed to update template: ${err.message}`
				  );
		}
	}

	/**
	 * Изменение статуса шаблона пакета
	 * @param {string} id ID шаблона
	 * @param {string} status Новый статус (ACTIVE, INACTIVE)
	 * @returns {Promise<Object>} Обновленный шаблон
	 */
	async changeTemplateStatus(id, status) {
		const t = await sequelize.transaction();

		try {
			const template = await PackageTemplate.findByPk(id, {
				transaction: t,
			});

			if (!template) {
				await t.rollback();
				throw new ApiError(404, 'Шаблон пакета не найден');
			}

			await template.update({ status }, { transaction: t });

			await t.commit();
			return template;
		} catch (err) {
			await t.rollback();
			throw err instanceof ApiError
				? err
				: new ApiError(
						500,
						`Failed to change template status: ${err.message}`
				  );
		}
	}

	/**
	 * Создание оферты на основе шаблона пакета
	 * @param {string} templateId ID шаблона
	 * @returns {Promise<Object>} Созданная оферта
	 */
	async createOfferFromTemplate(templateId) {
		const t = await sequelize.transaction();

		try {
			const template = await PackageTemplate.findByPk(templateId, {
				transaction: t,
			});

			if (!template) {
				await t.rollback();
				throw new ApiError(404, 'Шаблон пакета не найден');
			}

			// Проверяем, что шаблон активен
			if (template.status !== 'ACTIVE') {
				await t.rollback();
				throw new ApiError(400, 'Шаблон пакета неактивен');
			}

			// Проверяем, что срок действия не истек
			if (template.validUntil && template.validUntil < new Date()) {
				await t.rollback();
				throw new ApiError(400, 'Срок действия шаблона пакета истек');
			}

			// Создаем оферту от имени системного пользователя
			const offerData = {
				sellerId: SYSTEM_USER_ID,
				itemType: 'package',
				itemId: template.id,
				price: template.price,
				currency: template.currency,
				offerType: 'SYSTEM',
			};

			await t.commit();

			// Создаем оферту через marketService
			// Примечание: marketService.createOffer использует свою собственную транзакцию
			return await marketService.createOffer(offerData);
		} catch (err) {
			await t.rollback();
			throw err instanceof ApiError
				? err
				: new ApiError(
						500,
						`Failed to create offer from template: ${err.message}`
				  );
		}
	}

	/**
	 * Создание пакета для пользователя на основе шаблона
	 * @param {string} templateId ID шаблона
	 * @param {number} userId ID пользователя
	 * @returns {Promise<Object>} Созданный пакет
	 */
	async createPackageFromTemplate(templateId, userId) {
		const t = await sequelize.transaction();

		try {
			const template = await PackageTemplate.findByPk(templateId, {
				transaction: t,
			});

			if (!template) {
				await t.rollback();
				throw new ApiError(404, 'Шаблон пакета не найден');
			}

			// Генерируем уникальный ID для пакета
			const packageId = `${template.id}_${userId}_${Date.now()}`;

			// Создаем пакет для пользователя
			const packageStore = await PackageStore.create(
				{
					id: packageId,
					userId,
					amount: template.amount,
					resource: template.resource,
					price: template.price,
					currency: template.currency,
					status: 'ACTIVE',
					isUsed: false,
					isLocked: false,
				},
				{ transaction: t }
			);

			await t.commit();
			return packageStore;
		} catch (err) {
			await t.rollback();
			throw err instanceof ApiError
				? err
				: new ApiError(
						500,
						`Failed to create package from template: ${err.message}`
				  );
		}
	}
}

module.exports = new PackageTemplateService();
