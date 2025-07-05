/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
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

		const splitAuthHeader = authorizationHeader.split(' ');
		const index = splitAuthHeader.indexOf('Bearer');
		if (index < 0) {
			return next(
				ApiError.UnauthorizedError('JWT: not found key word Bearer')
			);
		}

		const accessToken = splitAuthHeader[index + 1];
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
		console.log('userToken', userData);
		next();
	} catch (err) {
		return next(ApiError.UnauthorizedError('JWT: unauthorization'));
	}
};
