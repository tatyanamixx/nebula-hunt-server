const ApiError = require('../exceptions/api-error');
const { User } = require('../models/models');

module.exports = async function (req, res, next) {
	try {
		const id = req.tmaInitdata.id;
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
			return next(
				ApiError.ForbiddenError('Access denied. Admin role required')
			);
		}
		next();
	} catch (err) {
		return next(ApiError.UnauthorizedError('Admin authorization error'));
	}
};
