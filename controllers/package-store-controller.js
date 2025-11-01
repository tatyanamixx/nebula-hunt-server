/**
 * created by Claude on 15.07.2025
 */
const packageStoreService = require("../service/package-store-service");
const ApiError = require("../exceptions/api-error");

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

			// Добавляем логирование для отладки
			console.log("getUserPackages - returning packages:", {
				userId,
				packagesCount: packages.length,
			});

			return res.json(packages);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Get a specific package by slug for the authenticated user
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async getUserPackageBySlug(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { slug } = req.params;

			const packageItem = await packageStoreService.getUserPackageBySlug(
				slug,
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
			const { slug } = req.params;
			const { offer } = req.body; // Необязательный объект с дополнительными параметрами

			// Логируем входящие параметры для отладки
			console.log("usePackage - incoming request:", {
				userId,
				slug,
				offer,
			});

			// Валидация offer параметров
			if (offer && typeof offer !== 'object') {
				return res.status(400).json({
					success: false,
					message: "Offer must be an object",
				});
			}

			const result = await packageStoreService.usePackage(slug, userId, offer);
			
			console.log("usePackage - completed successfully:", {
				userId,
				slug,
				result: {
					userState: result.userState ? 'updated' : 'not_updated',
					package: result.package ? 'used' : 'not_used',
					marketResult: result.marketResult ? 'created' : 'not_created',
				}
			});

			return res.json({
				success: true,
				message: "Package used successfully",
				userState: result.userState,
				package: result.package,
				marketResult: result.marketResult,
			});
		} catch (error) {
			console.error("usePackage - error:", {
				userId: req.initdata?.id,
				slug: req.params?.slug,
				offer: req.body?.offer,
				error: error.message,
			});
			next(error);
		}
	}
}

module.exports = new PackageStoreController();
