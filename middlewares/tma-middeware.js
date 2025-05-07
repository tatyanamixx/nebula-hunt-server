const ApiError = require('../exceprtions/api-error');
const { validate } = require('@telegram-apps/init-data-node');
const tma_token = process.env.TG_BOT_API_KEY;

const parseInitData = (initData) => {
	const params = new URLSearchParams(initData);
	return {
		user: JSON.parse(params.get('user')),
		hash: params.get('hash'),
		auth_date: params.get('auth_date'),
		start_param: params.get('start_param'),
		chat_type: params.get('chat_type'),
		chat_instance: params.get('chat_instance'),
		signature: params.get('signature'),
	};
};

module.exports = function (req, res, next) {
	try {
		// console.log('tma-middeware');
		// console.log(req.headers);
		const authorizationHeader = req.headers.authorization;
		if (!authorizationHeader) {
			return next(ApiError.UnauthorizedError());
		}
		// console.log(authorizationHeader);
		const spilitAuthHeader = authorizationHeader.split(' ');
		// console.log(spilitAuthHeader);
		const index = spilitAuthHeader.indexOf('tma');
		// console.log(index);
		if (index < 0) {
			return next(ApiError.UnauthorizedError());
		}
		// console.log(spilitAuthHeader[index + 1]);
		const initData = spilitAuthHeader[index + 1];
		if (!initData) {
			return next(ApiError.UnauthorizedError());
		}
		// console.log(initData);
		try {
			validate(initData, tma_token);
		} catch (err) {
			// console.log('we are here');
			return next(ApiError.TMAuthorizedError(err.message));
		}
		req.user = parseInitData(initData);
		next();
	} catch (err) {
		return next(ApiError.UnthorizedError());
	}
};
