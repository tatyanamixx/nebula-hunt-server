/**
 * created by Tatyana Mikhniukevich on 23.05.2025
 */
const ApiError = require('../exceptions/api-error');
const { User } = require('../models/models');
const logger = require('../service/logger-service');

module.exports = async function (req, res, next) {
	try {
		const id = req.userToken?.id;
		if (!id) {
			return next(
				ApiError.UnauthorizedError('User ID not found in token')
			);
		}

		const user = await User.findOne({ where: { id } });
		if (!user) {
			return next(ApiError.UnauthorizedError('User not found'));
		}

		if (user.role !== 'ADMIN') {
			logger.warn(
				'Access denied: non-admin user tried to access admin route',
				{ id }
			);
			return next(
				ApiError.ForbiddenError('Access denied. Admin role required')
			);
		}

		if (user.blocked) {
			logger.warn(
				'Access denied: blocked admin tried to access admin route',
				{ id }
			);
			return next(
				ApiError.ForbiddenError('Access denied. Account is blocked')
			);
		}

		next();
	} catch (err) {
		logger.error('Admin middleware error:', err);
		return next(ApiError.UnauthorizedError('Admin authorization error'));
	}
};
