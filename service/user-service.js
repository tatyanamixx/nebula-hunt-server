const { User } = require('../models/models');
const tokenService = require('./token-service');
const galaxySevice = require('./galaxy-service');
const userStateService = require('./state-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceprtions/api-error');
const sequelize = require('../db');

class UserService {
	async registration(tgId, tgUserName, galaxies) {
		let verse = await User.findOne({ where: { role: 'VERSE' } });
		if (!verse) {
			verse = await User.create({
				tgId: -1,
				tgUserName: 'universe',
				role: 'VERSE',
			});
		}
		if (!verse) {
			throw ApiError.BadRequest('Verse is not define');
		}
		let user = await User.findOne({ where: { tgId: tgId } });
		if (!user) {
			user = await User.create({ tgId, tgUserName });
		}

		const userDto = new UserDto(user);

		const userState = await userStateService.createUserState(userDto.id);

		for (let i = 0; i < galaxies.length; i++) {
			let userId = galaxies[i].owner == 'USER' ? userDto.id : verse.id;
			let galaxy = galaxySevice.createGalaxy(userId, galaxies[i]);
		}

		const userGalaxeis = galaxySevice.getUserGalaxies(userDto.id);

		const tokens = tokenService.generateTokens({ ...userDto });
		await tokenService.saveToken(userDto.id, tokens.refreshToken);
		console.log(userState);
		console.log(userGalaxeis);
		console.log('лоалыоалоыалоалылаоыаоыаолоаылол');
		return {
			...tokens,
			user: userDto,
			userState,
			userGalaxeis,
		};
	}

	async login(tgId) {
		const user = await User.findOne({ where: { tgId: tgId } });
		if (!user) {
			// branch for ??? user
			throw ApiError.BadRequest('User not found');
		}
		const userDto = new UserDto(user);
		const userState = userStateService.getUserState(userDto.id);
		const userGalaxeis = galaxySevice.getUserGalaxies(userDto.id);
		const tokens = tokenService.generateTokens({ ...userDto });
		await tokenService.saveToken(userDto.id, tokens.refreshToken);
		return {
			...tokens,
			user: userDto,
			userState,
			userGalaxeis,
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
		const userState = userStateService.getUserState(userDto.id);
		const userGalaxy = galaxySevice.getUserGalaxy(userDto.id);
		const tokens = tokenService.generateTokens({ ...userDto });
		await tokenService.saveToken(userDto.id, tokens.refreshToken);
		return {
			...tokens,
			user: userDto,
			userState,
			userGalaxy,
		};
	}

	async getLeaderBoard() {}
}
module.exports = new UserService();
