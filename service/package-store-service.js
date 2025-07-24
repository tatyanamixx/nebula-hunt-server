/**
 * created by Claude on 15.07.2025
 */
const {
	PackageStore,
	UserState,
	PackageTemplate,
} = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const logger = require('./logger-service');
const { Op } = require('sequelize');

class PackageStoreService {
	/**
	 * Initialize package store for a new user or update based on active package templates
	 * @param {number} userId - User ID
	 * @param {Object} transaction - Sequelize transaction
	 * @returns {Promise<void>}
	 */
	async initializePackageStore(userId, t) {
		const transaction = t || (await sequelize.transaction());
		const shouldCommit = !transaction;
		logger.debug('initializePackageStore on start', {
			userId,
		});
		try {
			// Get active package templates
			const activeTemplates = await PackageTemplate.findAll({
				where: {
					status: true,
				},
				transaction: transaction,
			});

			const initializedPackages = [];
			if (activeTemplates && activeTemplates.length > 0) {
				for (const template of activeTemplates) {
					const existingPackage = await PackageStore.findOne({
						where: { userId, templateId: template.id },
						transaction: transaction,
					});
					if (!existingPackage) {
						// If no active templates, create default welcome package if user doesn't have any
						const packagenew = await PackageStore.create(
							{
								templateId: template.id,
								userId,
								amount: template.amount,
								resource: template.resource,
								price: template.price,
								currency: template.currency,
								status: true,
								isUsed: false,
								isLocked: false,
							},
							{ transaction: transaction }
						);
						initializedPackages.push({
							...packagenew.toJSON(),
							package: template.toJSON(),
						});
					} else {
						logger.debug('package already exists');
						initializedPackages.push({
							...existingPackage.toJSON(),
							package: template.toJSON(),
						});
					}
				}
			}

			if (shouldCommit && !transaction.finished) {
				await transaction.commit();
			}
			return initializedPackages;
		} catch (error) {
			if (shouldCommit && !transaction.finished) {
				await transaction.rollback();
			}
			throw ApiError.Internal(
				`Failed to initialize package store: ${error.message}`
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
			const packages = await PackageStore.findAll({
				where: {
					userId,
					status: 'ACTIVE',
				},
				order: [['createdAt', 'DESC']],
				transaction: t,
			});

			await t.commit();
			return packages;
		} catch (error) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get user packages: ${error.message}`
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
			const packageTemplate = await PackageTemplate.findOne({
				where: { slug },
				transaction: t,
			});
			if (!packageTemplate) {
				throw ApiError.NotFound('Package template not found');
			}
			const packageItem = await PackageStore.findOne({
				where: {
					templateId: packageTemplate.id,
					userId,
				},
				transaction: t,
			});

			if (!packageItem) {
				await t.rollback();
				throw ApiError.NotFound(
					'Package not found or does not belong to user'
				);
			}

			await t.commit();
			return packageItem;
		} catch (error) {
			await t.rollback();
			if (error instanceof ApiError) {
				throw error;
			}
			throw ApiError.Internal(
				`Failed to get user package: ${error.message}`
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
			const packageTemplate = await PackageTemplate.findOne({
				where: { slug },
				transaction: t,
			});
			if (!packageTemplate) {
				throw ApiError.NotFound('Package template not found');
			}
			// Find the package
			const packageItem = await PackageStore.findOne({
				where: {
					templateId: packageTemplate.id,
					userId,
					status: 'ACTIVE',
					isUsed: false,
					isLocked: false,
				},
				transaction: t,
			});

			if (!packageItem) {
				await t.rollback();
				throw ApiError.NotFound(
					'Package not found, already used, or locked'
				);
			}

			// Get user state
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userState) {
				await t.rollback();
				throw ApiError.NotFound('User state not found');
			}

			// Add resources to user state
			switch (packageItem.resource) {
				case 'stardust':
					userState.stardust += packageItem.amount;
					break;
				case 'darkMatter':
					userState.darkMatter += packageItem.amount;
					break;
				case 'stars':
					userState.tgStars += packageItem.amount;
					break;
				default:
					await t.rollback();
					throw ApiError.BadRequest('Invalid resource type');
			}

			// Mark package as used
			packageItem.isUsed = true;

			// Save changes
			await Promise.all([
				userState.save({ transaction: t }),
				packageItem.save({ transaction: t }),
			]);

			await t.commit();

			return {
				userState,
				package: packageItem,
			};
		} catch (error) {
			await t.rollback();
			if (error instanceof ApiError) {
				throw error;
			}
			throw ApiError.Internal(`Failed to use package: ${error.message}`);
		}
	}
}

module.exports = new PackageStoreService();
