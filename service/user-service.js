/**
 * created by Tatyana Mikhniukevich on 02.06.2025
 * Сервис для работы с пользователями: регистрация, аутентификация, управление состоянием
 */
const { User, UserState } = require("../models/models");
const tokenService = require("./token-service");
const galaxyService = require("./galaxy-service");
const userStateService = require("./user-state-service");
const referralService = require("./referral-service");
const logger = require("./logger-service");
// Removed: eventService, upgradeService, taskService imports - no longer used in login
const UserDto = require("../dtos/user-dto");
const UserStateDto = require("../dtos/user-state-dto");
const ApiError = require("../exceptions/api-error");
const sequelize = require("../db");
const { Op, where } = require("sequelize");
const artifactService = require("./artifact-service");
const prometheusService = require("./prometheus-service");
const marketService = require("./market-service");
const gameService = require("./game-service");
// Removed: packageStoreService import - no longer used in login

const { SYSTEM_USER_ID, SYSTEM_USER_USERNAME } = require("../config/constants");
const { ERROR_CODES } = require("../config/error-codes");
const GAME_CONSTANTS = require("../config/game-constants");

class UserService {
	constructor() {
		// Проверяем, что prometheusService импортирован корректно
		if (!prometheusService) {
			logger.warn("PrometheusService not imported correctly");
		} else if (!prometheusService.incrementUserRegistration) {
			logger.warn(
				"PrometheusService.incrementUserRegistration method not found"
			);
		} else {
			logger.debug("PrometheusService imported successfully");
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
				if (!prometheusService || typeof prometheusService !== "object") {
					logger.debug("Prometheus service not available");
					return;
				}

				switch (metricType) {
					case "userRegistration":
						if (
							typeof prometheusService.incrementUserRegistration ===
							"function"
						) {
							prometheusService.incrementUserRegistration();
							logger.debug(
								"User registration metric incremented successfully"
							);
						} else {
							logger.debug(
								"User registration metric method not available"
							);
						}
						break;
					default:
						logger.debug(`Unknown metric type: ${metricType}`);
				}
			} catch (error) {
				logger.warn("Failed to update Prometheus metric:", {
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
			const [systemUser, created] = await User.findOrCreate({
				where: { id: SYSTEM_USER_ID },
				defaults: {
					id: SYSTEM_USER_ID,
					username: SYSTEM_USER_USERNAME,
					referral: 0,
					role: "SYSTEM",
					blocked: false,
				},
				transaction: t,
			});
			logger.debug("systemUser", systemUser);

			// Create system user state
			const systemUserState = await UserState.findOrCreate({
				where: { userId: SYSTEM_USER_ID },
				transaction: t,
			});
			logger.debug("systemUserState", systemUserState);

			if (created) {
				logger.info("System user created successfully");
			} else {
				logger.debug("System user already exists");
			}

			if (shouldCommit) await t.commit();
			return systemUser;
		} catch (err) {
			if (!t.finished && shouldCommit) await t.rollback();
			throw ApiError.withCode(
				500,
				`Failed to create system user: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
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
					"System user not found, creating with ID:",
					SYSTEM_USER_ID
				);
				const result = await this.createSystemUser(t);
				logger.info("System user and state created successfully", {
					userId: result.id,
				});
			} else {
				logger.debug("System user already exists with ID:", systemUser.id);
			}
			await t.commit();
		} catch (err) {
			if (!t.finished) await t.rollback();
			logger.error("Failed to ensure system user exists:", err);
			throw ApiError.withCode(
				500,
				`Failed to ensure system user exists: ${err.message}`,
				ERROR_CODES.SYSTEM.INTERNAL_SERVER_ERROR
			);
		}
	}

	// create user
	async createUser(userId, username, referral) {
		// Валидация входных данных
		if (!userId || !username) {
			throw ApiError.withCode(
				400,
				"Missing required user data (id or username)",
				ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
			);
		}

		// Преобразуем referral в число, если это строка
		if (typeof referral === "string") {
			referral = BigInt(referral);
		}
		logger.debug("createUser on start", {
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
					role: "USER",
					blocked: false,
				},
				transaction: transaction,
			});

			// Проверяем, был ли пользователь создан или уже существовал
			if (!created) {
				await transaction.rollback();
				throw ApiError.withCode(
					409,
					`User with ID ${userId} already exists`,
					ERROR_CODES.AUTH.USER_ALREADY_EXISTS
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
			if (err.name === "SequelizeUniqueConstraintError") {
				throw ApiError.withCode(
					409,
					`User with ID ${userId} already exists`,
					ERROR_CODES.AUTH.USER_ALREADY_EXISTS
				);
			}

			throw ApiError.withCode(
				500,
				`Failed to create user: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}

	/**
	 * Формирует единый структурированный ответ для клиента
	 * @param {Object} tokens - Токены аутентификации
	 * @param {Object} user - Данные пользователя
	 * @param {Object} userState - Состояние пользователя
	 * @param {Array} galaxies - Массив галактик пользователя
	 * @param {Array} artifacts - Массив артефактов пользователя
	 * @param {boolean} galaxyCreated - Была ли создана галактика
	 * @returns {Object} Структурированный ответ для клиента
	 */
	formatClientResponse(
		tokens,
		user,
		userState,
		galaxies,
		artifacts,
		galaxyCreated = false
	) {
		return {
			success: true,
			message: galaxyCreated ? "Registration successful" : "Login successful",
			data: {
				// Аутентификация
				auth: {
					accessToken: tokens.accessToken,
					refreshToken: tokens.refreshToken,
					expiresAt: tokens.expiresAt,
					user: {
						id: user.id,
						role: user.role,
					},
				},

				// Состояние пользователя
				userState: {
					id: userState.id,
					userId: userState.userId,
					resources: {
						stardust: userState.stardust,
						darkMatter: userState.darkMatter,
						stars: userState.stars,
						lastDailyBonus: userState.lastDailyBonus,
					},
					lockedResources: {
						stardust: userState.lockedStardust,
						darkMatter: userState.lockedDarkMatter,
						stars: userState.lockedStars,
					},
					playerParameters: userState.playerParameters,
					lastBotNotification: userState.lastBotNotification,
					createdAt: userState.createdAt,
					updatedAt: userState.updatedAt,
				},

				// Галактики пользователя
				galaxies: galaxies.map((galaxy) => ({
					id: galaxy.id,
					userId: galaxy.userId,
					name: galaxy.name,
					seed: galaxy.seed,

					// Звезды и ресурсы
					starMin: galaxy.starMin,
					starCurrent: galaxy.starCurrent,
					maxStars: galaxy.maxStars,

					// Временные метки
					birthDate: galaxy.birthDate,
					// ✅ Преобразуем lastCollectTime в timestamp для клиента
					lastCollectTime: galaxy.lastCollectTime
						? new Date(galaxy.lastCollectTime).getTime()
						: null,

					// Визуальные свойства
					galaxyType: galaxy.galaxyType,
					colorPalette: galaxy.colorPalette,
					backgroundType: galaxy.backgroundType,

					// Игровые параметры
					price: galaxy.price,
					particleCount: galaxy.particleCount,
					onParticleCountChange: galaxy.onParticleCountChange,
					galaxyProperties: galaxy.galaxyProperties,
					active: galaxy.active,

					createdAt: galaxy.createdAt,
					updatedAt: galaxy.updatedAt,
				})),

				// Артефакты пользователя
				artifacts: artifacts.map((artifact) => ({
					id: artifact.id,
					userId: artifact.userId,
					// Добавьте другие поля артефакта по необходимости
				})),

				// Game constants (added to login response)
				gameConstants: GAME_CONSTANTS,

				// Метаданные
				metadata: {
					galaxyCreated: galaxyCreated,
					timestamp: new Date().toISOString(),
					version: "1.0.0",
				},
			},
		};
	}

	/**
	 * Универсальный метод для входа пользователя: если пользователь существует - выполняет логин, если нет - регистрацию
	 * @param {BigInt|string} userId - Идентификатор пользователя
	 * @param {string} username - Имя пользователя
	 * @param {BigInt|string} referral - Идентификатор реферала - может быть null
	 * @param {Object} galaxyData - Данные о галактике пользователя (для регистрации) - может быть null
	 * @returns {Promise<Object>} Данные пользователя, токены и состояние
	 */
	async login(userId, username, referral = null, galaxyData = null) {
		const transaction = await sequelize.transaction();
		try {
			// Откладываем проверку всех deferrable ограничений в начале транзакции
			await sequelize.query("SET CONSTRAINTS ALL DEFERRED", {
				transaction,
			});

			// 1. Проверяем существование пользователя
			let user = await User.findByPk(userId, {
				transaction: transaction,
			});

			let isNewUser = false;

			// Если пользователь не существует, создаем нового пользователя
			if (!user && userId) {
				logger.debug("User not found, creating new user", {
					userId,
					username: username || null,
					referral: referral || null,
					hasGalaxyData: !!galaxyData,
				});

				// Создаем пользователя явно
				user = await User.create(
					{
						id: userId,
						username: username || null,
						referral: referral || 0,
						role: "USER",
					},
					{
						transaction: transaction,
					}
				);

				isNewUser = true;
			}

			// Если пользователь все еще не найден
			if (!user) {
				await transaction.rollback();
				throw ApiError.withCode(
					404,
					"User not found",
					ERROR_CODES.AUTH.USER_NOT_FOUND
				);
			}

			// Проверяем, не заблокирован ли пользователь
			if (user.blocked) {
				await transaction.rollback();
				throw ApiError.withCode(
					403,
					"User account is blocked",
					ERROR_CODES.AUTH.USER_BLOCKED
				);
			}

			const userDto = new UserDto(user);

			// 2. Если это новый пользователь, выполняем инициализацию
			if (isNewUser) {
				logger.debug("Initializing new user", { userId });

				// ✅ УБИРАЕМ: создание UserState здесь - пусть user-state-service сам создает с константами
				let userStateNew;
				logger.debug("Initializing UserState with constants", {
					userId: user.id,
				});

				userStateNew = await userStateService.createUserState(
					user.id,
					{}, // ✅ Передаем пустой объект - user-state-service использует дефолты
					transaction
				);

				// Объявляем переменную для галактики
				let userGalaxy = null;

				// Генерируем JWT токены
				const tokens = tokenService.generateTokens({ ...userDto });
				await tokenService.saveToken(
					user.id,
					tokens.refreshToken,
					transaction
				);

				// ✅ Обрабатываем реферальную систему если есть referral код
				if (referral && referral !== 0) {
					logger.debug("Processing referral for new user", {
						refereeId: user.id,
						referrerId: referral,
					});

					try {
						await referralService.processReferral(
							referral,
							user.id,
							transaction
						);
						logger.info("Referral rewards processed successfully", {
							refereeId: user.id,
							referrerId: referral,
						});
					} catch (referralError) {
						// Логируем ошибку с полным стеком
						logger.error(
							"Failed to process referral rewards, but registration will continue",
							{
								refereeId: user.id,
								referrerId: referral,
								error: referralError.message,
								stack: referralError.stack,
								code: referralError.code,
								errorCode: referralError.errorCode,
							}
						);
						// ⚠️ ВРЕМЕННО: бросаем ошибку чтобы увидеть проблему
						// throw referralError;
					}
				}

				// Коммитим всю транзакцию
				await sequelize.query("SET CONSTRAINTS ALL IMMEDIATE", {
					transaction,
				});
				await transaction.commit();
				logger.debug("All registration data committed to database", {
					userId: user.id,
				});

				if (galaxyData && isNewUser) {
					logger.debug(
						"Creating galaxy as gift after main transaction commit",
						{ galaxyData }
					);
					try {
						const galaxyTransaction = await sequelize.transaction();
						const offer = { price: 0, currency: "tonToken" };
						try {
							const result = await gameService.createGalaxyWithOffer(
								galaxyData,
								user.id,
								offer,
								galaxyTransaction
							);
							logger.debug("Galaxy creation result", result);
							userGalaxy = result.galaxy;
							userStateNew = result.userState;
							await galaxyTransaction.commit();
						} catch (galaxyError) {
							await galaxyTransaction.rollback();
							logger.error("Failed to create galaxy", galaxyError);
						}
					} catch (galaxyError) {
						logger.error("Failed to create galaxy", galaxyError);
					}
				} else if (isNewUser && !galaxyData) {
					logger.debug(
						"New user registered without galaxy data - galaxy will not be created",
						{ userId: user.id }
					);
				}

				// Получаем галактики и артефакты для нового пользователя
				const userGalaxies = userGalaxy ? [userGalaxy] : [];
				const userArtifacts = [];

				// Формируем структурированный ответ для клиента
				const response = this.formatClientResponse(
					tokens,
					userDto,
					userStateNew,
					userGalaxies,
					userArtifacts,
					!!userGalaxy
				);

				logger.debug("User registration response", response);
				return response;
			} else {
				// 3. Для существующего пользователя выполняем логин
				logger.debug("User exists, performing login", { userId });

				// Получаем состояние пользователя, галактики и артефакты
				const [userState, userGalaxiesResponse, userArtifacts] =
					await Promise.all([
						userStateService.getUserState(userDto.id, transaction),
						galaxyService.getUserGalaxies(userDto.id, transaction),
						artifactService.getUserArtifacts(userDto.id, transaction),
					]);

				// Извлекаем галактики из нового формата ответа
				const userGalaxies = userGalaxiesResponse.galaxies || [];

				// Removed: User initialization - handled by separate endpoints

				// Генерируем и сохраняем новые токены
				const tokens = tokenService.generateTokens({ ...userDto });
				await tokenService.saveToken(
					userDto.id,
					tokens.refreshToken,
					transaction
				);

				// Устанавливаем ограничения обратно в немедленные перед коммитом
				await sequelize.query("SET CONSTRAINTS ALL IMMEDIATE", {
					transaction,
				});

				// Фиксируем транзакцию
				await transaction.commit();

				// Формируем структурированный ответ для клиента
				return this.formatClientResponse(
					tokens,
					userDto,
					userState,
					userGalaxies,
					userArtifacts,
					false // galaxyCreated = false для существующих пользователей
				);
			}
		} catch (err) {
			// Откатываем транзакцию в случае ошибки
			if (!transaction.finished) {
				await transaction.rollback();
			}

			// Логируем ошибку
			logger.error({
				message: `Login failed: ${err.message}`,
				userId: userId,
				error: err.stack,
			});

			// Если это уже ApiError, пробрасываем как есть
			if (err instanceof ApiError) {
				throw err;
			}

			// Проверяем на дублирование по уникальному ключу
			if (err.name === "SequelizeUniqueConstraintError") {
				throw ApiError.withCode(
					409,
					`User with ID ${userId} already exists`,
					ERROR_CODES.AUTH.USER_ALREADY_EXISTS
				);
			}

			throw ApiError.withCode(
				500,
				`Failed to login user ${userId}: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
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
				throw ApiError.withCode(
					401,
					"Refresh token is required",
					ERROR_CODES.AUTH.INVALID_TOKEN
				);
			}

			// Валидируем токен
			const userData = tokenService.validateRefreshToken(refreshToken);
			if (!userData) {
				await t.rollback();
				throw ApiError.withCode(
					401,
					"Invalid refresh token",
					ERROR_CODES.AUTH.INVALID_TOKEN
				);
			}

			// Проверяем наличие токена в базе данных
			const tokenFromDb = await tokenService.findToken(refreshToken, t);
			if (!tokenFromDb) {
				await t.rollback();
				throw ApiError.withCode(
					401,
					"Refresh token not found in database",
					ERROR_CODES.AUTH.INVALID_TOKEN
				);
			}

			// Проверяем существование пользователя
			const user = await User.findByPk(userData.id, { transaction: t });
			if (!user) {
				await t.rollback();
				throw ApiError.withCode(
					404,
					"User not found",
					ERROR_CODES.AUTH.USER_NOT_FOUND
				);
			}

			// Проверяем, не заблокирован ли пользователь
			if (user.blocked) {
				await t.rollback();
				throw ApiError.withCode(
					403,
					"User is blocked",
					ERROR_CODES.AUTH.USER_BLOCKED
				);
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
			throw ApiError.withCode(
				500,
				`Token refresh failed: ${err.message}`,
				ERROR_CODES.SYSTEM.INTERNAL_SERVER_ERROR
			);
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
				throw ApiError.withCode(
					400,
					"User ID is required",
					ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
				);
			}

			// Проверяем существование пользователя
			const user = await User.findByPk(userId, { transaction: t });
			if (!user) {
				await t.rollback();
				throw ApiError.withCode(
					404,
					`User with ID ${id} not found`,
					ERROR_CODES.AUTH.USER_NOT_FOUND
				);
			}

			// Получаем список друзей (пользователей, которые указали данного пользователя как реферала)
			const friends = await User.findAll({
				where: { referral: userId },
				attributes: ["id", "username", "referral", "createdAt"],
				include: [
					{
						model: UserState,
						attributes: ["state"],
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
			throw ApiError.withCode(
				500,
				`Failed to get friends: ${err.message}`,
				ERROR_CODES.SYSTEM.INTERNAL_SERVER_ERROR
			);
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
				throw ApiError.withCode(
					404,
					"System user not found",
					ERROR_CODES.AUTH.USER_NOT_FOUND
				);
			}

			return systemUser;
		} catch (err) {
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.withCode(
				500,
				`Failed to get system user: ${err.message}`,
				ERROR_CODES.SYSTEM.INTERNAL_SERVER_ERROR
			);
		}
	}
}

module.exports = new UserService();
