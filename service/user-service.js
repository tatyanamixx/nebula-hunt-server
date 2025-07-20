/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * Сервис для работы с пользователями: регистрация, аутентификация, управление состоянием
 */
const { User, UserState } = require('../models/models');
const tokenService = require('./token-service');
const galaxyService = require('./galaxy-service');
const userStateService = require('./user-state-service');
const logger = require('./logger-service');
const eventService = require('./event-service');
const upgradeService = require('./upgrade-service');
const taskService = require('./task-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const { Op, where } = require('sequelize');
const artifactService = require('./artifact-service');
const prometheusService = require('./prometheus-service');
const marketService = require('./market-service');
const packageStoreService = require('./package-store-service');

const { SYSTEM_USER_ID, SYSTEM_USER_USERNAME } = require('../config/constants');

class UserService {
	/**
	 * Создает системного пользователя, если он не существует
	 * @returns {Promise<Object>} Объект системного пользователя
	 */
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
					username: SYSTEM_USER_USERNAME,
					referral: 0,
					role: 'SYSTEM',
					blocked: false,
				},
				{ transaction: t }
			);

			logger.debug('SYSTEM_USER_ID_STATE', SYSTEM_USER_ID);
			// Create UserState for SYSTEM user (for contract balance)
			await UserState.findOrCreate({
				userId: SYSTEM_USER_ID,
			});

			await t.commit();
			return systemUser;
		} catch (err) {
			if (!t.finished) await t.rollback();
			throw ApiError.Internal(
				`Failed to create system user: ${err.message}`
			);
		}
	}

	/**
	 * Проверяет существование системного пользователя и создает его при необходимости
	 */
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

	/**
	 * Регистрация нового пользователя с инициализацией всех необходимых данных
	 * @param {BigInt|string} userId - Идентификатор пользователя
	 * @param {string} username - Имя пользователя
	 * @param {BigInt|string} referral - Идентификатор реферала
	 * @param {Object} reqUserState - Начальное состояние пользователя
	 * @param {Array} galaxies - Массив данных о галактиках пользователя
	 * @returns {Promise<Object>} Данные пользователя, токены и состояние
	 */
	async registration(userId, username, referral, reqUserState, galaxies) {
		// Первая транзакция - создаем только пользователя
		const t1 = await sequelize.transaction();
		try {
			// Валидация входных данных
			if (!userId || !username) {
				throw ApiError.BadRequest(
					'Missing required user data (id or username)'
				);
			}

			// Преобразуем referral в число, если это строка
			if (typeof referral === 'string') {
				referral = BigInt(referral);
			}

			// 1. Создаём только пользователя
			const [user, created] = await User.findOrCreate({
				where: { id: userId },
				defaults: {
					id: userId,
					username,
					referral,
					role: 'USER',
					blocked: false,
				},
				transaction: t1,
			});

			if (created) {
				prometheusService.incrementUserRegistration();
			}

			// Создаём DTO пользователя для токенов
			const userDto = new UserDto(user);

			// Фиксируем первую транзакцию - пользователь создан
			await t1.commit();

			// Вторая транзакция - создаем все остальное
			const t2 = await sequelize.transaction();
			try {
				// 2. Инициализируем состояние пользователя
				const initialState = {
					state: {
						stars: 0,
						stardustCount: 0,
						darkMatterCount: 0,
						tgStarsCount: 0,
						tokenTonsCount: 0,
						ownedGalaxiesCount: 0,
						ownedNodesCount: 0,
						ownedTasksCount: 0,
						ownedUpgradesCount: 0,
						ownedEventsCount: 0,
						...(reqUserState?.state || {}),
					},
					...(reqUserState || {}),
				};

				const [userState, created] = await UserState.findOrCreate({
					where: { userId: user.id },
					defaults: {
						state: initialState,
					},
					transaction: t2,
				});

				// 3. Генерируем JWT токены
				const tokens = tokenService.generateTokens({ ...userDto });
				await tokenService.saveToken(user.id, tokens.refreshToken, t2);

				// 4. Создаём галактики для пользователя, если данные предоставлены
				const userGalaxies = [];
				let totalStars = 0;
				if (Array.isArray(galaxies) && galaxies.length > 0) {
					for (const galaxyData of galaxies) {
						const offer = {
							buyerId: user.id,
							price: galaxyData.price || GALAXY_BASE_PRICE,
							currency: 'stars',
							stars: galaxyData.starCurrent || 100,
						};
						const newGalaxy =
							await galaxyService.createGalaxyWithOffer(
								galaxyData,
								offer,
								t2
							);
						userGalaxies.push(newGalaxy);
						totalStars += galaxyData.starCurrent || 100;
					}

					// Обновляем счётчик галактик

					userState.state.ownedGalaxiesCount = userGalaxies.length;
					userState.state.stars = totalStars;
					await userState.save({ transaction: t2 });
				}

				// 5. Инициализируем дерево апгрейдов
				await upgradeService.initializeUserUpgradeTree(user.id, t2);

				// 6. Инициализируем события пользователя
				await eventService.initializeUserEvents(user.id, t2);

				// 7. Инициализируем список задач пользователя
				await taskService.initializeUserTasks(user.id, t2);

				// 8. Получаем системные пакеты услуг
				await packageStoreService.initializePackageStore(user.id, t2);

				// Фиксируем вторую транзакцию
				await t2.commit();

				// Возвращаем результат
				return {
					...tokens,
					user: userDto,
					userState,
					userGalaxies,
					// userTasks: [],
					// userUpgrades: [],
					// userEvents: [],
					// packageOffers: [], // Будет заполнено позже при необходимости
				};
			} catch (err) {
				// Откатываем вторую транзакцию в случае ошибки
				if (!t2.finished) await t2.rollback();

				// Логируем ошибку, но не прерываем регистрацию
				logger.error(
					`Failed to create related data for user ${user.id}: ${err.message}`,
					{
						userId: user.id,
						error: err.stack,
					}
				);

				// Возвращаем результат без связанных данных
				// Пользователь уже создан, связанные данные можно создать позже
				const tokens = tokenService.generateTokens({ ...userDto });
				await tokenService.saveToken(user.id, tokens.refreshToken);

				return {
					...tokens,
					user: userDto,
					userState: null,
					userGalaxies: [],
					// userTasks: [],
					// userUpgrades: [],
					// userEvents: [],
					// packageOffers: [],
				};
			}
		} catch (err) {
			// Откатываем первую транзакцию в случае ошибки
			if (!t1.finished) await t1.rollback();

			// Логируем ошибку
			logger.error(`Registration failed: ${err.message}`, {
				userId: userId,
				error: err.stack,
			});

			throw ApiError.Internal(`Registration failed: ${err.message}`);
		}
	}

	/**
	 * Авторизация пользователя и получение всех связанных данных
	 * @param {BigInt|string} userId - Идентификатор пользователя
	 * @returns {Promise<Object>} Данные пользователя, токены и состояние
	 */
	async login(userId) {
		const t = await sequelize.transaction();
		try {
			// 1. Проверяем существование пользователя
			const user = await User.findByPk(userId, { transaction: t });

			if (!user) {
				throw ApiError.BadRequest('User not found');
			}

			if (user.blocked) {
				throw ApiError.BadRequest('User is blocked');
			}

			const userDto = new UserDto(user);

			// 2. Получаем состояние пользователя, галактики и артефакты
			const [userState, userGalaxies, userArtifacts] = await Promise.all([
				stateService.getUserState(userDto.id),
				galaxyService.getUserGalaxies(userDto.id),
				artifactService.getUserArtifacts(userDto.id),
			]);

			// 3. Проверяем и инициализируем state, если его нет
			if (!userState.state) {
				userState.state = {
					stars: userGalaxies.currentStars,
					stardustCount: 0,
					darkMatterCount: 0,
					tgStarsCount: 0,
					tokenTonsCount: 0,
					ownedGalaxiesCount: userGalaxies.length,
					ownedNodesCount: 0,
					ownedTasksCount: 0,
					ownedUpgradesCount: 0,
					ownedEventsCount: 0,
				};
				await userState.save({ transaction: t });
			}

			// 4. Обновляем и инициализируем события пользователя
			const userEvents = await eventService.checkAndTriggerEvents(
				userDto.id
			);

			// 5. Проверяем и инициализируем дерево апгрейдов
			if (!userState.upgrades || userState.upgrades.items.length === 0) {
				// Если дерево апгрейдов не инициализировано - инициализируем
				await upgradeService.initializeUserUpgradeTree(userDto.id, t);
			} else {
				// Если дерево существует - активируем новые доступные узлы
				await upgradeService.activateUserUpgradeNodes(userDto.id, t);
			}

			// 6. Проверяем и инициализируем задачи пользователя
			await taskService.initializeUserTasks(userDto.id, t);

			// 7. Проверяем и инициализируем пакеты пользователя
			await packageStoreService.initializePackageStore(userDto.id, t);

			// 8. Генерируем и сохраняем новые токены
			const tokens = tokenService.generateTokens({ ...userDto });
			await tokenService.saveToken(userDto.id, tokens.refreshToken, t);

			// Фиксируем транзакцию
			await t.commit();

			// Возвращаем результат (без дублирования данных)
			return {
				...tokens,
				user: userDto,
				userState,
				userGalaxies,
				userArtifacts,
				// userEvents,
				// packageOffers: packageOffers || [],
				// userTasks: [],
				// userUpgrades: [],
			};
		} catch (err) {
			// Откатываем транзакцию в случае ошибки
			if (!t.finished) await t.rollback();

			// Логируем ошибку
			logger.error(`Login failed: ${err.message}`, {
				userId: userId,
				error: err.stack,
			});

			throw ApiError.Internal(`Login failed: ${err.message}`);
		}
	}

	/**
	 * Выход пользователя из системы (удаление refresh токена)
	 * @param {string} refreshToken - Токен обновления для удаления
	 * @returns {Promise<Object>} Результат операции
	 */
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

	/**
	 * Обновление токенов доступа по refresh токену
	 * @param {string} refreshToken - Токен обновления
	 * @returns {Promise<Object>} Новые токены и данные пользователя
	 */
	async refresh(refreshToken) {
		const t = await sequelize.transaction();

		try {
			// Проверяем наличие токена
			if (!refreshToken) {
				await t.rollback();
				throw ApiError.UnauthorizedError('Refresh token is required');
			}

			// Валидируем токен
			const userData = tokenService.validateRefreshToken(refreshToken);
			if (!userData) {
				await t.rollback();
				throw ApiError.UnauthorizedError('Invalid refresh token');
			}

			// Проверяем наличие токена в базе данных
			const tokenFromDb = await tokenService.findToken(refreshToken, t);
			if (!tokenFromDb) {
				await t.rollback();
				throw ApiError.UnauthorizedError(
					'Refresh token not found in database'
				);
			}

			// Проверяем существование пользователя
			const user = await User.findByPk(userData.id, { transaction: t });
			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest('User not found');
			}

			// Проверяем, не заблокирован ли пользователь
			if (user.blocked) {
				await t.rollback();
				throw ApiError.BadRequest('User is blocked');
			}

			// Создаем DTO пользователя
			const userDto = new UserDto(user);

			// Генерируем новые токены
			const tokens = tokenService.generateTokens({ ...userDto });

			// Сохраняем новый refresh токен
			await tokenService.saveToken(userDto.id, tokens.refreshToken, t);

			// Логируем успешное обновление токена
			logger.info(`Token refreshed successfully for user ${userDto.id}`);

			// Фиксируем транзакцию
			await t.commit();

			return {
				...tokens,
				user: userDto,
			};
		} catch (err) {
			// Откатываем транзакцию в случае ошибки
			if (!t.finished) await t.rollback();

			// Логируем ошибку
			logger.error(`Token refresh failed: ${err.message}`, {
				error: err.stack,
			});

			// Перебрасываем ошибку
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(`Token refresh failed: ${err.message}`);
		}
	}

	/**
	 * Получение списка друзей пользователя (пользователей, указавших данного пользователя как реферала)
	 * @param {BigInt|string} userId - Идентификатор пользователя
	 * @returns {Promise<Object>} Список друзей и их количество
	 */
	async getFriends(userId) {
		const t = await sequelize.transaction();

		try {
			// Проверяем наличие идентификатора пользователя
			if (!userId) {
				await t.rollback();
				throw ApiError.BadRequest('User ID is required');
			}

			// Проверяем существование пользователя
			const user = await User.findByPk(userId, { transaction: t });
			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest(`User with ID ${id} not found`);
			}

			// Получаем список друзей (пользователей, которые указали данного пользователя как реферала)
			const friends = await User.findAll({
				where: { referral: userId },
				attributes: ['id', 'username', 'referral', 'createdAt'],
				include: [
					{
						model: UserState,
						attributes: ['state'],
					},
				],
				transaction: t,
			});

			// Логируем количество найденных друзей
			logger.info(`Found ${friends.length} friends for user ${userId}`);

			// Фиксируем транзакцию
			await t.commit();

			return {
				count: friends.length,
				friends: friends,
			};
		} catch (err) {
			// Откатываем транзакцию в случае ошибки
			if (!t.finished) await t.rollback();

			// Логируем ошибку
			logger.error(`Failed to get friends: ${err.message}`, {
				userId: userId,
				error: err.stack,
			});

			// Перебрасываем ошибку
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(`Failed to get friends: ${err.message}`);
		}
	}

	/**
	 * Получение данных системного пользователя
	 * @returns {Promise<Object>} Данные системного пользователя
	 */
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
