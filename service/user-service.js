const { User} = require('../models/models');
const tokenService = require('./token-service');
const galaxySevice = require('./galaxy-service');
const userStateService = require('./state-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');

class UserService {
	async registration(tmaId, tmaUsername, referral, reqUserState, galaxies) {
		let verse = await User.findOne({ where: { role: 'VERSE' } });
		if (!verse) {
			verse = await User.create({
				tmaId: -1,
				tmaUsername: 'universe',
				role: 'VERSE',
			});
		}
		if (!verse) {
			throw ApiError.BadRequest('Verse is not define');
		}
		let userNew = false;
		let user = await User.findOne({ where: { tmaId: tmaId } });
		if (!user) {
			userNew = true;
			user = await User.create({ tmaId, tmaUsername, referral });
		}

		const userDto = new UserDto(user);

		const userState = await userStateService.createUserState(
			userDto.id,
			reqUserState
		);

		for (let i = 0; i < galaxies.length; i++) {
			if (galaxies[i].galaxyData.owner == 'VERSE') {
				await galaxySevice.createGalaxy(verse.id, galaxies[i]);
			}
			if (galaxies[i].galaxyData.owner == 'USER' && userNew) {
				await galaxySevice.createGalaxy(userDto.id, galaxies[i]);
			}
		}

		const userGalaxeis = await galaxySevice.getUserGalaxies(userDto.id);

		const tokens = tokenService.generateTokens({ ...userDto });
		await tokenService.saveToken(userDto.id, tokens.refreshToken);

		return {
			...tokens,
			user: userDto,
			userState,
			userGalaxeis,
		};
	}

	async login(tmaId) {
		const user = await User.findOne({ where: { tmaId: tmaId } });
		if (!user) {
			// branch for ??? user
			throw ApiError.BadRequest('User not found');
		}
		const userDto = new UserDto(user);
		const userState = await userStateService.getUserState(userDto.id);
		const userGalaxeis = await galaxySevice.getUserGalaxies(userDto.id);
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
		const tokenFromDb = await tokenService.findToken(refreshToken);
		if (!userData || !tokenFromDb) {
			throw ApiError.UnauthorizedError();
		}

		const user = await User.findOne({ where: { id: userData.id } });

		const userDto = new UserDto(user);
		const userState = await userStateService.getUserState(userDto.id);
		const userGalaxis = await galaxySevice.getUserGalaxies(userDto.id);
		const tokens = tokenService.generateTokens({ ...userDto });
		await tokenService.saveToken(userDto.id, tokens.refreshToken);
		return {
			...tokens,
			user: userDto,
			userState,
			userGalaxis,
		};
	}
}
module.exports = new UserService();
