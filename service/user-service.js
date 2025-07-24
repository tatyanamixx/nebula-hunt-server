/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * Сервис для работы с пользователями: регистрация, аутентификация, управление состоянием
 */
const { User, UserState, Galaxy } = require('../models/models');
const tokenService = require('./token-service');
const galaxyService = require('./galaxy-service');
const userStateService = require('./user-state-service');
const logger = require('./logger-service');
const eventService = require('./event-service');
const upgradeService = require('./upgrade-service');
const taskService = require('./task-service');
const UserDto = require('../dtos/user-dto');
const UserStateDto = require('../dtos/user-state-dto');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const { Op, where } = require('sequelize');
const artifactService = require('./artifact-service');
const prometheusService = require('./prometheus-service');
const marketService = require('./market-service');
const gameService = require('./game-service');
const packageStoreService = require('./package-store-service');

const { SYSTEM_USER_ID, SYSTEM_USER_USERNAME } = require('../config/constants');

class UserService {
	constructor() {
		// Проверяем, что prometheusService импортирован корректно
		if (!prometheusService) {
			logger.warn('PrometheusService not imported correctly');
		} else if (!prometheusService.incrementUserRegistration) {
			logger.warn(
				'PrometheusService.incrementUserRegistration method not found'
			);
		} else {
			logger.debug('PrometheusService imported successfully');
		}
	}

	/**
	 * Безопасное обновление метрик Prometheus
	 * @param {string} metricType - Тип метрики для обновления
	 * @param {Object} options - Дополнительные параметры
	 */
	safeUpdatePrometheusMetric(metricType, options = {}) {
		process.nextTick(() => {
			try {
				if (
					!prometheusService ||
					typeof prometheusService !== 'object'
				) {
					logger.debug('Prometheus service not available');
					return;
				}

				switch (metricType) {
					case 'userRegistration':
						if (
							typeof prometheusService.incrementUserRegistration ===
							'function'
						) {
							prometheusService.incrementUserRegistration();
							logger.debug(
								'User registration metric incremented successfully'
							);
						} else {
							logger.debug(
								'User registration metric method not available'
							);
						}
						break;
					default:
						logger.debug(`Unknown metric type: ${metricType}`);
				}
			} catch (error) {
				logger.warn('Failed to update Prometheus metric:', {
					metricType,
					error: error.message,
					...options,
				});
			}
		});
	}

	/**
	 * Создает системного пользователя, если он не существует
	 * @returns {Promise<Object>} Объект системного пользователя
	 */
	async createSystemUser(transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;
		try {
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

			//logger.debug('SYSTEM_USER_ID_STATE', SYSTEM_USER_ID);
			// Create UserState for SYSTEM user (for contract balance)
			logger.debug('SYSTEM_USER_ID_STATE', systemUser.id);
			await UserState.findOrCreate({
				where: {
					userId: systemUser.id,
				},
				defaults: {
					userId: systemUser.id,
				},
				transaction: t,
			});
			if (shouldCommit) await t.commit();
			return systemUser;
		} catch (err) {
			if (!t.finished && shouldCommit) await t.rollback();
			throw ApiError.Internal(
				`Failed to create system user: ${err.message}`
			);
		}
	}

	/**
	 * Проверяет существование системного пользователя и создает его при необходимости
	 */
	async ensureSystemUserExists() {
		const t = await sequelize.transaction();
		try {
			const systemUser = await User.findByPk(SYSTEM_USER_ID);
			if (!systemUser) {
				logger.info(
					'System user not found, creating with ID:',
					SYSTEM_USER_ID
				);
				await this.createSystemUser(t);
			} else {
				logger.debug(
					'System user already exists with ID:',
					systemUser.id
				);
			}
			await t.commit();
		} catch (err) {
			if (!t.finished) await t.rollback();
			logger.error('Failed to ensure system user exists:', err);
			throw ApiError.Internal(
				`Failed to ensure system user exists: ${err.message}`
			);
		}
	}

