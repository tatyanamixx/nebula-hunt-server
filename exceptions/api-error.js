/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
module.exports = class ApiError extends Error {
	status;
	errors;

	constructor(status, message, errors) {
		super(message);
		this.status = status;
		this.errors = errors;
	}

	static UnauthorizedError(message) {
		return new ApiError(401, message);
	}

	static TMAuthorizedError(message) {
		return new ApiError(401, message);
	}

	static BadRequest(message, errors = []) {
		return new ApiError(400, message, errors);
	}

	static Internal(message) {
		return new ApiError(500, message);
	}

	static Forbidden(message) {
		return new ApiError(403, message);
	}

	static TooManyRequests(message) {
		return new ApiError(429, message);
	}
};
