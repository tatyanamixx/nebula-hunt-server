const { User, UserState, UpgradeNode } = require('../models/models');
const tokenService = require('./token-service');
const galaxyService = require('./galaxy-service');
const stateService = require('./state-service');
const loggerService = require('./logger-service');
const eventService = require('./event-service');
const upgradeService = require('./upgrade-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const { Op, where } = require('sequelize');

class UserService {
	async ensureVerseUser(transaction) {
		// Check if VERSE user exists
		let verse = await User.findOne({
			where: { role: 'VERSE' },
			transaction,
		});

		// Create if doesn't exist
		if (!verse) {
			verse = await User.create(
				{
					tmaId: -1,
					tmaUsername: 'universe',
					role: 'VERSE',
				},
				{ transaction }
			);
		}

		return verse;
	}

	async registration(tmaId, tmaUsername, referral, reqUserState, galaxies) {
		console.log(tmaId, tmaUsername, referral);

		const tc = await sequelize.transaction();
		try {
			// Validate input data
			if (!tmaId || !tmaUsername) {
				await tc.rollback();
				throw ApiError.BadRequest('Missing required TMA user data');
			}
			if (!reqUserState) {
				await tc.rollback();
				throw ApiError.BadRequest('Invalid userState data');
			}
			if (typeof referral === 'string') {
				await tc.rollback();
				throw ApiError.BadRequest(
					'Invalid referral data, must be a number'
				);
			}

			// Create or update user
			const [userCreated, created] = await User.findOrCreate({
				where: { tmaId: tmaId },
				defaults: {
					tmaId: tmaId,
					tmaUsername: tmaUsername,
					referral: referral,
				},
				transaction: tc,
			});
			const verseUser = await this.ensureVerseUser(tc);
			await tc.commit();
		} catch (err) {
			await tc.rollback();
			throw ApiError.Internal(`Registration failed: ${err.message}`);
		}

		const t = await sequelize.transaction();
		try {
			const user = await User.findOne({
				where: { tmaId: tmaId },
				transaction: t,
			});

			const userData = user.toJSON();
			const userDto = new UserDto(userData);

			//	Create user state
			const userState = await stateService.createUserState(
				userDto.id,
				reqUserState,
				t
			);

			// Initialize user upgrade tree
			const upgradeNodes = await upgradeService.initializeUserUpgradeTree(
				userDto.id,
				t
			);

			// Initialize user events
			await eventService.initializeUserEvents(userDto.id, t);

			//Create galaxies
			const userGalaxies = [];
			if (Array.isArray(galaxies) && galaxies.length > 0) {
				// Ensure VERSE user exists for creating other galaxies
				const verseUser = await this.ensureVerseUser(t);

				let userGalaxyCreated = false;

				for (const galaxy of galaxies) {
					try {
						if (
							galaxy.galaxyData.starsMin === 100 &&
							!userGalaxyCreated
						) {
							// Create only one galaxy for user
							const newGalaxy = await galaxyService.createGalaxy(
								userDto.id,
								galaxy,
								t
							);
							userGalaxies.push(newGalaxy);
							userGalaxyCreated = true;
						} else {
							// All other galaxies go to VERSE
							await galaxyService.createGalaxy(
								verseUser.id,
								galaxy,
								t
							);
						}
					} catch (err) {
						throw ApiError.Internal(
							`Registration failed: ${err.message}`
						);
					}
				}
			}

			// Generate tokens
			const tokens = tokenService.generateTokens({ ...userDto });
			await tokenService.saveToken(userDto.id, tokens.refreshToken);

			await t.commit();

			console.log('userState', userState, userDto, userGalaxies);
			return {
				...tokens,
				user: userDto,
				userState,
				userGalaxies,
				upgradeNodes,
			};
		} catch (err) {
			//await t.rollback();
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
				await t.rollback();
				throw ApiError.BadRequest('User not found');
			}

			if (user.blocked) {
				await t.rollback();
				throw ApiError.BadRequest('User is blocked');
			}

			const userDto = new UserDto(user);

			// Get user state, galaxies and check events
			const [userState, userGalaxies, eventState] = await Promise.all([
				stateService.getUserState(userDto.id),
				galaxyService.getUserGalaxies(userDto.id),
				//eventService.checkAndTriggerEvents(userDto.id, t),
			]);

			// Check if user has upgrade tree initialized
			const userNodes = await UserUpgradeNode.findOne({
				where: { userId: userDto.id },
				transaction: t,
			});
			let upgradeNodes = [];
			if (!userNodes) {
				// If no upgrade nodes found, initialize the tree
				upgradeNodes = await upgradeService.initializeUserUpgradeTree(
					userDto.id,
					t
				);
			} else {
				// If tree exists, activate any new available nodes
				upgradeNodes = await upgradeService.activateUserUpgradeNodes(
					userDto.id,
					t
				);
			}

			// Generate and save new tokens
			const tokens = tokenService.generateTokens({ ...userDto });
			await tokenService.saveToken(userDto.id, tokens.refreshToken, t);

			await t.commit();

			return {
				...tokens,
				user: userDto,
				userState,
				userGalaxies,
				eventState,
				upgradeNodes,
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Login failed: ${err.message}`);
		}
	}

	async logout(refreshToken) {
		const t = await sequelize.transaction();

		try {
			const token = await tokenService.removeToken(refreshToken, t);
			await t.commit();
			return token;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Logout failed: ${err.message}`);
		}
	}

	async refresh(refreshToken) {
		const t = await sequelize.transaction();

		try {
			if (!refreshToken) {
				await t.rollback();
				throw ApiError.UnauthorizedError();
			}

			const userData = tokenService.validateRefreshToken(refreshToken);
			const tokenFromDb = await tokenService.findToken(refreshToken, t);

			if (!userData || !tokenFromDb) {
				await t.rollback();
				throw ApiError.UnauthorizedError();
			}

			const user = await User.findByPk(userData.id, { transaction: t });
			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest('User not found');
			}

			const userDto = new UserDto(user);

			// Generate new tokens
			const tokens = tokenService.generateTokens({ ...userDto });
			await tokenService.saveToken(userDto.id, tokens.refreshToken, t);

			await t.commit();
			return {
				...tokens,
				user: userDto,
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Token refresh failed: ${err.message}`);
		}
	}

	async getFriends(tmaId) {
		const t = await sequelize.transaction();

		try {
			if (!tmaId) {
				await t.rollback();
				throw ApiError.BadRequest('TMA ID is required');
			}

			const friends = await User.findAll({
				where: { referral: tmaId },
				attributes: ['id', 'tmaId', 'tmaUsername', 'referral'],
				include: [
					{
						model: UserState,
						attributes: ['state'],
					},
				],
				transaction: t,
			});

			await t.commit();
			return friends;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to get friends: ${err.message}`);
		}
	}
}

module.exports = new UserService();
