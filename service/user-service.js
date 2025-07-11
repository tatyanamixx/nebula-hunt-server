/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * Сервис для работы с пользователями: регистрация, аутентификация, управление состоянием
 */
const { User, UserState } = require('../models/models');
const tokenService = require('./token-service');
const galaxyService = require('./galaxy-service');
const stateService = require('./state-service');
const loggerService = require('./logger-service');
const eventService = require('./event-service');
const upgradeService = require('./upgrade-service');
const taskService = require('./task-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const { Op, where } = require('sequelize');
const artifactService = require('./artifact-service');
const { prometheusMetrics } = require('../middlewares/prometheus-middleware');
const marketService = require('./market-service');
const packageStoreService = require('./package-store-service');

const { SYSTEM_USER_ID } = require('../config/constants');

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

			loggerService.info('SYSTEM_USER_ID', SYSTEM_USER_ID);

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

			loggerService.info('SYSTEM_USER_ID_STATE', SYSTEM_USER_ID);
			// Create UserState for SYSTEM user (for contract balance)
			await UserState.create(
				{
					userId: SYSTEM_USER_ID,
				},
				{ transaction: t }
			);

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
	 * @param {BigInt|string} id - Идентификатор пользователя
	 * @param {string} username - Имя пользователя
	 * @param {BigInt|string} referral - Идентификатор реферала
	 * @param {Object} reqUserState - Начальное состояние пользователя
	 * @param {Array} galaxies - Массив данных о галактиках пользователя
	 * @returns {Promise<Object>} Данные пользователя, токены и состояние
	 */
	async registration(id, username, referral, reqUserState, galaxies) {
		const t = await sequelize.transaction();
		try {
			// Валидация входных данных
			if (!id || !username) {
				throw ApiError.BadRequest(
					'Missing required user data (id or username)'
				);
			}

			// Преобразуем referral в число, если это строка
			if (typeof referral === 'string') {
				referral = BigInt(referral);
			}

			// 1. Создаём пользователя
			const [user, created] = await User.findOrCreate({
				where: { id },
				defaults: {
					id,
					username,
					referral,
					role: 'USER',
					blocked: false,
				},
				transaction: t,
			});

			if (created) {
				prometheusMetrics.userRegistrationCounter.inc();
			}

			// Создаём DTO пользователя для токенов
			const userDto = new UserDto(user);

			// 2. Инициализируем состояние пользователя
			const initialState = {
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
					...(reqUserState?.state || {}),
				},
				...(reqUserState || {}),
			};

			const userState = await stateService.createUserState(
				user.id,
				initialState,
				t
			);

			// 3. Создаём галактики для пользователя, если данные предоставлены
			const userGalaxies = [];
			if (Array.isArray(galaxies) && galaxies.length > 0) {
				for (const galaxyData of galaxies) {
					const newGalaxy = await galaxyService.createGalaxy(
						user.id,
						galaxyData,
						t
					);
					userGalaxies.push(newGalaxy);
				}

				// Обновляем счётчик галактик
				if (!userState.state) userState.state = {};
				userState.state.ownedGalaxiesCount = userGalaxies.length;
				await userState.save({ transaction: t });
			}

			// 4. Инициализируем дерево апгрейдов
			await upgradeService.initializeUserUpgradeTree(user.id, t);

			// 5. Инициализируем события пользователя
			await eventService.initializeUserEvents(user.id, t);

			// 6. Инициализируем список задач пользователя
			await taskService.initializeUserTasks(user.id, t);

			// 7. Получаем системные пакеты услуг
			await packageStoreService.initializePackageStore(user.id, t);

			// 8. Генерируем JWT токены
			const tokens = tokenService.generateTokens({ ...userDto });
			await tokenService.saveToken(user.id, tokens.refreshToken, t);

			// Фиксируем транзакцию
			await t.commit();

			// Возвращаем результат (без дублирования данных)
			return {
				...tokens,
				user: userDto,
				userState,
				userGalaxies,
				packageOffers,
			};
		} catch (err) {
			// Откатываем транзакцию в случае ошибки
			if (!t.finished) await t.rollback();

			// Логируем ошибку
			loggerService.error(`Registration failed: ${err.message}`, {
				userId: id,
				error: err.stack,
			});

			throw ApiError.Internal(`Registration failed: ${err.message}`);
		}
	}

	/**
	 * Авторизация пользователя и получение всех связанных данных
	 * @param {BigInt|string} id - Идентификатор пользователя
	 * @returns {Promise<Object>} Данные пользователя, токены и состояние
	 */
	async login(id) {
		const t = await sequelize.transaction();
		try {
			// 1. Проверяем существование пользователя
			const user = await User.findByPk(id, { transaction: t });

			if (!user) {
				throw ApiError.BadRequest('User not found');
			}

			if (user.blocked) {
				throw ApiError.BadRequest('User is blocked');
			}

			const userDto = new UserDto(user);

			// 2. Получаем состояние пользователя, галактики и артефакты
			const [userState, userGalaxies, userArtifacts, packageOffers] =
				await Promise.all([
					stateService.getUserState(userDto.id),
					galaxyService.getUserGalaxies(userDto.id),
					artifactService.getUserArtifacts(userDto.id),
			
				]);

			// 3. Проверяем и инициализируем state, если его нет
			if (!userState.state) {
				userState.state = {
					totalStars: 0,
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
			await eventService.checkAndTriggerEvents(userDto.id);

			// 5. Проверяем и инициализируем дерево апгрейдов
			if (!userState.upgrades || userState.upgrades.items.length === 0) {
				// Если дерево апгрейдов не инициализировано - инициализируем
				await upgradeService.initializeUserUpgradeTree(userDto.id, t);
			} else {
				// Если дерево существует - активируем новые доступные узлы
				await upgradeService.activateUserUpgradeNodes(userDto.id, t);
			}

			// 6. Проверяем и инициализируем задачи пользователя
			if (!userState.tasks || userState.tasks.items.length === 0) {
				// Если задачи не инициализированы - инициализируем
				await taskService.initializeUserTasks(userDto.id, t);
			}

			// 7. Проверяем и инициализируем пакеты пользователя
			if (
				!userState.packages ||
				userState.packages.available.length === 0
			) {
				// Если пакеты не инициализированы - инициализируем
				await packageStoreService.initializePackageStore(userDto.id, t);
			}

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
				packageOffers,
			};
		} catch (err) {
			// Откатываем транзакцию в случае ошибки
			if (!t.finished) await t.rollback();

			// Логируем ошибку
			loggerService.error(`Login failed: ${err.message}`, {
				userId: id,
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
			loggerService.info(
				`Token refreshed successfully for user ${userDto.id}`
			);

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
			loggerService.error(`Token refresh failed: ${err.message}`, {
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
	 * @param {BigInt|string} id - Идентификатор пользователя
	 * @returns {Promise<Object>} Список друзей и их количество
	 */
	async getFriends(id) {
		const t = await sequelize.transaction();

		try {
			// Проверяем наличие идентификатора пользователя
			if (!id) {
				await t.rollback();
				throw ApiError.BadRequest('User ID is required');
			}

			// Проверяем существование пользователя
			const user = await User.findByPk(id, { transaction: t });
			if (!user) {
				await t.rollback();
				throw ApiError.BadRequest(`User with ID ${id} not found`);
			}

			// Получаем список друзей (пользователей, которые указали данного пользователя как реферала)
			const friends = await User.findAll({
				where: { referral: id },
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
			loggerService.info(
				`Found ${friends.length} friends for user ${id}`
			);

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
			loggerService.error(`Failed to get friends: ${err.message}`, {
				userId: id,
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
