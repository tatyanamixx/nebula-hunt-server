const { User, UserState } = require('../models/models');
const tokenService = require('./token-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceprtions/api-error');

class UserService {
	async registration(tgId, tgUserName) {
		const candidate = await User.findOne({ where: { tgId: tgId } });
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

	async login(tgId, tgUserName) {
		const user = await User.findOne({ where: { tgId: tgId } });
		if (!user) {
			// branch for ??? user
			throw ApiError.BadRequest('User not found');
		}
		const userDto = new UserDto(user);
		const tokens = tokenService.generateTokens({ ...userDto });
		await tokenService.saveToken(userDto.id, tokens.refreshToken);
		return {
			...tokens,
			user: userDto,
		};
	}

	async logout(refreshToken) {
		const token = await tokenService.removeToken(refreshToken);
		return token;
	}

	async refresh(refreshToken) {
		
		if (!refreshToken) {
			throw ApiError.UnauthorizedError();
		}
		const userData = tokenService.validateRefreshToken(refreshToken);
		const tokenFromDb = tokenService.findToken(refreshToken);
		if (!userData || !tokenFromDb) {
			throw ApiError.UnauthorizedError();
		}

		const user = await User.findById(userData.Id);

		const userDto = new UserDto(user);
		const tokens = tokenService.generateTokens({ ...userDto });
		await tokenService.saveToken(userDto.id, tokens.refreshToken);
		return {
			...tokens,
			user: userDto,
		};
	}
}
module.exports = new UserService();
