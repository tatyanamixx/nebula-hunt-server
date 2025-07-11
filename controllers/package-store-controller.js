/**
 * created by Claude on 15.07.2025
 */
const packageStoreService = require('../service/package-store-service');
const ApiError = require('../exceptions/api-error');

class PackageStoreController {
	/**
	 * Get all packages for the authenticated user
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async getUserPackages(req, res, next) {
		try {
			const userId = req.initdata.id;
			const packages = await packageStoreService.getUserPackages(userId);
			return res.json(packages);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Get a specific package by ID for the authenticated user
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async getUserPackageById(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { packageId } = req.params;

			const packageItem = await packageStoreService.getUserPackageById(
				packageId,
				userId
			);
			return res.json(packageItem);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Use a package to add resources to user state
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async usePackage(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { packageId } = req.params;

			const result = await packageStoreService.usePackage(
				packageId,
				userId
			);
			return res.json({
				success: true,
				message: 'Package used successfully',
				userState: result.userState,
				package: result.package,
			});
		} catch (error) {
			next(error);
		}
	}
}

module.exports = new PackageStoreController();
