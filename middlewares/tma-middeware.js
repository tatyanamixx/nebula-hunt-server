const ApiError = require('../exceptions/api-error');
const {
	validate3rd,
	parse,
	validate,
	isValid,
	isValid3rd,
} = require('@telegram-apps/init-data-node');
const tma_token = process.env.TG_BOT_API_KEY;

module.exports = function (req, res, next) {
	try {
		const authorizationHeader = req.headers.authorization;
		if (!authorizationHeader) {
			return next(ApiError.UnauthorizedError());
		}
		const splitAuthHeader = authorizationHeader.split(' ');
		const index = splitAuthHeader.indexOf('tma');
		if (index < 0) {
			return next(ApiError.UnauthorizedError());
		}
		const initData = splitAuthHeader[index + 1];
		if (!initData) {
			return next(ApiError.UnauthorizedError());
		}
		const botId = parse(initData).chat_instance;
		try {
			validate(initData, tma_token);
		} catch (err) {
			next(ApiError.TMAuthorizedError(err.message));
		}

		// if (!isValid(initData, tma_token))
		// 	throw next(ApiError.TMAuthorizedError(err.message));

		req.tmaInitdata = parse(initData).user;
		next();
	} catch (err) {
		return next(ApiError.UnthorizedError());
	}
};
