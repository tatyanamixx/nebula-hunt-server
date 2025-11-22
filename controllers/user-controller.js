/**
 * created by Tatyana Mikhniukevich on 01.06.2025
 */
const userService = require("../service/user-service");
const { validationResult } = require("express-validator");
const ApiError = require("../exceptions/api-error");
const logger = require("../service/logger-service");
const { ERROR_CODES } = require("../config/error-codes");

class UserController {
	async login(req, res, next) {
		try {
			const id = req.initdata.id;
			const username = req.initdata.username;
			const language = req.initdata.language_code || "en"; // Extract language from Telegram

			let { referral, galaxy } = req.body;

			// Валидация referral (если предоставлен)
			if (referral !== undefined && referral !== null) {
				if (typeof referral === "string") {
					try {
						referral = BigInt(referral);
					} catch {
						return next(
							ApiError.withCode(
								400,
								"Referral must be a number, bigint, or numeric string",
								ERROR_CODES.VALIDATION.INVALID_REFERRAL
							)
						);
					}
				} else if (
					typeof referral !== "number" &&
					typeof referral !== "bigint"
				) {
					return next(
						ApiError.withCode(
							400,
							"Referral must be a number, bigint, or numeric string",
							ERROR_CODES.VALIDATION.INVALID_REFERRAL
						)
					);
				}
			}

			// Если referral не предоставлен, устанавливаем в null
			if (referral === undefined) {
				referral = null;
			}

		logger.debug("User login/registration", {
			userId: id,
			username,
			referral: referral || "not provided",
			hasGalaxy: !!galaxy,
			language,
		});

		const result = await userService.login(id, username, referral, galaxy, language);
			logger.debug("User login result", { result });

			res.cookie("refreshToken", result.data.auth.refreshToken, {
				maxAge: 30 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			});
			return res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async refresh(req, res, next) {
		try {
			// Используем refresh token из middleware (уже валидирован)
			const refreshToken = req.refreshToken;
			const userData = await userService.refresh(refreshToken);

			// Устанавливаем новый refresh token в cookies
			res.cookie("refreshToken", userData.data.auth.refreshToken, {
				maxAge: 30 * 24 * 60 * 60 * 1000,
				httpOnly: true,
				secure: process.env.NODE_ENV === "production", // HTTPS только в production
				sameSite: "strict", // Защита от CSRF
			});

			logger.debug("Token refresh successful", {
				userId: req.refreshTokenData?.id,
				ip: req.ip,
			});

			return res.json(userData);
		} catch (e) {
			logger.error("Token refresh failed", {
				userId: req.refreshTokenData?.id,
				ip: req.ip,
				error: e.message,
			});
			next(e);
		}
	}

	async getFriends(req, res, next) {
		try {
			const id = req.initdata.id;
			const friends = await userService.getFriends(id);
			return res.json(friends);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new UserController();
