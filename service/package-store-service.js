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
const { Op } = require('sequelize');

class PackageStoreService {
	/**
	 * Initialize package store for a new user or update based on active package templates
	 * @param {number} userId - User ID
	 * @param {Object} transaction - Sequelize transaction
	 * @returns {Promise<void>}
	 */
	async initializePackageStore(userId, t) {
		try {
			// Get active package templates
			const activeTemplates = await PackageTemplate.findAll({
				where: {
					status: 'ACTIVE',
				},
				transaction: t,
			});

			if (!activeTemplates || activeTemplates.length === 0) {
				// If no active templates, create default welcome package if user doesn't have any
				const existingPackages = await PackageStore.findOne({
					where: { userId },
					transaction: t,
				});

				if (!existingPackages) {
					// Create default welcome package for new user
					await PackageStore.create(
						{
							id: `welcome_${userId}_${Date.now()}`,
							userId,
							amount: 100,
							resource: 'stardust',
							price: 0,
							currency: 'tgStars',
							status: 'ACTIVE',
							isUsed: false,
							isLocked: false,
						},
						{ transaction }
					);
				}
				return;
			}

			// Get user's existing packages
			const existingPackages = await PackageStore.findAll({
				where: { userId },
				transaction: t,
			});

			// Create a map of template IDs that the user already has
			const existingTemplateMap = new Map();
			existingPackages.forEach((pkg) => {
				// Extract template ID from package ID if it follows the pattern templateId_userId_timestamp
				const parts = pkg.id.split('_');
				if (parts.length >= 3) {
					const templateId = parts[0];
					existingTemplateMap.set(templateId, pkg);
				}
			});

			// Create packages for templates that the user doesn't have
			for (const template of activeTemplates) {
				if (!existingTemplateMap.has(template.id)) {
					// Create new package from template
					await PackageStore.create(
						{
							id: `${template.id}_${userId}_${Date.now()}`,
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
				}
			}
		} catch (error) {
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
	 * @param {string} packageId - Package ID
	 * @param {number} userId - User ID
	 * @returns {Promise<Object>} - Package
	 */
	async getUserPackageById(packageId, userId) {
		const t = await sequelize.transaction();

		try {
			const packageItem = await PackageStore.findOne({
				where: {
					id: packageId,
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
	 * @param {string} packageId - Package ID
	 * @param {number} userId - User ID
	 * @returns {Promise<Object>} - Updated user state and package
	 */
	async usePackage(packageId, userId) {
		const t = await sequelize.transaction();

		try {
			// Find the package
			const packageItem = await PackageStore.findOne({
				where: {
					id: packageId,
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
