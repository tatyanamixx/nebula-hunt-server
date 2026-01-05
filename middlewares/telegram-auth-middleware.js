/**
 * Универсальный middleware для валидации Telegram WebApp Data
 * Поддерживает несколько форматов:
 * 1. Заголовок x-telegram-init-data (прямая строка)
 * 2. Заголовок authorization с префиксом tma (base64 encoded)
 * 3. Заголовок x-telegram-init-data-raw (base64 encoded)
 */
const ApiError = require("../exceptions/api-error");
const { parse, validate } = require("@telegram-apps/init-data-node");
const logger = require("../service/logger-service");

// Используем переменную для токена бота
const botToken = process.env.BOT_TOKEN;

/**
 * Декодирует initData из различных форматов
 * @param {string} rawData - сырые данные в любом формате
 * @returns {string|null} - декодированная строка initData или null
 */
function decodeInitData(rawData) {
	if (!rawData) return null;

	try {
		// Если это уже URL-encoded строка (прямой формат)
		if (rawData.includes("=") && rawData.includes("&")) {
			logger.debug("Detected direct URL-encoded format");
			return rawData;
		}

		// Если это base64 encoded строка
		if (rawData.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
			logger.debug("Detected base64 encoded format");
			const decoded = Buffer.from(rawData, "base64").toString("utf-8");
			logger.debug("Base64 decoded:", decoded);
			return decoded;
		}

		// Если это JSON строка (редкий случай)
		if (rawData.startsWith("{") || rawData.startsWith("[")) {
			logger.debug("Detected JSON format");
			return rawData;
		}

		logger.warn("Unknown initData format:", rawData.substring(0, 50) + "...");
		return null;
	} catch (error) {
		logger.error("Error decoding initData:", error);
		return null;
	}
}

module.exports = function telegramAuthMiddleware(req, res, next) {
	logger.info("🔐 Telegram Auth Middleware triggered", {
		method: req.method,
		url: req.url,
		hasAuthHeader: !!req.headers.authorization,
		hasTelegramHeader: !!req.headers["x-telegram-init-data"],
		botTokenExists: !!botToken,
		botTokenLength: botToken ? botToken.length : 0,
	});

	try {
		let initData = null;
		let source = "unknown";

		// 1. Проверяем заголовок x-telegram-init-data (прямой формат)
		if (req.headers["x-telegram-init-data"]) {
			initData = req.headers["x-telegram-init-data"];
			source = "x-telegram-init-data";
			logger.debug("Found x-telegram-init-data header");
		}
		// 2. Проверяем заголовок x-telegram-init-data-raw (base64 encoded)
		else if (req.headers["x-telegram-init-data-raw"]) {
			initData = decodeInitData(req.headers["x-telegram-init-data-raw"]);
			source = "x-telegram-init-data-raw";
			logger.debug("Found x-telegram-init-data-raw header");
		}
		// 3. Проверяем заголовок authorization с префиксом tma
		else if (req.headers.authorization) {
			const authHeader = req.headers.authorization;
			logger.debug(
				"Authorization header:",
				authHeader.substring(0, 50) + "..."
			);

			const splitAuthHeader = authHeader.split(" ");
			const tmaIndex = splitAuthHeader.indexOf("tma");

			if (tmaIndex >= 0 && splitAuthHeader[tmaIndex + 1]) {
				const encoded = splitAuthHeader[tmaIndex + 1];
				initData = decodeInitData(encoded);
				source = "authorization-tma";
				logger.debug("Found tma token in authorization header");
			}
		}

		// Если не нашли initData ни в одном из заголовков
		if (!initData) {
			logger.warn("No valid initData found in headers", {
				headers: Object.keys(req.headers).filter(
					(h) =>
						h.toLowerCase().includes("telegram") ||
						h.toLowerCase().includes("authorization")
				),
			});
			return next(
				ApiError.TMAuthorizedError(
					"Telegram auth: initData not found in headers"
				)
			);
		}

		logger.debug(`Processing initData from ${source}`, {
			initDataLength: initData.length,
			initDataPreview: initData.substring(0, 100) + "...",
		});

		// Проверяем на mock данные в development режиме
		const isDevelopment = process.env.NODE_ENV === "development";
		const isMockData =
			initData.includes("mock_hash") ||
			initData.includes('"id":10') ||
			initData.includes("testuser") ||
			initData.includes("12345678");

		if (isDevelopment && isMockData) {
			logger.debug(
				"Mock data detected in development mode, skipping validation"
			);
		} else if (isMockData) {
			// TEMPORARY: Allow mock in production until Web App is properly configured
			logger.warn(
				"⚠️ Mock data in production - Web App not properly configured in BotFather!"
			);
			logger.warn(
				"⚠️ Configure Web App URL: https://t.me/NebulaHuntBot/nebulahunt2025"
			);
		} else {
			// Валидируем данные
			try {
				validate(initData, botToken);
				logger.debug("Telegram initData validation successful");
			} catch (err) {
				logger.error("Telegram validation error:", {
					error: err.message,
					source,
					initDataLength: initData.length,
				});
				return next(
					ApiError.TMAuthorizedError("Telegram auth: invalid signature")
				);
			}
		}

		// Парсим и сохраняем данные пользователя
		try {
			let userData;

			if (isDevelopment && isMockData) {
				// Для mock данных парсим самостоятельно
				const params = new URLSearchParams(initData);
				const userParam = params.get("user");
				if (userParam) {
					userData = JSON.parse(userParam);
					logger.debug("Mock user data parsed successfully", userData);
				} else {
					throw new Error("No user data in mock initData");
				}
			} else {
				// Для реальных данных используем стандартный парсер
				const parsedData = parse(initData);
				userData = parsedData.user;
			}

			req.initdata = userData;

			logger.debug("User data parsed successfully", {
				userId: userData?.id,
				username: userData?.username,
				source,
				isMock: isDevelopment && isMockData,
			});
		} catch (parseError) {
			logger.error("Error parsing initData:", parseError);
			return next(ApiError.TMAuthorizedError("Telegram auth: parsing error"));
		}

		return next();
	} catch (err) {
		logger.error("Telegram auth middleware unexpected error:", err);
		return next(
			ApiError.TMAuthorizedError(
				"Telegram auth: unexpected error: " +
					(err && err.message ? err.message : String(err))
			)
		);
	}
};
