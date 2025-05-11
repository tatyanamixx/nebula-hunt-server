const ApiError = require('../exceptions/api-error');
const tokenService = require('../service/token-service');

module.exports = function (req, res, next) {
	try {
		const authorizationHeader = req.headers.authorization;
		if (!authorizationHeader) {
			return next(ApiError.UnauthorizedError());
		}
		const spilitAuthHeader = authorizationHeader.split(' ');
		const index = spilitAuthHeader.indexOf('Bearer');
		if (index < 0) {
			return next(ApiError.UnauthorizedError());
		}
		const accessToken = authorizationHeader[index + 1];
		if (!accessToken) {
			return next(ApiError.UnauthorizedError());
		}
		const userData = tokenService.validateRefreshToken(accessToken);
		if (userData) {
			return next(ApiError.UnauthorizedError());
		}
		req.userToken = userData;
		next();
	} catch (err) {
		return next(ApiError.UnauthorizedError());
	}
};
