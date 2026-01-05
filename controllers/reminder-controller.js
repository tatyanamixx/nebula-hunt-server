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

			console.log(`\n📋 ========== GET INACTIVE USERS ==========`);
			console.log(`⏰ Now: ${now.toISOString()}`);
			console.log(`📅 One day ago: ${oneDayAgo.toISOString()}`);
			console.log(`📅 Two days ago: ${twoDaysAgo.toISOString()}`);

			logger.debug("Fetching inactive users for reminders", {
				now: now.toISOString(),
				oneDayAgo: oneDayAgo.toISOString(),
				twoDaysAgo: twoDaysAgo.toISOString(),
			});

			// Debug: Count total users
			const totalUsers = await User.count({ where: { role: "USER", blocked: false } });
			const enabledUsers = await User.count({ where: { role: "USER", blocked: false, reminderEnabled: true } });
			console.log(`👥 Total users: ${totalUsers}`);
			console.log(`✅ Reminder enabled: ${enabledUsers}`);

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
				attributes: ["id", "username", "language", "updatedAt", "lastReminderSentAt"],
				limit: 500, // Limit to prevent overload
			});

			console.log(`📊 Found ${users.length} inactive users for reminders`);
			if (users.length > 0) {
				console.log(`👤 First user:`, {
					id: users[0].id,
					username: users[0].username,
					updatedAt: users[0].updatedAt,
					lastReminderSentAt: users[0].lastReminderSentAt,
					hasUserState: !!users[0].userstate,
					lastLoginDate: users[0].userstate?.lastLoginDate,
				});
			}
			console.log(`📋 ========== GET INACTIVE USERS END ==========\n`);

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
	 * Get all users with reminders enabled (for force sending)
	 */
	async getAllUsersForReminders(req, res, next) {
		try {
			console.log(`\n📋 ========== GET ALL USERS FOR REMINDERS ==========`);

			const users = await User.findAll({
				where: {
					role: "USER",
					blocked: false,
					reminderEnabled: true,
				},
				include: [
					{
						model: UserState,
						attributes: ["lastLoginDate"],
						required: false,
					},
				],
				attributes: ["id", "username", "language"],
				limit: 10000, // High limit for force sending
			});

			console.log(`📊 Found ${users.length} users with reminders enabled`);

			const formattedUsers = users.map((user) => ({
				id: user.id.toString(),
				username: user.username,
				language: user.language || "en",
				lastLogin: user.userstate?.lastLoginDate || null,
			}));

			console.log(`📋 ========== GET ALL USERS END ==========\n`);

			res.json({
				success: true,
				users: formattedUsers,
				count: formattedUsers.length,
			});
		} catch (error) {
			logger.error("Error fetching all users for reminders", {
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
