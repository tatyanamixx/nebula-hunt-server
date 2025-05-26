const { User } = require('../models/models');
const tokenService = require('./token-service');
const galaxyService = require('./galaxy-service');
const userStateService = require('./state-service');
const loggerService = require('./logger-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');

class UserService {
	async registration(tmaId, tmaUsername, referral, reqUserState, galaxies) {
		const t = await sequelize.transaction();

		try {
			// Validate input data
			if (!tmaId || !tmaUsername) {
				throw ApiError.BadRequest('Missing required user data');
			}

			if (!reqUserState || typeof reqUserState.stars !== 'number') {
				throw ApiError.BadRequest('Invalid user state data');
			}

			// Find or create VERSE user
			let verse = await User.findOne({
				where: { role: 'VERSE' },
				transaction: t,
			});

			if (!verse) {
				verse = await User.create(
					{
						tmaId: -1,
						tmaUsername: 'universe',
						role: 'VERSE',
					},
					{ transaction: t }
				);
			}

			// Create or update user
			let [user, created] = await User.findOrCreate({
				where: { tmaId },
				defaults: {
					tmaUsername,
					referral,
				},
				transaction: t,
			});

			if (!created) {
				user.tmaUsername = tmaUsername;
				if (referral) user.referral = referral;
				await user.save({ transaction: t });
			}

			const userDto = new UserDto(user);

			// Create user state
			const userState = await userStateService.createUserState(
				userDto.id,
				reqUserState,
				t
			);

			// Create galaxies
			const userGalaxies = [];
			if (Array.isArray(galaxies)) {
				for (const galaxy of galaxies) {
					try {
						if (galaxy.galaxyData.owner === 'VERSE') {
							await galaxyService.createGalaxy(verse.id, galaxy);
						} else if (
							galaxy.galaxyData.owner === 'USER' &&
							created
						) {
							const newGalaxy = await galaxyService.createGalaxy(
								userDto.id,
								galaxy
							);
							userGalaxies.push(newGalaxy);
						}
					} catch (err) {
						console.error(
							`Failed to create galaxy: ${err.message}`
						);
						// Continue with other galaxies even if one fails
					}
				}
			}

			// Generate tokens
			const tokens = tokenService.generateTokens({ ...userDto });
			await tokenService.saveToken(userDto.id, tokens.refreshToken, t);

			// Log registration
			await loggerService.logging(
				userDto.id,
				'REGISTRATION',
				`User ${userDto.tmaId}:${tmaUsername} registered`,
				0
			);

			await t.commit();

			return {
				...tokens,
				user: userDto,
				userState,
				userGalaxies,
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Registration failed: ${err.message}`);
		}
	}

	async login(tmaId) {
		const t = await sequelize.transaction();

		try {
			const user = await User.findOne({
				where: { tmaId },
				transaction: t,
			});

			if (!user) {
				throw ApiError.BadRequest('User not found');
			}

			if (user.blocked) {
				throw ApiError.BadRequest('User is blocked');
			}

			const userDto = new UserDto(user);

			// Get user state and galaxies
			const [userState, userGalaxies] = await Promise.all([
				userStateService.getUserState(userDto.id),
				galaxyService.getUserGalaxies(userDto.id),
			]);

			// Generate and save new tokens
			const tokens = tokenService.generateTokens({ ...userDto });
			await tokenService.saveToken(userDto.id, tokens.refreshToken, t);

			await loggerService.logging(
				userDto.id,
				'LOGIN',
				`User ${userDto.tmaId} logged in`,
				0
			);

			await t.commit();

			return {
				...tokens,
				user: userDto,
				userState,
				userGalaxies,
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Login failed: ${err.message}`);
		}
	}

	async logout(refreshToken) {
		try {
			const token = await tokenService.removeToken(refreshToken);
			return token;
		} catch (err) {
			throw ApiError.Internal(`Logout failed: ${err.message}`);
		}
	}

	async refresh(refreshToken) {
		try {
			if (!refreshToken) {
				throw ApiError.UnauthorizedError();
			}

			const userData = tokenService.validateRefreshToken(refreshToken);
			const tokenFromDb = await tokenService.findToken(refreshToken);

			if (!userData || !tokenFromDb) {
				throw ApiError.UnauthorizedError();
			}

			const user = await User.findByPk(userData.id);
			if (!user) {
				throw ApiError.BadRequest('User not found');
			}

			const userDto = new UserDto(user);

			// Get updated user data
			const [userState, userGalaxies] = await Promise.all([
				userStateService.getUserState(userDto.id),
				galaxyService.getUserGalaxies(userDto.id),
			]);

			// Generate new tokens
			const tokens = tokenService.generateTokens({ ...userDto });
			await tokenService.saveToken(userDto.id, tokens.refreshToken);

			await loggerService.logging(
				userDto.id,
				'REFRESH',
				`User ${userDto.tmaId} refreshed token`,
				0
			);

			return {
				...tokens,
				user: userDto,
				userState,
				userGalaxies,
			};
		} catch (err) {
			throw ApiError.Internal(`Token refresh failed: ${err.message}`);
		}
	}

	async getFriends(userId, tmaId) {
		try {
			if (!tmaId) {
				throw ApiError.BadRequest('TMA ID is required');
			}

			const friends = await User.findAll({
				where: { referral: tmaId },
				attributes: ['id', 'tmaId', 'tmaUsername', 'referral'],
				include: [
					{
						model: UserState,
						attributes: ['stars'],
					},
				],
			});

			await loggerService.logging(
				userId,
				'GET',
				`User ${tmaId} requested friends list`,
				0
			);

			return friends;
		} catch (err) {
			throw ApiError.Internal(`Failed to get friends: ${err.message}`);
		}
	}
}

module.exports = new UserService();
