const { User, UserState, Galaxy } = require('../models/models');

class UserStateService {
	async getUserState(userId) {
		const state = await UserState.findOne({ where: { userId: userId } });
		return state;
	}

	async createUserState(userId, galaxy) {
		const state = await UserState.create({
			userId: userId,
		});
		return state;
	}

	async setUserState(userId, params) {}
}
module.exports = new UserStateService()