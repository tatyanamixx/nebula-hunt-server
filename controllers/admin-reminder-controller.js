/**
 * Admin Reminder Controller
 * Allows admins to manually trigger reminder notifications
 */
const axios = require("axios");
const logger = require("../service/logger-service");
const ApiError = require("../exceptions/api-error");
const { ERROR_CODES } = require("../config/error-codes");

// Helper function to sanitize secret value
// Removes all control characters and invalid characters
// Note: HTTP headers should ideally contain only ASCII characters
function sanitizeSecret(value) {
	if (!value) return "";
	let sanitized = String(value)
		.trim()
		.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")
		.replace(/[\r\n]/g, "");

	// Check for non-ASCII characters and warn
	// HTTP headers with non-ASCII may cause issues with some clients/servers
	const hasNonASCII = /[^\x20-\x7E]/.test(sanitized);
	if (hasNonASCII) {
		logger.warn(
			`⚠️ WARNING: REMINDER_SECRET contains non-ASCII characters. This may cause issues with HTTP headers. Consider using only ASCII characters (a-z, A-Z, 0-9, and common symbols).`
		);
	}

	return sanitized;
}

class AdminReminderController {
	/**
	 * Manually trigger reminder notifications
	 * Only accessible by admins
	 */
	async triggerReminders(req, res, next) {
		try {
			const { force = false, userIds = null } = req.body;

			logger.info("Admin manually triggered reminders", {
				adminId: req.user?.id || "unknown",
				force,
				userIds,
			});

			const BOT_URL = process.env.BOT_URL || "https://bot.nebulahunt.site";
			const REMINDER_SECRET_RAW = process.env.REMINDER_SECRET;
			const REMINDER_SECRET = sanitizeSecret(REMINDER_SECRET_RAW);

			if (!REMINDER_SECRET) {
				logger.error("REMINDER_SECRET not configured!");
				throw ApiError.withCode(
					500,
					"REMINDER_SECRET is not configured",
					ERROR_CODES.SYSTEM.INTERNAL_SERVER_ERROR
				);
			}

			// Call bot's trigger endpoint
			const response = await axios.post(
				`${BOT_URL}/api/trigger-reminders`,
				{
					secret: REMINDER_SECRET,
					force: force,
					userIds: userIds,
				},
				{
					timeout: 30000,
					headers: { "Content-Type": "application/json" },
				}
			);

			logger.info("Reminders triggered successfully", {
				adminId: req.user?.id || "unknown",
				result: response.data,
			});

			res.json({
				success: true,
				message: "Reminders sent successfully",
				data: response.data,
			});
		} catch (error) {
			logger.error("Failed to trigger reminders", {
				adminId: req.user?.id || "unknown",
				error: error.message,
				errorCode: error.code,
				errorResponse: error.response?.data,
			});

			logger.error("Failed to trigger reminders", {
				adminId: req.user?.id || "unknown",
				error: error.message,
				stack: error.stack,
			});

			if (error.response) {
				// Bot returned an error
				return next(
					ApiError.withCode(
						500,
						`Bot returned error: ${
							error.response.data?.error || error.message
						}`,
						ERROR_CODES.SYSTEM.INTERNAL_SERVER_ERROR
					)
				);
			}

			next(
				ApiError.withCode(
					500,
					`Failed to trigger reminders: ${error.message}`,
					ERROR_CODES.SYSTEM.INTERNAL_SERVER_ERROR
				)
			);
		}
	}

