/**
 * Admin JWT Authentication Middleware
 * created by Claude on 26.07.2025
 */
const jwt = require("jsonwebtoken");
const ApiError = require("../exceptions/api-error");
const tokenService = require("../service/token-service");
const { Admin } = require("../models/models");
const logger = require("../service/logger-service");

module.exports = async function adminAuthMiddleware(req, res, next) {
	try {
		// DEBUG: Log all headers for debugging
		console.log("🔐 Admin Auth Middleware - Request received for:", req.url);
		console.log("🔐 Admin Auth Middleware - Method:", req.method);
		console.log("🔐 Admin Auth Middleware - Request headers:", {
			authorization: req.headers.authorization ? "present" : "missing",
			authorizationPreview: req.headers.authorization
				? req.headers.authorization.substring(0, 50) + "..."
				: "none",
			userAgent: req.get("User-Agent"),
			ip: req.ip,
			url: req.url,
			method: req.method,
		});

		// Проверяем наличие заголовка Authorization
		const authorizationHeader = req.headers.authorization;
		if (!authorizationHeader) {
			logger.warn("Admin JWT: Authorization header not found", {
				ip: req.ip,
				userAgent: req.get("User-Agent"),
			});
			return next(
				ApiError.UnauthorizedError(
					"Admin JWT: Authorization header required"
				)
			);
		}

		// Парсим заголовок Authorization
		const splitAuthHeader = authorizationHeader.split(" ");
		const bearerIndex = splitAuthHeader.indexOf("Bearer");

		if (bearerIndex < 0) {
			logger.warn(
				"Admin JWT: Bearer scheme not found in Authorization header",
				{
					ip: req.ip,
					header: authorizationHeader.substring(0, 50) + "...",
				}
			);
			return next(
				ApiError.UnauthorizedError("Admin JWT: Bearer scheme required")
			);
		}

		const accessToken = splitAuthHeader[bearerIndex + 1];
		if (!accessToken) {
			logger.warn("Admin JWT: Access token not found after Bearer", {
				ip: req.ip,
			});
			return next(
				ApiError.UnauthorizedError("Admin JWT: Access token required")
			);
		}

		// Валидируем access token
		let userData;
		try {
			console.log("🔐 Admin Auth Middleware - Validating token:", {
				tokenPreview: accessToken.substring(0, 50) + "...",
				tokenLength: accessToken.length,
			});

			userData = tokenService.validateAccessToken(accessToken);

			console.log("🔐 Admin Auth Middleware - Token validation result:", {
				userData: userData ? "valid" : "null",
				userId: userData?.id,
				userEmail: userData?.email,
			});
		} catch (error) {
			logger.warn("Admin JWT: Token validation failed", {
				ip: req.ip,
				error: error.message,
			});

			if (error instanceof jwt.TokenExpiredError) {
				return next(ApiError.TokenExpired("Admin JWT: Token expired"));
			}
			if (error instanceof jwt.JsonWebTokenError) {
				return next(ApiError.UnauthorizedError("Admin JWT: Invalid token"));
			}

			return next(
				ApiError.UnauthorizedError("Admin JWT: Token validation failed")
			);
		}

		if (!userData) {
			logger.warn("Admin JWT: Token validation returned null", {
				ip: req.ip,
			});
			return next(ApiError.UnauthorizedError("Admin JWT: Invalid token"));
		}

		// Проверяем структуру payload
		if (!userData.id) {
			logger.warn("Admin JWT: Invalid token payload - missing user ID", {
				ip: req.ip,
				payload: userData,
			});
			return next(
				ApiError.UnauthorizedError(
					"Admin JWT: Invalid token payload - missing user ID"
				)
			);
		}

		// Преобразуем id в число для проверки
		const userId = Number(userData.id);
		if (isNaN(userId) || userId <= 0) {
			logger.warn(
				"Admin JWT: Invalid token payload - user ID must be a positive number",
				{
					ip: req.ip,
					payload: userData,
					userId: userData.id,
				}
			);
			return next(
				ApiError.UnauthorizedError(
					"Admin JWT: Invalid token payload - user ID must be a positive number"
				)
			);
		}

		// Проверяем администратора в базе данных
		try {
			const admin = await Admin.findOne({ where: { id: userId } });

			if (!admin) {
				logger.warn("Admin JWT: Admin not found in database", {
					ip: req.ip,
					userId: userId,
				});
				return next(
					ApiError.UnauthorizedError("Admin JWT: Admin not found")
				);
			}

			// Проверяем, что пользователь является администратором или супервайзером
			if (admin.role !== "ADMIN" && admin.role !== "SUPERVISOR") {
				logger.warn(
					"Admin JWT: Non-admin user attempted to access admin route",
					{
						ip: req.ip,
						userId: userId,
						userRole: admin.role,
					}
				);
				return next(ApiError.Forbidden("Admin JWT: Admin role required"));
			}

			// Проверяем блокировку администратора
			if (admin.blocked) {
				logger.warn(
					"Admin JWT: Blocked admin attempted to access admin route",
					{
						ip: req.ip,
						userId: userId,
					}
				);
				return next(ApiError.Forbidden("Admin JWT: Account is blocked"));
			}

			// Добавляем данные администратора в request
			req.user = admin;
			req.userToken = { ...userData, id: userId };

			logger.debug("Admin JWT: Authentication successful", {
				ip: req.ip,
				userId: userId,
				email: admin.email,
				role: admin.role,
			});

			next();
		} catch (dbError) {
			logger.error("Admin JWT: Database error during user lookup", {
				ip: req.ip,
				userId: userId,
				error: dbError.message,
			});
			return next(ApiError.Internal("Admin JWT: Database error"));
		}
	} catch (error) {
		logger.error("Admin JWT: Unexpected error in auth middleware", {
			ip: req.ip,
			error: error.message,
			stack: error.stack,
		});
		return next(ApiError.Internal("Admin JWT: Authentication error"));
	}
};
