const ApiError = require('../exceptions/api-error');
const telegram = require('@telegram-apps/init-data-node');

const userAchievementService = require('../service/achievement-service');

class AchievementController {
	async createachievements(req, res, next) {
		try {
			const { achievement } = req.body;
			const userData = await userAchievementService.createAchievements(
				achievement
			);
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}
	// async activateusertasks(req, res, next) {
	//     try {
	//         //const userId = req.userToken.id;
	//         const {userId} = req.params;
	//         const userData = await userTaskService.activateUserTasks(userId);
	//         return res.json(userData);
	//     } catch (err) {
	//         next(err);
	//     }
	// }

	// async getusertasks(req, res, next) {
	//     try {
	//         //const userId = req.userToken.id;
	//         const {userId} = req.params;
	//         const userData = await userTaskService.getUserTasks(userId);
	//         return res.json(userData);
	//     } catch (err) {
	//         next(err);
	//     }
	// }

	// async completedusertask(req, res, next) {
	//     try {
	//         //const userId = req.userToken.id;
	//         //const taskId = req.params;
	//         const { userId, taskId } = req.params;
	//         const userData = await userTaskService.completedUserTask(
	//             userId,
	//             taskId
	//         );
	//         return res.json(userData);
	//     } catch (err) {
	//         next(err);
	//     }
	// }
}

module.exports = new AchievementController();