	/**
	 * Send custom notification to specified users
	 */
	async sendCustomNotification(req, res, next) {
		try {
			const {
				message,
				userIds,
				showOpenGameButton,
				showCommunityButton,
			} = req.body;

			// Convert string booleans from FormData to actual booleans
			const showOpenGame = showOpenGameButton === true || showOpenGameButton === "true";
			const showCommunity = showCommunityButton === true || showCommunityButton === "true";

			// Get file from multer if uploaded
			const photoFile = req.file;

			if (!message || !message.trim()) {
				return next(
					ApiError.withCode(
						400,
						"Message is required",
						ERROR_CODES.VALIDATION.INVALID_INPUT
					)
				);
			}

			// Parse userIds if it's a JSON string (from FormData)
			let parsedUserIds = userIds;
			if (typeof userIds === "string") {
				try {
					parsedUserIds = JSON.parse(userIds);
				} catch (e) {
					// If parsing fails, treat as null (send to all)
					parsedUserIds = null;
				}
			}

			// If parsedUserIds is null or undefined, get all users
			let finalUserIds = parsedUserIds;
			if (parsedUserIds === null || parsedUserIds === undefined) {
				const { User } = require("../models/models");
				const allUsers = await User.findAll({
					where: {
						role: "USER",
						blocked: false,
					},
					attributes: ["id"],
					limit: 50000, // High limit for all users
				});

				finalUserIds = allUsers.map((user) => user.id.toString());
				logger.info(
					`Fetched ${finalUserIds.length} users for custom notification`
				);
			} else if (!Array.isArray(parsedUserIds) || parsedUserIds.length === 0) {
				return next(
					ApiError.withCode(
						400,
						"User IDs must be null (for all users) or a non-empty array",
						ERROR_CODES.VALIDATION.INVALID_INPUT
					)
				);
			} else {
				// parsedUserIds is a valid array, use it
				finalUserIds = parsedUserIds;
			}

			const BOT_URL = process.env.BOT_URL || "https://bot.nebulahunt.site";
			const REMINDER_SECRET_RAW = process.env.REMINDER_SECRET;
			const REMINDER_SECRET = sanitizeSecret(REMINDER_SECRET_RAW);

			if (!REMINDER_SECRET) {
				throw ApiError.withCode(
					500,
					"REMINDER_SECRET is not configured",
					ERROR_CODES.SYSTEM.INTERNAL_SERVER_ERROR
				);
			}

			// Use FormData if file is present, otherwise JSON
			let response;
			if (photoFile) {
				const FormData = require("form-data");
				const formData = new FormData();
				formData.append("secret", REMINDER_SECRET);
				formData.append("message", message.trim());
				formData.append("userIds", JSON.stringify(finalUserIds));
				formData.append("showOpenGameButton", showOpenGame);
				formData.append("showCommunityButton", showCommunity);
				formData.append("photo", photoFile.buffer, {
					filename: photoFile.originalname,
					contentType: photoFile.mimetype,
				});

				response = await axios.post(
					`${BOT_URL}/api/send-custom-notification`,
					formData,
					{
						timeout: 300000, // 5 minutes for all users
						headers: formData.getHeaders(),
					}
				);
			} else {
				response = await axios.post(
					`${BOT_URL}/api/send-custom-notification`,
					{
						secret: REMINDER_SECRET,
						message: message.trim(),
						userIds: finalUserIds,
						showOpenGameButton: showOpenGame,
						showCommunityButton: showCommunity,
					},
					{
						timeout: 300000, // 5 minutes for all users
						headers: { "Content-Type": "application/json" },
					}
				);
			}

			logger.info("Custom notification sent successfully", {
				adminId: req.user?.id || "unknown",
				userCount: finalUserIds.length,
				result: response.data,
			});

			res.json({
				success: true,
				message: "Custom notification sent successfully",
				data: response.data,
			});
		} catch (error) {
			logger.error("Failed to send custom notification", {
				adminId: req.user?.id || "unknown",
				error: error.message,
				errorResponse: error.response?.data,
			});

			if (error.response) {
				return next(
					ApiError.withCode(
						500,
						`Bot returned error: ${
							error.response.data?.error || error.message
						}`,
						ERROR_CODES.SYSTEM.INTERNAL_SERVER_ERROR
					)
				);
			}

			next(
				ApiError.withCode(
					500,
					`Failed to send custom notification: ${error.message}`,
					ERROR_CODES.SYSTEM.INTERNAL_SERVER_ERROR
				)
			);
		}
	}

	/**
	 * Get reminder statistics
	 */
	async getReminderStats(req, res, next) {
		try {
			const { User } = require("../models/models");
			const { Op } = require("sequelize");

			const now = new Date();
			const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

			// Count users by reminder status
			const stats = await User.findAll({
				attributes: [
					"reminderEnabled",
					[User.sequelize.fn("COUNT", User.sequelize.col("id")), "count"],
				],
				where: {
					role: "USER",
				},
				group: ["reminderEnabled"],
			});

			// Count users who received reminder in last 24h
			const recentlyNotified = await User.count({
				where: {
					role: "USER",
					lastReminderSentAt: {
						[Op.gte]: oneDayAgo,
					},
				},
			});

			// Count users who never received reminder
			const neverNotified = await User.count({
				where: {
					role: "USER",
					lastReminderSentAt: null,
				},
			});

			res.json({
				success: true,
				stats: {
					enabled: stats.find((s) => s.reminderEnabled)?.get("count") || 0,
					disabled:
						stats.find((s) => !s.reminderEnabled)?.get("count") || 0,
					recentlyNotified,
					neverNotified,
					lastCheck: now.toISOString(),
				},
			});
		} catch (error) {
			logger.error("Failed to get reminder stats", {
				error: error.message,
			});
			next(error);
		}
	}
}

module.exports = new AdminReminderController();
