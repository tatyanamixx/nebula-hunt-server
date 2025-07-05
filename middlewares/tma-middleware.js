/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const ApiError = require('../exceptions/api-error');
const { parse, validate } = require('@telegram-apps/init-data-node');
const tma_token = process.env.TG_BOT_API_KEY;

module.exports = function (req, res, next) {
	try {
		const authorizationHeader = req.headers.authorization;
		if (!authorizationHeader) {
			return next(ApiError.TMAuthorizedError('tma: headers not found'));
		}
		const splitAuthHeader = authorizationHeader.split(' ');
		const index = splitAuthHeader.indexOf('tma');
		if (index < 0) {
			return next(ApiError.TMAuthorizedError('tma: not tma key word'));
		}
		const initData = splitAuthHeader[index + 1];

		if (!initData) {
			return next(ApiError.TMAuthorizedError('tma: not found initdata'));
		}
		try {
			validate(initData, tma_token);
		} catch (err) {
			next(ApiError.TMAuthorizedError('tma: unauthorization'));
		}

		req.initdata = parse(initData).user;

		next();
	} catch (err) {
		return next(ApiError.TMAuthorizedError('tma:', err.message));
	}
};
