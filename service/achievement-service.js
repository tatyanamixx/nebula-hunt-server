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
			let ind = [];

			for (let i = 0; i < achievements.length; i++) {
				const achievement = await Achievement.findOne({
					where: { keyWord: achievements[i].keyWord },
				});
				if (achievement) {
					achievement.description = achievements[i].description;
					achievement.active = achievements[i].active;
					achievement.save();
				} else {
					const achievementNew = await Achievement.create({
						keyWord: achievements[i].keyWord,
						description: achievements[i].description,
						active: achievements[i].active,
					});
				}
			}

			//let levelRaw = null;
			for (let i = 0; i < achievements.length; i++) {
				if (achievements[i].levels.length > 0) {
					const achiv = await Achievement.findOne({
						where: { keyWord: achievements[i].keyWord },
					});
					for (let j = 0; j < achievements[i].levels.length; j++) {
						const levelRaw = await AchievementReward.findOne({
							where: {
								level: achievements[i].levels[j].level,
								achievementId: achiv.Id,
							},
						});
						if (levelRaw) {
							levelRaw.level = achievements[i].levels[j].level;
							levelRaw.from = achievements[i].levels[j].from;
							levelRaw.to = achievements[i].levels[j].to;
							levelRaw.reward = achievements[i].levels[j].reward;
							levelRaw.save();
						} else {
							const levelRawNew = await AchievementReward.create({
								level: achievements[i].levels[j].level,
								from: achievements[i].levels[j].from,
								to: achievements[i].levels[j].to,
								reward: achievements[i].levels[j].reward,
								achievementId: achiv.Id,
							});
						}
					}
				}
			}

			const achievementRaw = await Achievement.findAll({
				include: AchievementReward,
			});

			const newAchiev = achievementRaw.map((item) => item.toJSON());
			return { achievements: newAchiev };
		} catch (err) {
			ApiError.Internal(err.message);
		}
	}
}
module.exports = new AchievementService();