	// create user
	async createUser(userId, username, referral) {
		// Валидация входных данных
		if (!userId || !username) {
			throw ApiError.withCode(
				400,
				'Missing required user data (id or username)',
				'VAL_005'
			);
		}

		// Преобразуем referral в число, если это строка
		if (typeof referral === 'string') {
			referral = BigInt(referral);
		}
		logger.debug('createUser on start', {
			userId,
			username,
			referral,
		});

		const transaction = await sequelize.transaction();
		try {
			const [user, created] = await User.findOrCreate({
				where: { id: userId },
				defaults: {
					id: userId,
					username,
					referral,
					role: 'USER',
					blocked: false,
				},
				transaction: transaction,
			});

			// Проверяем, был ли пользователь создан или уже существовал
			if (!created) {
				await transaction.rollback();
				throw ApiError.UserAlreadyExists(
					`User with ID ${userId} already exists`
				);
			}

			await transaction.commit();
			return { user, created };
		} catch (err) {
			if (!transaction.finished) await transaction.rollback();

			// Если это уже ApiError, пробрасываем как есть
			if (err instanceof ApiError) {
				throw err;
			}

			// Проверяем на дублирование по уникальному ключу
			if (err.name === 'SequelizeUniqueConstraintError') {
				throw ApiError.UserAlreadyExists(
					`User with ID ${userId} already exists`
				);
			}

			throw ApiError.DatabaseError(
				`Failed to create user: ${err.message}`
			);
		}
	}

	/**
	 * Регистрация нового пользователя с инициализацией всех необходимых данных
	 * @param {BigInt|string} userId - Идентификатор пользователя
	 * @param {string} username - Имя пользователя
	 * @param {BigInt|string} referral - Идентификатор реферала
	 * @param {Object} galaxy - Данные о галактике пользователя
	 * @returns {Promise<Object>} Данные пользователя, токены и состояние
	 */
	async registration(userId, username, referral, galaxy) {
		// Первая транзакция - создаем только пользователя
		// Если пользователь уже существует, createUser выбросит ошибку
		const { user, created } = await this.createUser(
			userId,
			username,
			referral
		);
		logger.debug('registration after create user', { user });

		const transaction = await sequelize.transaction();
		try {
			// Откладываем проверку всех deferrable ограничений
			await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
				transaction,
			});

			// Создаём DTO пользователя для токенов
			const userDto = new UserDto(user);

			// 2. Инициализируем состояние пользователя
			const [userState, createdUserState] = await UserState.findOrCreate({
				where: { userId: user.id },
				defaults: {
					userId: user.id,
				},
				transaction: transaction,
			});

			// 3. Генерируем JWT токены
			const tokens = tokenService.generateTokens({ ...userDto });
			await tokenService.saveToken(
				user.id,
				tokens.refreshToken,
				transaction
			);

			// 4. Создаём галактику для пользователя, если данные предоставлены
			const galaxyData = await Galaxy.findOne({
				where: {
					userId: user.id,
				},
				transaction: transaction,
			});
			logger.debug('registration after create user', { user });
			logger.debug('galaxy input', { galaxy });
			logger.debug('existing galaxyData', { galaxyData });

			// Объявляем переменные в начале функции
			let createdGalaxy = false;
			let userGalaxy = null;
			let userStateNew = userState.toJSON();

			logger.debug('Galaxy creation condition check', {
				hasGalaxy: !!galaxy,
				hasGalaxyData: !!galaxyData,
				shouldCreate: !!(galaxy && !galaxyData),
			});

			if (galaxy && !galaxyData) {
				logger.debug('Creating galaxy as gift', { galaxy });
				const result = await gameService.createGalaxyAsGift(
					galaxy,
					user.id,
					transaction
				);

				logger.debug('Galaxy creation result', result);
				userGalaxy = result.galaxy;
				userStateNew = result.userState;
			}
			logger.debug('registration after create galaxy', {
				userGalaxy,
				userState: userStateNew,
			});

			// 5. Инициализируем дерево апгрейдов
			await upgradeService.initializeUserUpgradeTree(
				user.id,
				transaction
			);

			// 6. Инициализируем события пользователя
			await eventService.initializeUserEvents(user.id, transaction);

