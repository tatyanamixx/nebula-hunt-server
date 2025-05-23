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
		try {
			let achievement = null;
			let level = null;
			for (let i = 0; i < achievements.length; i++) {
				const inputAch = achievements[i];
				achievement = await Achievement.findOne({
					where: { keyWord: inputAch.keyWord },
				});
				if (achievement) {
					achievement.description = inputAch.description;
					achievement.active = inputAch.active;
					await achievement.save();
				} else {
					achievement = await Achievement.create({
						keyWord: inputAch.keyWord,
						description: inputAch.description,
						active: inputAch.active,
					});
				}
				for (const lvl of inputAch.levels) {
					level = await AchievementReward.findOne({
						where: {
							level: lvl.level,
							achievementId: achievement.id,
						},
					});
					if (level) {
						level.level = lvl.level;
						level.from = lvl.from;
						level.to = lvl.to;
						level.reward = lvl.reward;
						await level.save();
					} else {
						await AchievementReward.create({
							level: lvl.level,
							from: lvl.from,
							to: lvl.to,
							reward: lvl.reward,
							achievementId: achievement.id,
						});
					}
				}
			}

			const achievementRaw = await Achievement.findAll({
				include: AchievementReward,
			});

			const newAchiev = achievementRaw.map((item) => item.toJSON());
			return { achievements: newAchiev };
		} catch (err) {
			throw ApiError.Internal(err.message);
		}
	}

	async activateUserAchievements(userId) {
		try {
			const achievementRaw = await Achievement.findAll({
				where: { active: true },
			});
			const userAchievementRaw = await UserAchievement.findAll({
				where: { userId: userId },
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

			if (achievements.length > 0) {
				const newUserAchievements = newAchievements.map((ach) => ({
					userId: userId,
					achievementId: ach.id,
				}));
				await UserAchievement.bulkCreate(newUserAchievements);
			}

			const userAchievementNew = await UserAchievement.findAll({
				where: { userId: userId },
			});

			const achievementNew = userAchievementNew.map((item) =>
				item.toJSON()
			);

			const reward = await UserAchievement.sum('reward', {
				where: { userId: userId },
			});

			return {
				reward: { achievement: reward },
				userAchievements: achievementNew,
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
		try {
			// 1. Найти достижение по ключу
			const achievement = await Achievement.findOne({
				where: { keyWord },
			});

			if (!achievement) {
				throw ApiError.BadRequest(`Achievement "${keyWord}" not found`);
			}

			// 2. Найти все уровни и отсортировать по возрастанию
			const rewards = await AchievementReward.findAll({
				where: { achievementId: achievement.id },
				order: [['level', 'ASC']],
			});

			if (!rewards.length) {
				throw ApiError.BadRequest(
					`No levels found for achievement "${keyWord}"`
				);
			}

			// 3. Найти подходящий уровень по значению value
			const matchingLevel = rewards.find(
				(r) => value >= r.from && value <= r.to
			);

			if (!matchingLevel) {
				// Не достигнут ни один уровень
				return {
					updated: false,
					reason: 'Value does not match any level range',
				};
			}

			// 4. Найти или создать запись в UserAchievement
			const [userAchievement, created] =
				await UserAchievement.findOrCreate({
					where: {
						userId,
						achievementId: achievement.id,
					},
					defaults: {
						level: matchingLevel.level,
						reward: matchingLevel.reward,
					},
				});

			// 5. Обновить только если новый уровень выше
			if (!created && userAchievement.level < matchingLevel.level) {
				userAchievement.level = matchingLevel.level;
				userAchievement.reward = matchingLevel.reward;
				await userAchievement.save();
				return {
					updated: true,
					upgraded: true,
					level: matchingLevel.level,
					reward: matchingLevel.reward,
				};
			}

			return {
				updated: created,
				upgraded: false,
				level: matchingLevel.level,
				reward: matchingLevel.reward,
			};
		} catch (err) {
			throw ApiError.Internal(err.message);
		}
	}
}
module.exports = new AchievementService();
