const { User, Log, UserState } = require('../models/models');
const tokenService = require('./token-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceprtions/api-error');

class UserService {
	async registration(tgId, tgUserName) {

		const candidate = await User.findOne({where:{ tgId: tgId }});
		if (candidate) {
			// branch for restore old user! 
			throw ApiError.BadRequest('User alredy exist');
		}
		const user = await User.create({ tgId, tgUserName });

		const userDto = new UserDto(user);
		const userState = await UserState.create({ userId: userDto.id });
		
		const tokens = tokenService.generateTokens({ ...userDto });
		await tokenService.saveToken(userDto.id, tokens.refreshToken);
		return {
			...tokens,
			user: userDto,
		};
	}
}
module.exports = new UserService();
