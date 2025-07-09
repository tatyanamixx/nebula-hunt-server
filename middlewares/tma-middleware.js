/**
 * created by Tatyana Mikhniukevich on 01.06.2025
 */
const ApiError = require('../exceptions/api-error');
const { parse, validate } = require('@telegram-apps/init-data-node');
const tma_token = process.env.TG_BOT_API_KEY;
const logger = require('../service/logger-service');

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
		// try {
		// 	validate(initData, tma_token);
		// } catch (err) {
		// 	logger.error('TMA validation error:', err);
		// 	return next(ApiError.TMAuthorizedError('tma: unauthorization'));
		// }

		req.initdata = parse(initData).user;
		logger.info(req.initdata);

		return next();
	} catch (err) {
		logger.error('TMA middleware unexpected error:', err);
		return next(
			ApiError.TMAuthorizedError(
				'tma: unexpected error: ' +
					(err && err.message ? err.message : String(err))
			)
		);
	}
};
