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

			console.log(`\n🚀 ========== TRIGGER REMINDERS START ==========`);
			console.log(`👤 Admin ID: ${req.user?.id || "unknown"}`);
			console.log(`🌐 Origin: ${req.headers.origin || "none"}`);
			console.log(`🔑 Auth: ${req.headers.authorization ? "YES" : "NO"}`);
			console.log(`⚡ Force mode: ${force}`);
			console.log(`👥 User IDs: ${userIds ? JSON.stringify(userIds) : "all"}`);

			logger.info("Admin manually triggered reminders", {
				adminId: req.user?.id || "unknown",
				force,
				userIds,
			});

			const BOT_URL = process.env.BOT_URL || "https://bot.nebulahunt.site";
			const REMINDER_SECRET_RAW = process.env.REMINDER_SECRET;
			const REMINDER_SECRET = sanitizeSecret(REMINDER_SECRET_RAW);

			console.log(`🤖 BOT_URL: ${BOT_URL}`);
			console.log(
				`🔐 REMINDER_SECRET: ${REMINDER_SECRET ? "SET" : "NOT SET"}`
			);

			if (!REMINDER_SECRET) {
				console.error(`❌ REMINDER_SECRET not configured!`);
				throw ApiError.withCode(
					500,
					"REMINDER_SECRET is not configured",
					ERROR_CODES.SYSTEM.INTERNAL_SERVER_ERROR
				);
			}

			console.log(`📡 Calling bot: ${BOT_URL}/api/trigger-reminders`);
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

			console.log(`✅ Bot response:`, response.data);

			logger.info("Reminders triggered successfully", {
				adminId: req.user?.id || "unknown",
				result: response.data,
			});

			console.log(`✅ Sending success response to admin`);
			res.json({
				success: true,
				message: "Reminders sent successfully",
				data: response.data,
			});
			console.log(
				`🚀 ========== TRIGGER REMINDERS END (SUCCESS) ==========\n`
			);
		} catch (error) {
			console.error(`\n❌ ========== TRIGGER REMINDERS ERROR ==========`);
			console.error(`Error message: ${error.message}`);
			console.error(`Error code: ${error.code}`);
			console.error(`Error response:`, error.response?.data);
			console.error(`Error stack:`, error.stack);
			console.error(`❌ ========== ERROR END ==========\n`);

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
				showOpenGameButton = false,
				showCommunityButton = false,
			} = req.body;

			console.log(`\n📨 ========== SEND CUSTOM NOTIFICATION ==========`);
			console.log(`👤 Admin ID: ${req.user?.id || "unknown"}`);
			console.log(`💬 Message: ${message}`);
			console.log(
				`👥 User IDs: ${
					userIds === null ? "ALL USERS" : userIds?.length || 0
				} users`
			);
			console.log(`🎮 Open Game button: ${showOpenGameButton}`);
			console.log(`💬 Community button: ${showCommunityButton}`);

			if (!message || !message.trim()) {
				return next(
					ApiError.withCode(
						400,
						"Message is required",
						ERROR_CODES.VALIDATION.INVALID_INPUT
					)
				);
			}

			// If userIds is null, get all users
			let finalUserIds = userIds;
			if (userIds === null || userIds === undefined) {
				console.log(`📋 Fetching all users from database...`);
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
				console.log(`✅ Found ${finalUserIds.length} users to notify`);
			} else if (!Array.isArray(userIds) || userIds.length === 0) {
				return next(
					ApiError.withCode(
						400,
						"User IDs must be null (for all users) or a non-empty array",
						ERROR_CODES.VALIDATION.INVALID_INPUT
					)
				);
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

			console.log(`📡 Calling bot: ${BOT_URL}/api/send-custom-notification`);
			console.log(`👥 Sending to ${finalUserIds.length} users`);

			const response = await axios.post(
				`${BOT_URL}/api/send-custom-notification`,
				{
					secret: REMINDER_SECRET,
					message: message.trim(),
					userIds: finalUserIds,
					showOpenGameButton,
					showCommunityButton,
				},
				{
					timeout: 300000, // 5 minutes for all users
					headers: { "Content-Type": "application/json" },
				}
			);

			console.log(`✅ Bot response:`, response.data);
			console.log(`📨 ========== SEND CUSTOM NOTIFICATION END ==========\n`);

			logger.info("Custom notification sent successfully", {
				adminId: req.user?.id || "unknown",
				userCount: finalUserIds.length,
			});

			res.json({
				success: true,
				message: "Custom notification sent successfully",
				data: response.data,
			});
		} catch (error) {
			console.error(`\n❌ ========== CUSTOM NOTIFICATION ERROR ==========`);
			console.error(`Error: ${error.message}`);
			console.error(`❌ ========== ERROR END ==========\n`);

			logger.error("Failed to send custom notification", {
				adminId: req.user?.id || "unknown",
				error: error.message,
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
