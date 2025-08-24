const { PackageTemplate, MarketOffer, PackageStore } = require("../models/models");
const ApiError = require("../exceptions/api-error");
const { ERROR_CODES } = require("../config/error-codes");
const { SYSTEM_USER_ID } = require("../config/constants");
const { offers } = require("../config/market.config");
const marketService = require("./market-service");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");
const sequelize = require("../db");
const logger = require("./logger-service");

class PackageTemplateService {
	/**
	 * Получение всех активных шаблонов пакетов
	 * @param {Object} params Параметры запроса (категория, сортировка и т.д.)
	 * @returns {Promise<Array>} Массив шаблонов пакетов
	 */
	async getAllTemplates(params = {}) {
		try {
			logger.debug("getAllTemplates on start", { params });

			const whereClause = { status: true };

			// Фильтрация по категории
			if (params.category) {
				whereClause.category = params.category;
			}

			// Фильтрация по типу действия
			if (params.actionType) {
				whereClause.actionType = params.actionType;
			}

			const templates = await PackageTemplate.findAll({
				where: whereClause,
				order: [["sortOrder", "ASC"]],
			});

			// Convert Sequelize instances to plain objects and fix data types
			const plainTemplates = templates.map((template) => {
				const templateData = template.get({ plain: true });
				return {
					...templateData,
					id: parseInt(templateData.id) || templateData.id,
					// Новые поля для гибкой структуры
					category: templateData.category || "resourcePurchase",
					actionType: templateData.actionType || "fixedAmount",
					actionTarget: templateData.actionTarget || "reward",
					actionData: templateData.actionData || {},
					costData: templateData.costData || {},
					// Legacy fields для обратной совместимости
					amount: parseInt(templateData.amount) || 0,
					price: parseFloat(templateData.price) || 0,
					resource: templateData.resource || null,
					currency: templateData.currency || null,
					sortOrder: parseInt(templateData.sortOrder) || 0,
					createdAt: templateData.createdAt
						? new Date(templateData.createdAt).toISOString()
						: null,
					updatedAt: templateData.updatedAt
						? new Date(templateData.updatedAt).toISOString()
						: null,
					validUntil: templateData.validUntil
						? new Date(templateData.validUntil).toISOString()
						: null,
				};
			});

			logger.debug("getAllTemplates completed successfully", {
				count: plainTemplates.length,
				filters: params,
			});
			return plainTemplates;
		} catch (err) {
			logger.error("Failed to get all package templates", {
				error: err.message,
				stack: err.stack,
			});

			throw new ApiError(
				500,
				`Failed to get templates: ${err.message}`,
				ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Получение шаблона пакета по slug
	 * @param {string} slug ID шаблона
	 * @returns {Promise<Object>} Шаблон пакета
	 */
	async getTemplateBySlug(slug) {
		try {
			logger.debug("getTemplateBySlug on start", { slug });

			const template = await PackageTemplate.findOne({
				where: { slug },
			});

			if (!template) {
				logger.debug("Package template not found", { slug });
				throw new ApiError(
					404,
					`Package template not found: ${slug}`,
					ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
				);
			}

			// Convert Sequelize instance to plain object and fix data types
			const templateData = template.get({ plain: true });
			return {
				...templateData,
				id: parseInt(templateData.id) || templateData.id,
				amount: parseInt(templateData.amount) || 0,
				price: parseFloat(templateData.price) || 0,
				sortOrder: parseInt(templateData.sortOrder) || 0,
				createdAt: templateData.createdAt
					? new Date(templateData.createdAt).toISOString()
					: null,
				updatedAt: templateData.updatedAt
					? new Date(templateData.updatedAt).toISOString()
					: null,
				validUntil: templateData.validUntil
					? new Date(templateData.validUntil).toISOString()
					: null,
			};

			logger.debug("getTemplateBySlug completed successfully", { slug });
			return templateData;
		} catch (err) {
			logger.error("Failed to get package template by slug", {
				slug,
				error: err.message,
				stack: err.stack,
			});

			throw err instanceof ApiError
				? err
				: new ApiError(
						500,
						`Failed to get template: ${err.message}`,
						ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
				  );
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
			logger.debug("createTemplates on start", {
				templatesCount: templates.length,
			});
			// Set transaction to defer constraints
			await sequelize.query("SET CONSTRAINTS ALL DEFERRED", {
				transaction: t,
			});

			const createdTemplates = [];

			for (const templateData of templates) {
				// Validate template data
				if (!templateData.slug || !templateData.name) {
					if (t && !t.finished) {
						await t.rollback();
					}
					logger.debug("Invalid template data structure", {
						templateData,
					});
					throw new ApiError(
						400,
						"Invalid template data structure",
						ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
					);
				}

				// Prepare template data (exclude id, createdAt, updatedAt)
				const cleanTemplateData = {
					slug: templateData.slug,
					name: templateData.name,
					description: templateData.description,
					// Новые поля для гибкой структуры
					category: templateData.category || "resourcePurchase",
					actionType: templateData.actionType || "fixedAmount",
					actionTarget: templateData.actionTarget || "reward",
					actionData: templateData.actionData || {},
					costData: templateData.costData || {},

					status: templateData.status ?? true,
					icon: templateData.icon,
					sortOrder: templateData.sortOrder || 0,
					labelKey: templateData.labelKey,
					isPromoted: templateData.isPromoted ?? false,
					validUntil: templateData.validUntil,
				};

				// Use findOrCreate to handle duplicates
				const [template, created] = await PackageTemplate.findOrCreate({
					where: { slug: templateData.slug },
					defaults: cleanTemplateData,
					transaction: t,
				});

				// If template already exists, update it
				if (!created) {
					await template.update(cleanTemplateData, {
						transaction: t,
					});
				}

				createdTemplates.push(template);
			}

			// Set constraints back to immediate before commit
			await sequelize.query("SET CONSTRAINTS ALL IMMEDIATE", {
				transaction: t,
			});

			await t.commit();

			// Convert Sequelize instances to plain objects and fix data types
			const plainResults = createdTemplates.map((template) => {
				const templateData = template.get({ plain: true });
				return {
					...templateData,
					id: parseInt(templateData.id) || templateData.id,
					sortOrder: parseInt(templateData.sortOrder) || 0,
					createdAt: templateData.createdAt
						? new Date(templateData.createdAt).toISOString()
						: null,
					updatedAt: templateData.updatedAt
						? new Date(templateData.updatedAt).toISOString()
						: null,
					validUntil:
						templateData.validUntil &&
						templateData.validUntil.trim() !== ""
							? new Date(templateData.validUntil).toISOString()
							: null,
				};
			});

			logger.debug("createTemplates completed successfully", {
				createdCount: plainResults.length,
			});
			return plainResults;
		} catch (err) {
			if (t && !t.finished) {
				await t.rollback();
			}

			logger.error("Failed to create package templates", {
				templatesCount: templates.length,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw new ApiError(
				500,
				`Failed to create templates: ${err.message}`,
				ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Обновление шаблона пакета
	 * @param {Object} templateData Новые данные шаблона
	 * @returns {Promise<Object>} Обновленный шаблон
	 */
	async updateTemplate(updateData) {
		const t = await sequelize.transaction();

		try {
			logger.debug("updateTemplate on start", { slug: updateData.slug });
			const template = await PackageTemplate.findOne({
				where: { slug: updateData.slug },
				transaction: t,
			});

			if (!template) {
				await t.rollback();
				logger.debug("Package template not found for update", {
					slug: updateData.slug,
				});
				throw new ApiError(
					404,
					`Package template not found: ${updateData.slug}`,
					ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
				);
			}

			// Обновляем данные
			await template.update(updateData, { transaction: t });

			await t.commit();

			// Convert Sequelize instance to plain object and fix data types
			const templateData = template.get({ plain: true });
			const result = {
				...templateData,
				id: parseInt(templateData.id) || templateData.id,
				amount: parseInt(templateData.amount) || 0,
				price: parseFloat(templateData.price) || 0,
				sortOrder: parseInt(templateData.sortOrder) || 0,
				createdAt: templateData.createdAt
					? new Date(templateData.createdAt).toISOString()
					: null,
				updatedAt: templateData.updatedAt
					? new Date(templateData.updatedAt).toISOString()
					: null,
				validUntil:
					templateData.validUntil && templateData.validUntil.trim() !== ""
						? new Date(templateData.validUntil).toISOString()
						: null,
			};

			logger.debug("updateTemplate completed successfully", {
				slug: updateData.slug,
			});
			return result;
		} catch (err) {
			if (t && !t.finished) {
				await t.rollback();
			}

			logger.error("Failed to update package template", {
				slug: updateData.slug,
				error: err.message,
				stack: err.stack,
			});

			throw err instanceof ApiError
				? err
				: new ApiError(
						500,
						`Failed to update template: ${err.message}`,
						ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
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
			logger.debug("deleteTemplate on start", { slug });
			const template = await PackageTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!template) {
				await t.rollback();
				logger.debug("Package template not found for deletion", {
					slug,
				});
				throw new ApiError(
					404,
					`Package template not found: ${slug}`,
					ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
				);
			}

			await PackageTemplate.destroy({ where: { slug }, transaction: t });

			await t.commit();

			logger.debug("deleteTemplate completed successfully", { slug });
			return {
				success: true,
				message: `Package template ${slug} deleted successfully`,
			};
		} catch (err) {
			if (t && !t.finished) {
				await t.rollback();
			}

			logger.error("Failed to delete package template", {
				slug,
				error: err.message,
				stack: err.stack,
			});

			throw err instanceof ApiError
				? err
				: new ApiError(
						500,
						`Failed to delete template: ${err.message}`,
						ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
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
			logger.debug("toggleTemplateStatus on start", { slug });
			const template = await PackageTemplate.findOne({
				where: { slug: slug },
				transaction: t,
			});

			if (!template) {
				await t.rollback();
				logger.debug("Package template not found for status toggle", {
					slug,
				});
				throw new ApiError(
					404,
					`Package template not found: ${slug}`,
					ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
				);
			}

			template.status = !template.status;
			await template.save({ transaction: t });

			await t.commit();

			// Convert Sequelize instance to plain object and fix data types
			const templateData = template.get({ plain: true });
			const result = {
				...templateData,
				id: parseInt(templateData.id) || templateData.id,
				amount: parseInt(templateData.amount) || 0,
				price: parseFloat(templateData.price) || 0,
				sortOrder: parseInt(templateData.sortOrder) || 0,
				createdAt: templateData.createdAt
					? new Date(templateData.createdAt).toISOString()
					: null,
				updatedAt: templateData.updatedAt
					? new Date(templateData.updatedAt).toISOString()
					: null,
				validUntil: templateData.validUntil
					? new Date(templateData.validUntil).toISOString()
					: null,
			};

			logger.debug("toggleTemplateStatus completed successfully", {
				slug,
				newStatus: template.status,
			});
			return result;
		} catch (err) {
			if (t && !t.finished) {
				await t.rollback();
			}

			logger.error("Failed to toggle package template status", {
				slug,
				error: err.message,
				stack: err.stack,
			});

			throw err instanceof ApiError
				? err
				: new ApiError(
						500,
						`Failed to change template status: ${err.message}`,
						ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
				  );
		}
	}

	/**
	 * Создание оферты на основе шаблона пакета
	 * @param {string} slug ID шаблона
	 * @returns {Promise<Object>} Созданная оферта
	 */
	async createOfferFromTemplate(slug) {
		try {
			logger.debug("createOfferFromTemplate on start", { slug });
			const template = await PackageTemplate.findOne({
				where: { slug },
			});

			if (!template) {
				logger.debug("Package template not found for offer creation", {
					slug,
				});
				throw new ApiError(
					404,
					`Package template not found: ${slug}`,
					ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
				);
			}

			// Проверяем, что шаблон активен
			if (!template.status) {
				logger.debug("Package template is inactive", { slug });
				throw new ApiError(
					400,
					`Package template is inactive: ${slug}`,
					ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
				);
			}

			// Проверяем, что срок действия не истек
			if (template.validUntil && template.validUntil < new Date()) {
				logger.debug("Package template has expired", {
					slug,
					validUntil: template.validUntil,
				});
				throw new ApiError(
					400,
					`Package template has expired: ${slug}`,
					ERROR_CODES.PACKAGE.PACKAGE_EXPIRED
				);
			}

			// Создаем оферту от имени системного пользователя
			// Используем новые поля для цены и валюты, если они доступны
			const offerData = {
				sellerId: SYSTEM_USER_ID,
				itemType: "package",
				itemId: template.id,
				price: template.costData?.price || 0,
				currency: template.costData?.currency || "tgStars",
				offerType: "SYSTEM",
			};

			// Создаем оферту через marketService
			// Примечание: marketService.createOffer использует свою собственную транзакцию
			const result = await marketService.createOffer(offerData);

			logger.debug("createOfferFromTemplate completed successfully", {
				slug,
			});
			return result;
		} catch (err) {
			logger.error("Failed to create offer from package template", {
				slug,
				error: err.message,
				stack: err.stack,
			});

			throw err instanceof ApiError
				? err
				: new ApiError(
						500,
						`Failed to create offer from template: ${err.message}`,
						ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
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
			logger.debug("createPackageFromTemplate on start", {
				slug,
				userId,
			});
			const template = await PackageTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!template) {
				await t.rollback();
				logger.debug("Package template not found for package creation", {
					slug,
					userId,
				});
				throw new ApiError(
					404,
					`Package template not found: ${slug}`,
					ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
				);
			}

			// Создаем пакет для пользователя
			// Используем новые поля, если они доступны, иначе legacy поля
			const packageStore = await PackageStore.create(
				{
					packageTemplateId: template.id,
					userId,
					// Новые поля
					category: template.category || "resourcePurchase",
					actionType: template.actionType || "fixedAmount",
					actionTarget: template.actionTarget || "reward",
					actionData: template.actionData || {},
					costData: template.costData || {},

					status: "ACTIVE",
					isUsed: false,
					isLocked: false,
				},
				{ transaction: t }
			);

			await t.commit();

			logger.debug("createPackageFromTemplate completed successfully", {
				slug,
				userId,
			});
			return packageStore;
		} catch (err) {
			if (t && !t.finished) {
				await t.rollback();
			}

			logger.error("Failed to create package from template", {
				slug,
				userId,
				error: err.message,
				stack: err.stack,
			});

			throw err instanceof ApiError
				? err
				: new ApiError(
						500,
						`Failed to create package from template: ${err.message}`,
						ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
				  );
		}
	}
}

module.exports = new PackageTemplateService();
