const adminService = require('../service/admin-service');
const ApiError = require('../exceptions/api-error');

class AdminController {
	async initializeDatabase(req, res, next) {
		try {
			// Check if request is from admin
			if (req.userToken.role !== 'ADMIN') {
				throw ApiError.Forbidden(
					'Only administrators can initialize the database'
				);
			}

			const result = await adminService.initializeDatabase();
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async createVerseGalaxies(req, res, next) {
		try {
			// Check if request is from admin
			if (req.userToken.role !== 'ADMIN') {
				throw ApiError.Forbidden(
					'Only administrators can create VERSE galaxies'
				);
			}

			const { galaxies } = req.body;

			// Validate galaxies array
			if (!Array.isArray(galaxies)) {
				throw ApiError.BadRequest('Galaxies must be an array');
			}

			const result = await adminService.createVerseGalaxies(galaxies);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new AdminController();
