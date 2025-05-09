const { UserState} = require('../models/models');

class UserStateService {
	async getUserState(userId) {
		const state = await UserState.findOne({ where: { userId: userId } });
		return state;
	}

	async createUserState(userId) {
		const stateData = await UserState.findOne({
			where: { userId: userId },
		});
		if (stateData) {
			return stateData;
		}
		const state = await UserState.create({
			userId: userId,
		});
		return state;
	}

	async saveUserState(userId, userState) {
		const stateData = await UserState.findOne({
			where: { userId: userId },
		});
		if (stateData) {
			stateData = userState
			return stateData.save();
		}
		const state = await UserState.create({
			userId: userId,
		});
		return state;
	}
}
module.exports = new UserStateService();
