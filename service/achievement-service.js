const { UserAchievement, Achievement } = require('../models/models');
const sequelize = require('../db');

const ApiError = require('../exceptions/api-error');
const { where } = require('sequelize');

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
			});
			const userAchievementRaw = await UserAchievement.findAll({
				where: { userId },
			});

			const achievements = achievementRaw.map((item) => item.toJSON());
			if (achievements.length === 0) return null;

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
				}));
				await UserAchievement.bulkCreate(newUserAchievements);
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
			});

			const totalReward = await UserAchievement.sum('reward', {
				where: { userId },
			});

			return {
				reward: { achievement: totalReward || 0 },
				achievement: userAchievementNew.map((item) => item.toJSON()),
			};
		} catch (err) {
			throw ApiError.Internal(err.message);
		}
	}

	async getUserAchievements(userId) {
		try {
			const userAchievementsRaw = await UserAchievement.findAll({
				include: Achievement,
				where: { userId: userId },
				attributes: [
					'reward',
					'completed',
					'achievementId',
					'achievement.id',
					'achievement.title',
					'achievement.description',
					'achievement.reward',
					'achievement.condition',
					'achievement.icon',
				],
			});
			const reward = await UserAchievement.sum('reward', {
				where: { userId: userId },
			});
			const userAchievements = userAchievementsRaw.map((item) =>
				item.toJSON()
			);
			return {
				reward: { achievement: reward },
				achievement: userAchievements,
			};
		} catch (err) {
			throw ApiError.BadRequest(err.message);
		}
	}

	async updateUserAchievementByValue(userId, achievementId, value) {
		const t = await sequelize.transaction();

		try {
			const achievement = await Achievement.findOne({
				where: { id: achievementId, active: true },
			});

			if (!achievement) {
				throw ApiError.BadRequest('Achievement not found');
			}

			let userAchievement = await UserAchievement.findOne({
				where: { userId, achievementId },
			});

			if (!userAchievement) {
				userAchievement = await UserAchievement.create({
					userId,
					achievementId,
					reward: 0,
					completed: false,
				});
			}

			// Update current value
			userAchievement.reward = value;

			// Find appropriate level based on current value
			const newLevel = achievement.reward.reduce(
				(maxLevel, levelConfig) => {
					if (value >= levelConfig.from && value <= levelConfig.to) {
						return Math.max(maxLevel, levelConfig.level);
					}
					return maxLevel;
				},
				0
			);
			// If level changed, update reward
			if (newLevel !== userAchievement.level) {
				const levelConfig = achievement.reward.find(
					(l) => l.type === newLevel
				);
				userAchievement.reward = levelConfig.amount;
				userAchievement.completed = true; // Mark as completed when level changes
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
}

module.exports = new AchievementService();
