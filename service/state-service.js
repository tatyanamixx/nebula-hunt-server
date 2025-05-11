const { UserState } = require('../models/models');

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

	async saveUserState(userId, userState) {
		const stateData = await UserState.findOne({
			where: { userId: userId },
		});
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
}
module.exports = new UserStateService();
