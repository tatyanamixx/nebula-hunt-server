/**
 * created by Tatyana Mikhniukevich on 05.05.2025
 * updated by Claude on 23.07.2025
 */
const {
	ERROR_CODES,
	ERROR_DESCRIPTIONS,
	ERROR_SEVERITY_MAPPING,
} = require('../config/error-codes');

module.exports = class ApiError extends Error {
	status;
	errors;
	errorCode;
	severity;

	constructor(
		status,
		message,
		errors = [],
		errorCode = null,
		severity = null
	) {
		super(message);
		this.status = status;
		this.errors = errors;
		this.errorCode = errorCode;
		this.severity =
			severity || (errorCode ? ERROR_SEVERITY_MAPPING[errorCode] : null);
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

	// Новые методы с поддержкой кодов ошибок
	static UserNotFound(message = 'User not found') {
		return new ApiError(404, message, [], ERROR_CODES.AUTH.USER_NOT_FOUND);
	}

	static UserAlreadyExists(message = 'User already exists') {
		return new ApiError(
			409,
			message,
			[],
			ERROR_CODES.AUTH.USER_ALREADY_EXISTS
		);
	}

	static InvalidToken(message = 'Invalid authentication token') {
		return new ApiError(401, message, [], ERROR_CODES.AUTH.INVALID_TOKEN);
	}

	static TokenExpired(message = 'Authentication token has expired') {
		return new ApiError(401, message, [], ERROR_CODES.AUTH.TOKEN_EXPIRED);
	}

	static UserBlocked(message = 'User account is blocked') {
		return new ApiError(403, message, [], ERROR_CODES.AUTH.USER_BLOCKED);
	}

	static InvalidGalaxyData(message = 'Invalid galaxy data provided') {
		return new ApiError(
			400,
			message,
			[],
			ERROR_CODES.VALIDATION.INVALID_GALAXY_DATA
		);
	}

	static GalaxyNotFound(message = 'Galaxy not found') {
		return new ApiError(
			404,
			message,
			[],
			ERROR_CODES.GALAXY.GALAXY_NOT_FOUND
		);
	}

	static GalaxyAlreadyExists(
		message = 'Galaxy with this seed already exists'
	) {
		return new ApiError(
			409,
			message,
			[],
			ERROR_CODES.GALAXY.GALAXY_ALREADY_EXISTS
		);
	}

	static DuplicateGalaxySeed(message = 'Duplicate galaxy seed detected') {
		return new ApiError(
			409,
			message,
			[],
			ERROR_CODES.GALAXY.DUPLICATE_SEED
		);
	}

	static GalaxyNotOwned(message = 'Galaxy is not owned by the user') {
		return new ApiError(
			403,
			message,
			[],
			ERROR_CODES.GALAXY.GALAXY_NOT_OWNED
		);
	}

	static InsufficientStars(
		message = 'Insufficient stars for this operation'
	) {
		return new ApiError(
			400,
			message,
			[],
			ERROR_CODES.GALAXY.INSUFFICIENT_STARS
		);
	}

	static InvalidOfferData(message = 'Invalid offer data provided') {
		return new ApiError(
			400,
			message,
			[],
			ERROR_CODES.VALIDATION.INVALID_OFFER_DATA
		);
	}

	static MissingRequiredFields(
		message = 'Missing required fields in request'
	) {
		return new ApiError(
			400,
			message,
			[],
			ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
		);
	}

	static DatabaseError(message = 'Database operation failed') {
		return new ApiError(
			500,
			message,
			[],
			ERROR_CODES.SYSTEM.DATABASE_ERROR
		);
	}

	static ConfigurationError(message = 'Configuration error') {
		return new ApiError(
			500,
			message,
			[],
			ERROR_CODES.SYSTEM.CONFIGURATION_ERROR
		);
	}

	// Универсальный метод для создания ошибки с кодом
	static withCode(status, message, errorCode, errors = []) {
		return new ApiError(status, message, errors, errorCode);
	}

	// Метод для получения описания ошибки по коду
	static getDescription(errorCode) {
		return ERROR_DESCRIPTIONS[errorCode] || 'Unknown error';
	}

	// Метод для проверки существования кода ошибки
	static isValidCode(errorCode) {
		return errorCode in ERROR_DESCRIPTIONS;
	}
};
