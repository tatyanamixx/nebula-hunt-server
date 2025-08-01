/**
 * created by Claude on 15.07.2025
 */
const {
	PackageStore,
	UserState,
	PackageTemplate,
} = require('../models/models');
const ApiError = require('../exceptions/api-error');
const { ERROR_CODES } = require('../config/error-codes');
const sequelize = require('../db');
const logger = require('./logger-service');
const { Op } = require('sequelize');

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

		logger.debug('initializePackageStore on start', { userId });

		try {
			// Get active package templates
			const activeTemplates = await PackageTemplate.findAll({
				where: { status: true },
				transaction: transaction,
			});

			if (!activeTemplates || activeTemplates.length === 0) {
				logger.debug('No active package templates found', { userId });
				if (shouldCommit && !transaction.finished) {
					await transaction.commit();
				}
				return [];
			}

			const initializedPackages = [];
			for (const template of activeTemplates) {
				try {
					const [packageItem, created] =
						await PackageStore.findOrCreate({
							where: {
								userId,
								packageTemplateId: template.id,
							},
							defaults: {
								packageTemplateId: template.id,
								userId,
								amount: template.amount,
								resource: template.resource,
								price: template.price,
								currency: template.currency,
								status: true,
								isUsed: false,
								isLocked: false,
							},
							transaction: transaction,
						});

					if (created) {
						logger.debug('Created new package store item', {
							userId,
							packageTemplateId: template.id,
							templateSlug: template.slug,
						});

						initializedPackages.push({
							...packageItem.toJSON(),
							package: template.toJSON(),
						});
					} else {
						logger.debug('Package store item already exists', {
							userId,
							packageTemplateId: template.id,
							templateSlug: template.slug,
						});

						initializedPackages.push({
							...packageItem.toJSON(),
							package: template.toJSON(),
						});
					}
				} catch (packageError) {
					logger.error('Error creating package store item', {
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

			logger.debug('Package store initialized successfully', {
				userId,
				packagesCreated: initializedPackages.length,
			});

			return initializedPackages;
		} catch (err) {
			if (shouldCommit && !transaction.finished) {
				await transaction.rollback();
			}

			logger.error('Failed to initialize package store', {
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
			logger.debug('getUserPackages on start', { userId });

			const packages = await PackageStore.findAll({
				where: {
					userId,
					status: 'ACTIVE',
				},
				include: [
					{
						model: PackageTemplate,
						attributes: [
							'id',
							'slug',
							'title',
							'description',
							'amount',
							'resource',
							'price',
							'currency',
							'status',
						],
					},
				],
				order: [['createdAt', 'DESC']],
				transaction: t,
			});

			const result = packages.map((packageItem) => ({
				...packageItem.toJSON(),
				package: packageItem.packagetemplate?.toJSON(),
			}));

			await t.commit();

			logger.debug('getUserPackages completed successfully', {
				userId,
				packagesCount: result.length,
			});

			return result;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to get user packages', {
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
	 * Get user package by ID
	 * @param {string} slug - Package ID
	 * @param {number} userId - User ID
	 * @returns {Promise<Object>} - Package
	 */
	async getUserPackageById(slug, userId) {
		const t = await sequelize.transaction();

		try {
			logger.debug('getUserPackageById on start', { userId, slug });

			// Находим шаблон пакета
			const packageTemplate = await PackageTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!packageTemplate) {
				logger.debug(
					'getUserPackageById - package template not found',
					{
						userId,
						slug,
					}
				);
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
							'id',
							'slug',
							'title',
							'description',
							'amount',
							'resource',
							'price',
							'currency',
							'status',
						],
					},
				],
				transaction: t,
			});

			if (!packageItem) {
				logger.debug('getUserPackageById - package not found', {
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

			logger.debug('getUserPackageById completed successfully', {
				userId,
				slug,
				packageId: packageItem.id,
			});

			return result;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to get user package by ID', {
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
	async usePackage(slug, userId) {
		const t = await sequelize.transaction();

		try {
			logger.debug('usePackage on start', { userId, slug });

			// Находим шаблон пакета
			const packageTemplate = await PackageTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!packageTemplate) {
				logger.debug('usePackage - package template not found', {
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
					status: 'ACTIVE',
					isUsed: false,
					isLocked: false,
				},
				transaction: t,
			});

			if (!packageItem) {
				logger.debug('usePackage - package not found or unavailable', {
					userId,
					slug,
					packageTemplateId: packageTemplate.id,
				});
				throw ApiError.NotFound(
					`Package not found, already used, or locked: ${slug}`,
					ERROR_CODES.PACKAGE.PACKAGE_NOT_FOUND
				);
			}

			// Получаем состояние пользователя
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userState) {
				logger.debug('usePackage - user state not found', {
					userId,
				});
				throw ApiError.NotFound(
					`User state not found for user: ${userId}`,
					ERROR_CODES.USER_STATE.STATE_NOT_FOUND
				);
			}

			// Добавляем ресурсы к состоянию пользователя
			const oldValues = {
				stardust: userState.stardust,
				darkMatter: userState.darkMatter,
				stars: userState.stars,
			};

			switch (packageItem.resource) {
				case 'stardust':
					userState.stardust += packageItem.amount;
					break;
				case 'darkMatter':
					userState.darkMatter += packageItem.amount;
					break;
				case 'stars':
					userState.stars += packageItem.amount;
					break;
				default:
					logger.error('usePackage - invalid resource type', {
						userId,
						slug,
						resource: packageItem.resource,
					});
					throw ApiError.BadRequest(
						`Invalid resource type: ${packageItem.resource}`,
						ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
					);
			}

			// Помечаем пакет как использованный
			packageItem.isUsed = true;

			// Сохраняем изменения
			await Promise.all([
				userState.save({ transaction: t }),
				packageItem.save({ transaction: t }),
			]);

			await t.commit();

			logger.debug('usePackage completed successfully', {
				userId,
				slug,
				packageId: packageItem.id,
				resource: packageItem.resource,
				amount: packageItem.amount,
				oldValues,
				newValues: {
					stardust: userState.stardust,
					darkMatter: userState.darkMatter,
					stars: userState.stars,
				},
			});

			return {
				userState,
				package: packageItem,
			};
		} catch (err) {
			await t.rollback();

			logger.error('Failed to use package', {
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
