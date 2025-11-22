/**
 * created by Claude on 15.07.2025
 */
const { PackageStore, UserState, PackageTemplate } = require("../models/models");
const ApiError = require("../exceptions/api-error");
const { ERROR_CODES } = require("../config/error-codes");
const { SYSTEM_USER_ID } = require("../config/constants");
const sequelize = require("../db");
const logger = require("./logger-service");
const { Op } = require("sequelize");
const marketService = require("./market-service");

class PackageStoreService {
	/**
	 * Initialize package store for a new user using findOrCreate
	 * @param {number} userId - User ID
	 * @param {Object} transaction - Sequelize transaction
	 * @returns {Promise<Array>} - Initialized packages
	 */
	async initializePackageStore(userId, t) {
		const transaction = t || (await sequelize.transaction());
		const shouldCommit = !t;

		logger.debug("initializePackageStore on start", { userId });

		try {
			// Get active package templates
			const activeTemplates = await PackageTemplate.findAll({
				where: { status: true },
				transaction: transaction,
			});

			if (!activeTemplates || activeTemplates.length === 0) {
				logger.debug("No active package templates found", { userId });
				if (shouldCommit && !transaction.finished) {
					await transaction.commit();
				}
				return [];
			}

			const initializedPackages = [];
			for (const template of activeTemplates) {
				try {
					const [packageItem, created] = await PackageStore.findOrCreate({
						where: {
							userId,
							packageTemplateId: template.id,
						},
						defaults: {
							packageTemplateId: template.id,
							userId,
							status: true,
							isUsed: false,
						},
						transaction: transaction,
					});

					if (created) {
						logger.debug("Created new package store item", {
							userId,
							packageTemplateId: template.id,
							templateSlug: template.slug,
						});

						initializedPackages.push({
							...packageItem.toJSON(),
							package: template.toJSON(),
						});
					} else {
						// Если запись уже существует, обновляем только status
						await packageItem.update(
							{ status: true },
							{ transaction: transaction }
						);
						logger.debug("Updated existing package store item status", {
							userId,
							packageTemplateId: template.id,
							templateSlug: template.slug,
						});
					}

					initializedPackages.push({
						...packageItem.toJSON(),
						package: template.toJSON(),
					});
				} catch (packageError) {
					logger.error("Error creating package store item", {
						userId,
						packageTemplateId: template.id,
						templateSlug: template.slug,
						error: packageError.message,
					});
					throw ApiError.Internal(
						`Failed to create package store item for template ${template.slug}: ${packageError.message}`,
						ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
					);
				}
			}

			if (shouldCommit && !transaction.finished) {
				await transaction.commit();
			}

			logger.debug("Package store initialized successfully", {
				userId,
				packagesCreated: initializedPackages.length,
			});

			return initializedPackages;
		} catch (err) {
			if (shouldCommit && !transaction.finished) {
				await transaction.rollback();
			}

			logger.error("Failed to initialize package store", {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to initialize package store: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}

	/**
	 * Get all packages for a user
	 * @param {number} userId - User ID
	 * @returns {Promise<Array>} - User packages
	 */
	async getUserPackages(userId) {
		const t = await sequelize.transaction();

		try {
			logger.debug("getUserPackages on start", { userId });

			// Сначала проверяем, есть ли у пользователя пакеты
			// ✅ Фильтруем только пакеты с активными шаблонами
			let packages = await PackageStore.findAll({
				where: {
					userId,
					status: true,
				},
				include: [
					{
						model: PackageTemplate,
						where: {
							status: true, // ✅ Только активные шаблоны пакетов
						},
						required: true, // ✅ INNER JOIN - только пакеты с активными шаблонами
						attributes: [
							"id",
							"slug",
							"name",
							"description",
							"icon",
							"sortOrder",
							"category",
							"actionType",
							"actionTarget",
							"actionData",
							"costData",
							"labelKey",
							"isPromoted",
							"validUntil",
							"status",
						],
					},
				],
				order: [["createdAt", "DESC"]],
				transaction: t,
			});

			// Если у пользователя нет пакетов, инициализируем их
			if (!packages || packages.length === 0) {
				logger.debug(
					"No packages found for user, initializing package store",
					{ userId }
				);

				// Инициализируем пакеты на основе активных шаблонов
				const initializedPackages = await this.initializePackageStore(
					userId,
					t
				);

				// Получаем инициализированные пакеты с шаблонами
				packages = await PackageStore.findAll({
					where: {
						userId,
						status: true,
					},
					include: [
						{
							model: PackageTemplate,
							where: {
								status: true, // ✅ Только активные шаблоны пакетов
							},
							required: true, // ✅ INNER JOIN - только пакеты с активными шаблонами
							attributes: [
								"id",
								"slug",
								"name",
								"description",
								"icon",
								"sortOrder",
								"category",
								"actionType",
								"actionTarget",
								"actionData",
								"costData",
								"labelKey",
								"isPromoted",
								"validUntil",
								"status",
							],
						},
					],
					order: [["createdAt", "DESC"]],
					transaction: t,
				});

				logger.debug("Package store initialized and packages loaded", {
					userId,
					packagesCount: packages.length,
				});
			}

			const result = packages.map((packageItem) => ({
				...packageItem.toJSON(),
				package: packageItem.packagetemplate?.toJSON(),
			}));

			await t.commit();

			return result;
		} catch (err) {
			await t.rollback();

			logger.error("Failed to get user packages", {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get user packages: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}

	/**
	 * Get user package by slug
	 * @param {string} slug - Package slug
	 * @param {number} userId - User ID
	 * @returns {Promise<Object>} - Package
	 */
	async getUserPackageBySlug(slug, userId) {
		const t = await sequelize.transaction();

		try {
			// Находим шаблон пакета
			const packageTemplate = await PackageTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!packageTemplate) {
				logger.debug("getUserPackageBySlug - package template not found", {
					userId,
					slug,
				});
				throw ApiError.NotFound(
					`Package template not found: ${slug}`,
					ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
				);
			}

			// Находим пакет пользователя
			const packageItem = await PackageStore.findOne({
				where: {
					packageTemplateId: packageTemplate.id,
					userId,
				},
				include: [
					{
						model: PackageTemplate,
						attributes: [
							"id",
							"slug",
							"name",
							"description",
							"icon",
							"sortOrder",
							"category",
							"actionType",
							"actionTarget",
							"actionData",
							"costData",
							"labelKey",
							"isPromoted",
							"validUntil",
						],
					},
				],
				transaction: t,
			});

			if (!packageItem) {
				logger.debug("getUserPackageBySlug - package not found", {
					userId,
					slug,
					packageTemplateId: packageTemplate.id,
				});
				throw ApiError.NotFound(
					`Package not found or does not belong to user: ${slug}`,
					ERROR_CODES.PACKAGE.PACKAGE_NOT_FOUND
				);
			}

			const result = {
				...packageItem.toJSON(),
				package: packageItem.packagetemplate?.toJSON(),
			};

			await t.commit();

			return result;
		} catch (err) {
			await t.rollback();

			logger.error("Failed to get user package by slug", {
				userId,
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get user package: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}

	/**
	 * Use a package to add resources to user state
	 * @param {string} slug - Package ID
	 * @param {number} userId - User ID
	 * @returns {Promise<Object>} - Updated user state and package
	 */
	async usePackage(slug, userId, offer = {}) {
		const t = await sequelize.transaction();

		try {
			logger.debug("usePackage started", {
				userId,
				slug,
				offer,
			});

			// Находим шаблон пакета
			const packageTemplate = await PackageTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!packageTemplate) {
				logger.debug("usePackage - package template not found", {
					userId,
					slug,
				});
				throw ApiError.NotFound(
					`Package template not found: ${slug}`,
					ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND
				);
			}

			logger.debug("usePackage - package template found", {
				userId,
				slug,
				actionType: packageTemplate.actionType,
				actionTarget: packageTemplate.actionTarget,
			});

			// Находим пакет пользователя
			const packageItem = await PackageStore.findOne({
				where: {
					packageTemplateId: packageTemplate.id,
					userId,
					status: true,
					isUsed: false,
				},
				transaction: t,
			});

			if (!packageItem) {
				logger.debug("usePackage - package not found or unavailable", {
					userId,
					slug,
					packageTemplateId: packageTemplate.id,
				});
				throw ApiError.NotFound(
					`Package not found, already used, or locked: ${slug}`,
					ERROR_CODES.PACKAGE.PACKAGE_NOT_FOUND
				);
			}

			// Обрабатываем разные типы действий
			const actionType = packageTemplate.actionType || "fixedAmount";
			const actionTarget = packageTemplate.actionTarget || "reward";
			const actionData = packageTemplate.actionData || {};
			const costData = packageTemplate.costData || {};

			let result;

			switch (actionType) {
				case "fixedAmount":
					// Создаем offer для регистрации изменений в состоянии через registerOffer
					const fixedOfferData = {
						sellerId: SYSTEM_USER_ID, // Системный аккаунт
						buyerId: userId,
						price: costData.price || 0,
						currency: costData.currency || "tgStars",
						resource: actionData.resource || "stardust",
						amount: actionData.amount || 0,
						itemType: "package",
						itemId: packageItem.id, // userPackageStoreId
						offerType: "SYSTEM",
						txType: "PACKAGE_REWARD",
					};

					// Создаем транзакцию по оплате через marketService.registerOffer
					result = await marketService.registerOffer(fixedOfferData, t);
					break;

				case "variableAmount":
					// Для variableAmount используем параметры из offer
					if (!offer || !offer.amount) {
						throw new ApiError(
							400,
							`Missing required offer.amount for variableAmount package`,
							ERROR_CODES.PACKAGE.INVALID_ACTION
						);
					}

					// Создаем offer для регистрации изменений в состоянии через registerOffer
					const variableOfferData = {
						sellerId: SYSTEM_USER_ID, // Системный аккаунт
						buyerId: userId,
						price: costData.price || 0,
						currency: costData.currency || "tgStars",
						resource: actionData.resource || "stardust",
						amount: offer.amount, // Используем amount из offer
						itemType: "package",
						itemId: packageItem.id, // userPackageStoreId
						offerType: "SYSTEM",
						txType: "PACKAGE_REWARD",
					};

					// Создаем транзакцию по оплате через marketService.registerOffer
					result = await marketService.registerOffer(variableOfferData, t);
					break;

				case "updateField":
					// Обрабатываем обновление полей игровых объектов
					if (actionTarget === "entity" && actionData.table === "galaxy") {
						// Импортируем galaxyService для обновления галактик
						const galaxyService = require("./galaxy-service");

						// Получаем данные для обновления, заменяя placeholder'ы из offer
						let seed = actionData.seed;
						let field = actionData.field;
						let value = actionData.value;

						// Заменяем placeholder'ы на значения из offer
						if (offer) {
							if (offer.seed !== undefined) seed = offer.seed;
							if (offer.field !== undefined) field = offer.field;
							if (offer.value !== undefined) value = offer.value;
						}

						if (!seed || !field || value === undefined) {
							throw new ApiError(
								400,
								`Missing required fields for galaxy update: seed, field, value`,
								ERROR_CODES.PACKAGE.INVALID_ACTION
							);
						}

						// Обновляем галактику
						const updateData = { [field]: value };
						await galaxyService.updateGalaxy(seed, updateData, userId);

						logger.debug("Galaxy field updated successfully", {
							userId,
							seed,
							field,
							value,
							actionData,
							offer,
						});

						result = {
							success: true,
							message: `Galaxy field ${field} updated successfully`,
							updatedField: { seed, field, value },
						};
					} else {
						throw new ApiError(
							400,
							`Unsupported action target: ${actionTarget}`,
							ERROR_CODES.PACKAGE.INVALID_ACTION
						);
					}
					break;

				default:
					throw new ApiError(
						400,
						`Unsupported action type: ${actionType}`,
						ERROR_CODES.PACKAGE.INVALID_ACTION
					);
			}

			// Получаем обновленное состояние пользователя
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			await t.commit();

			logger.debug("usePackage completed successfully", {
				userId,
				slug,
				packageId: packageItem.id,
				actionType: packageTemplate.actionType,
				actionTarget: packageTemplate.actionTarget,
				marketResult: result,
			});

			return {
				userState: userState,
				package: packageItem,
				marketResult: result,
			};
		} catch (err) {
			await t.rollback();

			logger.error("Failed to use package", {
				userId,
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to use package: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}
}

module.exports = new PackageStoreService();
