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
	async getAllTemplates() {
		const t = await sequelize.transaction();

		try {
			const templates = await PackageTemplate.findAll({
				order: [['sortOrder', 'ASC']],
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
	 * Получение шаблона пакета по slug
	 * @param {string} slug ID шаблона
	 * @returns {Promise<Object>} Шаблон пакета
	 */
	async getTemplateBySlug(slug) {
		const t = await sequelize.transaction();

		try {
			const template = await PackageTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!template) {
				await t.rollback();
				throw new ApiError(404, 'Package template not found');
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
	async createTemplates(templates) {
		const t = await sequelize.transaction();

		try {
			const createdTemplates = [];

			for (const templateData of templates) {
				// Try to find existing template with the same slug
				let template = await PackageTemplate.findOne({
					where: { slug: templateData.slug },
					transaction: t,
				});

				if (template) {
					await PackageTemplate.update(templateData, {
						where: { id: template.id },
						transaction: t,
					});

					template = await PackageTemplate.findOne({
						where: { id: template.id },
						transaction: t,
					});
					createdTemplates.push(template);
					continue;
				}

				const newTemplate = await PackageTemplate.create(templateData, {
					transaction: t,
				});
				createdTemplates.push(newTemplate);
			}

			await t.commit();
			return createdTemplates;
		} catch (err) {
			await t.rollback();
			throw new ApiError(
				500,
				`Failed to create templates: ${err.message}`
			);
		}
	}

	/**
	 * Обновление шаблона пакета
	 * @param {Object} templateData Новые данные шаблона
	 * @returns {Promise<Object>} Обновленный шаблон
	 */
	async updateTemplate(templateData) {
		const t = await sequelize.transaction();

		try {
			const template = await PackageTemplate.findOne({
				where: { slug: templateData.slug },
				transaction: t,
			});

			if (!template) {
				await t.rollback();
				throw new ApiError(404, 'Package template not found');
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
	 * Удаление шаблона пакета
	 * @param {string} slug ID шаблона
	 * @returns {Promise<Object>} Удаленный шаблон
	 */
	async deleteTemplate(slug) {
		const t = await sequelize.transaction();
		try {
			await PackageTemplate.destroy({ where: { slug }, transaction: t });
		} catch (err) {
			await t.rollback();
			throw err instanceof ApiError
				? err
				: new ApiError(
						500,
						`Failed to delete template: ${err.message}`
				  );
		}
	}

	/**
	 * Изменение статуса шаблона пакета
	 * @param {string} slug ID шаблона
	 * @param {string} status Новый статус (ACTIVE, INACTIVE)
	 * @returns {Promise<Object>} Обновленный шаблон
	 */
	async toggleTemplateStatus(slug) {
		const t = await sequelize.transaction();

		try {
			const template = await PackageTemplate.findOne({
				where: { slug: slug },
				transaction: t,
			});

			if (!template) {
				await t.rollback();
				throw new ApiError(404, 'Package template not found');
			}

			template.status = !template.status;
			await template.save({ transaction: t });

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
	 * @param {string} slug ID шаблона
	 * @returns {Promise<Object>} Созданная оферта
	 */
	async createOfferFromTemplate(slug) {
		const t = await sequelize.transaction();

		try {
			const template = await PackageTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!template) {
				await t.rollback();
				throw new ApiError(404, 'Package template not found');
			}

			// Проверяем, что шаблон активен
			if (!template.status) {
				await t.rollback();
				throw new ApiError(400, 'Package template is inactive');
			}

			// Проверяем, что срок действия не истек
			if (template.validUntil && template.validUntil < new Date()) {
				await t.rollback();
				throw new ApiError(400, 'Package template has expired');
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
	 * @param {string} slug ID шаблона
	 * @param {number} userId ID пользователя
	 * @returns {Promise<Object>} Созданный пакет
	 */
	async createPackageFromTemplate(slug, userId) {
		const t = await sequelize.transaction();

		try {
			const template = await PackageTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!template) {
				await t.rollback();
				throw new ApiError(404, 'Package template not found');
			}

			// Создаем пакет для пользователя
			const packageStore = await PackageStore.create(
				{
					packageTemplateId: template.id,
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
