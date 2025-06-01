const { UserAchievement, Achievement } = require('../models/models');
const sequelize = require('../db');

const ApiError = require('../exceptions/api-error');
const { where } = require('sequelize');
const loggerService = require('./logger-service');

class AchievementService {
	async createAchievements(achievements) {
		const t = await sequelize.transaction();

		try {
			const createdAchievements = [];

			for (const achievement of achievements) {
				// Validate achievement data
				if (
					!achievement.id ||
					!achievement.title ||
					!achievement.description ||
					!achievement.reward ||
					!achievement.condition ||
					!achievement.icon
				) {
					await t.rollback();
					throw ApiError.BadRequest(
						'Invalid achievement data structure'
					);
				}

				// Create achievement with levels included
				const newAchievement = await Achievement.create(
					{
						id: achievement.id,
						title: achievement.title,
						description: achievement.description,
						reward: achievement.reward,
						condition: achievement.condition,
						icon: achievement.icon,
						active: achievement.active ?? true,
					},
					{ transaction: t }
				);

				createdAchievements.push(newAchievement);
			}

			await t.commit();
			return createdAchievements;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to create achievements: ${err.message}`
			);
		}
	}

	async activateUserAchievements(userId) {
		const t = await sequelize.transaction();

		try {
			const achievementRaw = await Achievement.findAll({
				where: { active: true },
				attributes: [
					'id',
					'title',
					'description',
					'reward',
					'condition',
					'icon',
				],
				transaction: t,
			});
			const userAchievementRaw = await UserAchievement.findAll({
				where: { userId },
				transaction: t,
			});

			const achievements = achievementRaw.map((item) => item.toJSON());
			if (achievements.length === 0) {
				await t.commit();
				return null;
			}

			const userAchievements = userAchievementRaw.map((item) =>
				item.toJSON()
			);
			const existingAchievementIds = new Set(
				userAchievements.map((ua) => ua.achievementId)
			);

			const newAchievements = achievements.filter(
				(ach) => !existingAchievementIds.has(ach.id)
			);

			if (newAchievements.length > 0) {
				const newUserAchievements = newAchievements.map((ach) => ({
					userId,
					achievementId: ach.id,
					reward: 0,
					completed: false,
					progress: 0,
					progressHistory: [],
					lastProgressUpdate: new Date(),
				}));
				await UserAchievement.bulkCreate(newUserAchievements, {
					transaction: t,
				});
			}

			const userAchievementNew = await UserAchievement.findAll({
				where: { userId },
				include: [
					{
						model: Achievement,
						attributes: [
							'id',
							'title',
							'description',
							'reward',
							'condition',
							'icon',
						],
					},
				],
				transaction: t,
			});

			const totalReward = await UserAchievement.sum('reward', {
				where: { userId },
				transaction: t,
			});

			await t.commit();
			return {
				reward: { achievement: totalReward || 0 },
				achievement: userAchievementNew.map((item) => item.toJSON()),
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to activate user achievements: ${err.message}`
			);
		}
	}

	async getUserAchievements(userId) {
		const t = await sequelize.transaction();

		try {
			const userAchievementsRaw = await UserAchievement.findAll({
				include: Achievement,
				where: { userId: userId },
				attributes: [
					'reward',
					'completed',
					'achievementId',
					'progress',
					'progressHistory',
					'lastProgressUpdate',
					'achievement.id',
					'achievement.title',
					'achievement.description',
					'achievement.reward',
					'achievement.condition',
					'achievement.icon',
				],
				transaction: t,
			});
			const reward = await UserAchievement.sum('reward', {
				where: { userId: userId },
				transaction: t,
			});

			await t.commit();
			const userAchievements = userAchievementsRaw.map((item) =>
				item.toJSON()
			);
			return {
				reward: { achievement: reward || 0 },
				achievement: userAchievements,
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to get user achievements: ${err.message}`
			);
		}
	}

	async updateUserAchievementByValue(userId, achievementId, value) {
		const t = await sequelize.transaction();

		try {
			const achievement = await Achievement.findOne({
				where: { id: achievementId, active: true },
				transaction: t,
			});

			if (!achievement) {
				await t.rollback();
				throw ApiError.BadRequest('Achievement not found');
			}

			let userAchievement = await UserAchievement.findOne({
				where: { userId, achievementId },
				transaction: t,
			});

			if (!userAchievement) {
				userAchievement = await UserAchievement.create(
					{
						userId,
						achievementId,
						reward: 0,
						completed: false,
						progress: 0,
						progressHistory: [],
						lastProgressUpdate: new Date(),
					},
					{ transaction: t }
				);
			}

			// Update progress
			const now = new Date();
			const progressEntry = {
				value,
				timestamp: now,
			};

			userAchievement.progress = value;
			userAchievement.progressHistory = [
				...userAchievement.progressHistory,
				progressEntry,
			].slice(-10); // Keep last 10 entries
			userAchievement.lastProgressUpdate = now;

			// Check if the achievement condition is met
			const conditionMet = this.evaluateCondition(
				achievement.condition,
				value
			);

			if (conditionMet && !userAchievement.completed) {
				// Update achievement status and reward
				userAchievement.completed = true;
				userAchievement.reward = achievement.reward.amount || 0;
			}

			await userAchievement.save({ transaction: t });
			await t.commit();

			return userAchievement;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to update achievement: ${err.message}`
			);
		}
	}

	evaluateCondition(condition, value) {
		try {
			// Parse the condition string
			// Expected format: "variableName operator value"
			// Example: "totalStars >= 100"
			const [variable, operator, threshold] = condition.split(/\s+/);
			const numericThreshold = parseInt(threshold, 10);

			if (isNaN(numericThreshold)) {
				return false;
			}

			switch (operator) {
				case '>=':
					return value >= numericThreshold;
				case '>':
					return value > numericThreshold;
				case '<=':
					return value <= numericThreshold;
				case '<':
					return value < numericThreshold;
				case '=':
				case '==':
					return value === numericThreshold;
				default:
					return false;
			}
		} catch (err) {
			loggerService.error(
				`Error evaluating achievement condition: ${err.message}`
			);
			return false;
		}
	}
}

module.exports = new AchievementService();
