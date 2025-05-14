const { UserState, User } = require('../models/models');
const loggerService = require('./logger-service');

class UserStateService {
	async getUserState(userId) {
		const userState = await UserState.findOne({
			where: { userId: userId },
		});
		return userState;
	}

	async createUserState(userId, userState) {
		const stateData = await UserState.findOne({
			where: { userId: userId },
		});
		console.log(' craete userStare', userId);
		if (stateData) {
			stateData.stars = userState.stars;
			stateData.state = userState.state;
			return stateData.save();
		}
		const stateNew = await UserState.create({
			userId: userId,
			stars: userState.stars,
			state: userState.state,
		});
		return stateNew;
	}

	async updateUserState(userId, userState) {
		const stateData = await UserState.findOne({
			where: { userId: userId },
		});
		if (stateData) {
			stateData.stars = userState.stars;
			stateData.state = userState.state;
			stateData.save();
			await loggerService.logging(
				galaxy.userId,
				'UPDATE',
				`The user ${userId} updated a state ${JSON.stingify(
					userState.state
				)}`,
				userState.stars
			);
			return { userId, userState: stateData };
		}
		const stateNew = await UserState.create({
			userId: userId,
			stars: userState.stars,
			state: userState.state,
		});
		return { userId, userState: stateNew };
	}

	async leaderboard() {
		const userlist = await UserState.findAll({
			include: User,
			order: [['stars', 'DESC']],
			limit: 100,
			attributes: ['stars', 'state'],
		});
		const users = userlist.map((item) => item.toJSON());

		return { leaderboard: users };
	}
}
module.exports = new UserStateService();