			// 7. Инициализируем список задач пользователя
			await taskService.initializeUserTasks(user.id, transaction);

			// 8. Получаем системные пакеты услуг
			await packageStoreService.initializePackageStore(
				user.id,
				transaction
			);

			// Безопасно обновляем метрики Prometheus только если пользователь был создан
			if (created) {
				this.safeUpdatePrometheusMetric('userRegistration', { userId });
			}
			await transaction.commit();
			logger.debug('registration after commit', { userState });
			logger.debug('registration after commit', { userGalaxy });
			const response = {
				...tokens,
				user: userDto,
				userState: userStateNew,
				galaxy: userGalaxy,
			};
			logger.debug('User registration response', response);
			return response;
		} catch (err) {
			if (!transaction.finished) await transaction.rollback();
			// Логируем ошибку
			logger.error({
				message: `Registration failed: ${err.message}`,
				userId: userId,
				error: err.stack,
			});
			const t = await sequelize.transaction();
			await user.destroy({ transaction: t });
			await t.commit();
			// Если это уже ApiError, пробрасываем как есть
			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.DatabaseError(
				`Failed to register user ${userId}: ${err.message}`
			);
		}
	}

	/**
	 * Авторизация пользователя и получение всех связанных данных
	 * @param {BigInt|string} userId - Идентификатор пользователя
	 * @returns {Promise<Object>} Данные пользователя, токены и состояние
	 */
	async login(userId) {
		const transaction = await sequelize.transaction();
		try {
			await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
				transaction,
			});
			// 1. Проверяем существование пользователя
			const user = await User.findByPk(userId, {
				transaction: transaction,
			});

			if (!user) {
				throw ApiError.UserNotFound();
			}

			if (user.blocked) {
				throw ApiError.UserBlocked();
			}

			const userDto = new UserDto(user);

			// 2. Получаем состояние пользователя, галактики и артефакты
			const [userState, userGalaxies, userArtifacts] = await Promise.all([
				userStateService.getUserState(userDto.id, transaction),
				galaxyService.getUserGalaxies(userDto.id, transaction),
				artifactService.getUserArtifacts(userDto.id, transaction),
			]);

			// 3. Проверяем и инициализируем state, если его нет

			// 4. Обновляем и инициализируем события пользователя
			const userEvents = await eventService.checkAndTriggerEvents(
				userDto.id,
				transaction
			);

			// 5. Проверяем и инициализируем дерево апгрейдов
			if (!userState.upgrades || userState.upgrades.items.length === 0) {
				// Если дерево апгрейдов не инициализировано - инициализируем
				await upgradeService.initializeUserUpgradeTree(
					userDto.id,
					transaction
				);
			} else {
				// Если дерево существует - активируем новые доступные узлы
				await upgradeService.activateUserUpgradeNodes(
					userDto.id,
					transaction
				);
			}

			// 6. Проверяем и инициализируем задачи пользователя
			await taskService.initializeUserTasks(userDto.id, transaction);

			// 7. Проверяем и инициализируем пакеты пользователя
			await packageStoreService.initializePackageStore(
				userDto.id,
				transaction
			);

			// 8. Генерируем и сохраняем новые токены
			const tokens = tokenService.generateTokens({ ...userDto });
			await tokenService.saveToken(
				userDto.id,
				tokens.refreshToken,
				transaction
			);

			// Фиксируем транзакцию
			await transaction.commit();

			// Возвращаем результат (без дублирования данных)
			return {
				...tokens,
				user: userDto,
				userState,
				galaxies: userGalaxies,
				artifacts: userArtifacts,
				// userEvents,
				// packageOffers: packageOffers || [],
				// userTasks: [],
				// userUpgrades: [],
			};
		} catch (err) {
			// Откатываем транзакцию в случае ошибки
			if (!transaction.finished) await transaction.rollback();

			// Логируем ошибку
			logger.error(`Login failed: ${err.message}`, {
				userId: userId,
				error: err.stack,
			});
			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.DatabaseError(`Login failed: ${err.message}`);
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
