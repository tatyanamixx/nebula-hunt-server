const ApiError = require('../exceptions/api-error');
const tokenService = require('../service/token-service');

module.exports = function (req, res, next) {
	try {
		const authorizationHeader = req.headers.authorization;
		if (!authorizationHeader) {
			return next(
				ApiError.UnauthorizedError('JWT: not found headers auth ')
			);
		}
		const spilitAuthHeader = authorizationHeader.split(' ');
		const index = spilitAuthHeader.indexOf('Bearer');
		if (index < 0) {
			return next(
				ApiError.UnauthorizedError('JWT: not found key word Bearer')
			);
		}
		const accessToken = spilitAuthHeader[index + 1];
		if (!accessToken) {
			return next(
				ApiError.UnauthorizedError('JWT: not found access token')
			);
		}
		const userData = tokenService.validateAccessToken(accessToken);

		if (!userData) {
			return next(ApiError.UnauthorizedError('JWT: validator error'));
		}
		req.userToken = userData;
		next();
	} catch (err) {
		return next(ApiError.UnauthorizedError('JWT: unauthorization'));
	}
};
