/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const { User, UserState } = require('../models/models');
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
const artifactService = require('./artifact-service');
const { prometheusMetrics } = require('../middlewares/prometheus-middleware');

const { SYSTEM_USER_ID } = require('../config/constants');

class UserService {
	async createSystemUser() {
		const t = await sequelize.transaction();
		try {
			// Check if system user already exists
			const existingSystemUser = await User.findByPk(SYSTEM_USER_ID, {
				transaction: t,
			});
			if (existingSystemUser) {
				await t.commit();
				return existingSystemUser;
			}

			// Create system user
			const systemUser = await User.create(
				{
					id: SYSTEM_USER_ID,
					username: 'SYSTEM',
					referral: 0,
					role: 'SYSTEM',
					blocked: false,
				},
				{ transaction: t }
			);

			// Create UserState for SYSTEM user (for contract balance)
			await UserState.create(
				{
					userId: SYSTEM_USER_ID,
					state: {
						totalStars: 0,
						stardustCount: 0,
						darkMatterCount: 0,
						tgStarsCount: 0,
						tokenTonsCount: 0,
						ownedGalaxiesCount: 0,
						ownedNodesCount: 0,
						ownedTasksCount: 0,
						ownedUpgradesCount: 0,
						ownedEventsCount: 0,
					},
					chaosLevel: 0,
					stabilityLevel: 0,
					entropyVelocity: 0,
				},
				{ transaction: t }
			);

			await t.commit();
			return systemUser;
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(
				`Failed to create system user: ${err.message}`
			);
		}
	}

	async ensureSystemUserExists() {
		try {
			const systemUser = await User.findByPk(SYSTEM_USER_ID);
			if (!systemUser) {
				await this.createSystemUser();
			}
		} catch (err) {
			throw ApiError.Internal(
				`Failed to ensure system user exists: ${err.message}`
			);
		}
	}

	async registration(id, username, referral, reqUserState, galaxies) {
		const tc = await sequelize.transaction();
		try {
			// Validate input data
			if (!id || !username) {
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
				where: { id: id },
				defaults: {
					id: id,
					username: username,
					referral: referral,
				},
				transaction: tc,
			});

			if (created) {
				prometheusMetrics.userRegistrationCounter.inc();
			}

			await tc.commit();
		} catch (err) {
			await tc.rollback();
			throw ApiError.Internal(`Registration failed: ${err.message}`);
		}

		const t = await sequelize.transaction();
		try {
			const user = await User.findByPk(id, {
				transaction: t,
			});

			const userData = user.toJSON();
			const userDto = new UserDto(userData);

			// Initialize user upgrade tree
			const upgradeNodes = await upgradeService.initializeUserUpgradeTree(
				userDto.id,
				t
			);

			//Create galaxies
			const userGalaxies = [];
			if (Array.isArray(galaxies) && galaxies.length > 0) {
				for (const galaxy of galaxies) {
					try {
						// Create galaxy for the user
						const newGalaxy = await galaxyService.createGalaxy(
							userDto.id,
							galaxy,
							t
						);
						userGalaxies.push(newGalaxy);
					} catch (err) {
						throw ApiError.Internal(
							`Registration failed: ${err.message}`
						);
					}
				}
			}

			reqUserState.state.ownerGalaxiesCount = userGalaxies.length;
			// loggerService.info(id, reqUserState.state);
			//	Create user state
			const userState = await stateService.createUserState(
				userDto.id,
				reqUserState,
				t
			);

			// Initialize user events
			await eventService.initializeUserEvents(userDto.id);

			// Generate tokens
			const tokens = tokenService.generateTokens({ ...userDto });
			await tokenService.saveToken(userDto.id, tokens.refreshToken);

			await t.commit();

			// console.log('userState', userState, userDto, userGalaxies);
			return {
				...tokens,
				user: userDto,
				userState,
				userGalaxies,
				upgradeNodes,
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Registration failed: ${err.message}`);
		}
	}

	async login(id) {
		const t = await sequelize.transaction();

		try {
			const user = await User.findByPk(id, { transaction: t });

			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest('User not found');
			}

			if (user.blocked) {
				await t.rollback();
				throw ApiError.BadRequest('User is blocked');
			}

			const userDto = new UserDto(user);

			// Get user state, galaxies, artifacts
			const [userState, userGalaxies, userArtifacts] = await Promise.all([
				stateService.getUserState(userDto.id),
				galaxyService.getUserGalaxies(userDto.id),
				artifactService.getUserArtifacts(userDto.id),
			]);

			// Обновляем и инициализируем события пользователя
			const eventState = await eventService.checkAndTriggerEvents(
				userDto.id
			);

			// Check if user has upgrade tree initialized
			let upgradeNodes = [];
			if (
				!userState.userUpgrades ||
				Object.keys(userState.userUpgrades).length === 0
			) {
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
				userArtifacts,
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

	async getFriends(id) {
		const t = await sequelize.transaction();

		try {
			if (!id) {
				await t.rollback();
				throw ApiError.BadRequest('TMA ID is required');
			}

			const friends = await User.findAll({
				where: { referral: id },
				attributes: ['id', 'username', 'referral'],
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

	async getSystemUser() {
		try {
			const systemUser = await User.findByPk(SYSTEM_USER_ID);

			if (!systemUser) {
				throw ApiError.BadRequest('System user not found');
			}

			return systemUser;
		} catch (err) {
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(
				`Failed to get system user: ${err.message}`
			);
		}
	}
}

module.exports = new UserService();
