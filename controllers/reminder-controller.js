/**
 * Reminder Controller
 * Handles reminder notification logic
 */
const { User, UserState } = require("../models/models");
const { Op } = require("sequelize");
const logger = require("../service/logger-service");

class ReminderController {
	/**
	 * Get list of inactive users who need reminders
	 * Users qualify if:
	 * - Not logged in for 24-48 hours
	 * - Reminder is enabled
	 * - No reminder sent in last 24 hours
	 * - Not blocked
	 */
	async getInactiveUsers(req, res, next) {
		try {
			const now = new Date();
			const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
			const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

			logger.debug("Fetching inactive users for reminders", {
				now: now.toISOString(),
				oneDayAgo: oneDayAgo.toISOString(),
				twoDaysAgo: twoDaysAgo.toISOString(),
			});

			// Find users who haven't logged in for 24-48 hours
			const users = await User.findAll({
				where: {
					role: "USER", // Exclude SYSTEM users
					blocked: false,
					reminderEnabled: true,
					[Op.or]: [
						// Users who haven't received a reminder yet and are inactive
						{
							lastReminderSentAt: null,
							updatedAt: {
								[Op.lt]: oneDayAgo,
							},
						},
						// Users who received reminder more than 24 hours ago
						{
							lastReminderSentAt: {
								[Op.lt]: oneDayAgo,
							},
						},
					],
				},
				include: [
					{
						model: UserState,
						attributes: ["lastLoginDate"],
						where: {
							lastLoginDate: {
								[Op.or]: [
									{ [Op.lt]: twoDaysAgo }, // Haven't logged in for 2 days
									{ [Op.is]: null }, // Never logged in
								],
							},
						},
						required: false, // LEFT JOIN
					},
				],
				attributes: ["id", "username", "language"],
				limit: 500, // Limit to prevent overload
			});

			logger.info(`Found ${users.length} inactive users for reminders`);

			// Format response
			const formattedUsers = users.map((user) => ({
				id: user.id.toString(),
				username: user.username,
				language: user.language || "en",
				lastLogin: user.userstate?.lastLoginDate || null,
			}));

			res.json({
				success: true,
				users: formattedUsers,
				count: formattedUsers.length,
				timestamp: now.toISOString(),
			});
		} catch (error) {
			logger.error("Error fetching inactive users", {
				error: error.message,
				stack: error.stack,
			});
			next(error);
		}
	}

	/**
	 * Update last reminder sent timestamp for a user
	 */
	async updateReminderTime(req, res, next) {
		try {
			const { userId } = req.body;

			if (!userId) {
				return res.status(400).json({
					success: false,
					error: "userId is required",
				});
			}

			const numericUserId = BigInt(userId);

			await User.update(
				{
					lastReminderSentAt: new Date(),
				},
				{
					where: { id: numericUserId },
				}
			);

			logger.debug("Updated reminder timestamp", { userId });

			res.json({
				success: true,
				message: "Reminder timestamp updated",
				userId: userId.toString(),
			});
		} catch (error) {
			logger.error("Error updating reminder time", {
				userId: req.body.userId,
				error: error.message,
			});
			next(error);
		}
	}
}

module.exports = new ReminderController();
