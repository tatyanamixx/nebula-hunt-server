/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const userStateService = require("../service/user-state-service");
const ApiError = require("../exceptions/api-error");
const logger = require("../service/logger-service");

class UserStateController {
	async getUserState(req, res, next) {
		try {
			const userId = req.initdata.id;
			const userState = await userStateService.getUserState(userId);
			return res.json(userState);
		} catch (e) {
			next(e);
		}
	}

	async getUserResources(req, res, next) {
		try {
			const userId = req.initdata.id;
			const resources = await userStateService.getUserResources(userId);
			return res.json(resources);
		} catch (e) {
			next(e);
		}
	}

	async updateUserState(req, res, next) {
		try {
			const userId = req.initdata.id;
			const userState = req.body;
			const updatedState = await userStateService.updateUserState(
				userId,
				userState
			);
			logger.info("User state updated", {
				userId: userId,
				newState: userState,
			});
			return res.json(updatedState);
		} catch (e) {
			next(e);
		}
	}

	async getLeaderboard(req, res, next) {
		try {
			const userId = req.initdata.id; // Исправлено: initData -> initdata
			const leaderboard = await userStateService.leaderboard(userId);
			return res.json(leaderboard);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Обновляет начальные ресурсы всех пользователей согласно текущим константам
	 * Админский endpoint для применения изменений в game-constants.js
	 */
	async updateInitialResourcesForAllUsers(req, res, next) {
		try {
			// TODO: Добавить проверку на админа
			// const userId = req.initdata.id;
			// if (!isAdmin(userId)) {
			// 	return res.status(403).json({ error: "Admin access required" });
			// }

			const result =
				await userStateService.updateInitialResourcesForAllUsers();

			logger.info("Initial resources updated for all users", {
				updatedCount: result.updatedCount,
			});

			return res.json({
				success: true,
				message: `Updated initial resources for ${result.updatedCount} users`,
				updatedCount: result.updatedCount,
			});
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new UserStateController();
