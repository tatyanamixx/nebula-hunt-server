/**
 * Admin Reminder Controller
 * Allows admins to manually trigger reminder notifications
 */
const axios = require("axios");
const logger = require("../service/logger-service");
const ApiError = require("../exceptions/api-error");
const { ERROR_CODES } = require("../config/error-codes");

class AdminReminderController {
	/**
	 * Manually trigger reminder notifications
	 * Only accessible by admins
	 */
	async triggerReminders(req, res, next) {
		try {
			logger.info("Admin manually triggered reminders", {
				adminId: req.user?.id || "unknown",
			});

			const BOT_URL = process.env.BOT_URL || "https://bot.nebulahunt.site";
			const REMINDER_SECRET = process.env.REMINDER_SECRET;

			if (!REMINDER_SECRET) {
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
				stack: error.stack,
			});

			if (error.response) {
				// Bot returned an error
				return next(
					ApiError.withCode(
						500,
						`Bot returned error: ${error.response.data?.error || error.message}`,
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
					disabled: stats.find((s) => !s.reminderEnabled)?.get("count") || 0,
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

