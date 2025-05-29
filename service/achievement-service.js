const {
	UserAchievement,
	Achievement,
	AchievementReward,
} = require('../models/models');
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
					!achievement.keyWord ||
					!achievement.description ||
					!Array.isArray(achievement.levels)
				) {
					throw ApiError.BadRequest(
						'Invalid achievement data structure'
					);
				}

				// Create achievement with levels included
				const newAchievement = await Achievement.create(
					{
						keyWord: achievement.keyWord,
						description: achievement.description,
						levels: achievement.levels,
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
					currentValue: 0,
					level: 0,
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
						attributes: ['keyWord', 'description', 'levels'],
					},
				],
			});

			const totalReward = await UserAchievement.sum('reward', {
				where: { userId },
			});

			return {
				reward: { achievement: totalReward || 0 },
				userAchievements: userAchievementNew.map((item) =>
					item.toJSON()
				),
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
				attributes: ['reward', 'completed'],
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

	async updateUserAchievementByValue(userId, keyWord, value) {
		const t = await sequelize.transaction();

		try {
			const achievement = await Achievement.findOne({
				where: { keyWord, active: true },
			});

			if (!achievement) {
				throw ApiError.BadRequest('Achievement not found');
			}

			let userAchievement = await UserAchievement.findOne({
				where: { userId, achievementId: achievement.id },
			});

			if (!userAchievement) {
				userAchievement = await UserAchievement.create({
					userId,
					achievementId: achievement.id,
					currentValue: 0,
					level: 0,
					reward: 0,
					completed: false,
				});
			}

			// Update current value
			userAchievement.currentValue = value;

			// Find appropriate level based on current value
			const newLevel = achievement.levels.reduce(
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
				const levelConfig = achievement.levels.find(
					(l) => l.level === newLevel
				);
				userAchievement.level = newLevel;
				userAchievement.reward = levelConfig.reward;
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
