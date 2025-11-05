/**
 * created by Tatyana Mikhniukevich on 28.05.2025
 */
const axios = require("axios");
const speakeasy = require("speakeasy");
const { Admin, AdminInvite } = require("../models/models");
const { Op } = require("sequelize");
const tokenService = require("./token-service");
const passwordService = require("./password-service");
const ApiError = require("../exceptions/api-error");
const logger = require("./logger-service");

class AdminService {
	// Флаг для отслеживания инициализации супервизора
	static supervisorInitialized = false;

	/**
	 * Google OAuth аутентификация для администраторов
	 * @param {string} accessToken - Google OAuth access token
	 * @returns {Object} - Результат OAuth аутентификации
	 */
	async googleOAuth(accessToken) {
		if (!accessToken) {
			throw ApiError.BadRequest("Google access token is required");
		}

		logger.info("Google OAuth attempt", { accessToken: "present" });

		try {
			// Получаем информацию о пользователе от Google
			const googleResponse = await axios.get(
				"https://www.googleapis.com/oauth2/v2/userinfo",
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				}
			);

			const googleUser = googleResponse.data;
			logger.info("Google user info received", {
				email: googleUser.email,
				id: googleUser.id,
				name: googleUser.name,
			});

			// Ищем админа по Google ID или email
			let admin = await Admin.findOne({
				where: {
					[Op.or]: [
						{ google_id: googleUser.id },
						{ email: googleUser.email },
					],
					role: { [Op.in]: ["ADMIN", "SUPERVISOR"] },
				},
			});

			// Если админ не найден, создаем нового
			if (!admin) {
				logger.info("Creating new admin from Google OAuth", {
					email: googleUser.email,
					googleId: googleUser.id,
				});

				// Генерируем секрет для Google 2FA
				const google2faSecret = speakeasy.generateSecret({
					length: 20,
					name: `Admin (${googleUser.email})`,
					issuer: "Nebulahunt",
				});

				admin = await Admin.create({
					email: googleUser.email,
					google_id: googleUser.id,
					name: googleUser.name,
					role: "ADMIN",
					google2faSecret: google2faSecret.base32,
					is_2fa_enabled: true,
					blocked: false,
				});

				logger.info("New admin created from Google OAuth", {
					id: admin.id,
					email: admin.email,
				});
			} else {
				// Обновляем Google ID если его не было
				if (!admin.google_id) {
					admin.google_id = googleUser.id;
					await admin.save();
					logger.info("Updated admin with Google ID", {
						id: admin.id,
						google_id: googleUser.id,
					});
				}
			}

			// Проверяем, что аккаунт не заблокирован
			if (admin.blocked) {
				logger.warn("Google OAuth failed: account blocked", {
					email: admin.email,
				});
				throw ApiError.Forbidden("Account is blocked");
			}

			// Проверяем, что 2FA настроен
			if (!admin.is_2fa_enabled) {
				logger.warn("Google OAuth failed: 2FA not enabled", {
					email: admin.email,
				});
				throw ApiError.Forbidden("2FA not enabled for this account");
			}

			logger.info("Google OAuth successful, requires 2FA", {
				id: admin.id,
				email: admin.email,
			});

			return {
				message: "Please enter 2FA code",
				requires2FA: true,
				userData: {
					id: admin.id,
					email: admin.email,
					name: admin.name,
					role: admin.role,
					provider: "google",
					providerId: googleUser.id,
				},
			};
		} catch (error) {
			if (error instanceof ApiError) {
				throw error;
			}
			logger.error("Google OAuth error", { error: error.message });
			throw ApiError.UnauthorizedError("Google OAuth failed");
		}
	}

	/**
	 * 2FA верификация для Google OAuth
	 * @param {string} provider - Провайдер OAuth ('google')
	 * @param {string} otp - 2FA код
	 * @param {Object} oauthData - Данные OAuth
	 * @returns {Object} - Результат верификации с токенами
	 */
	async oauth2FAVerify(provider, otp, oauthData) {
		if (!provider || !otp) {
			throw ApiError.BadRequest("Provider and OTP are required");
		}

		logger.info("OAuth 2FA verification attempt", { provider });

		try {
			let admin;

			if (provider === "google") {
				const { accessToken } = oauthData;

				// Получаем информацию о пользователе от Google
				const googleResponse = await axios.get(
					"https://www.googleapis.com/oauth2/v2/userinfo",
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
						},
					}
				);

				const googleUser = googleResponse.data;

				// Ищем админа по Google ID
				admin = await Admin.findOne({
					where: {
						google_id: googleUser.id,
						role: { [Op.in]: ["ADMIN", "SUPERVISOR"] },
					},
				});

				if (!admin) {
					throw ApiError.Forbidden("Admin not found");
				}
			} else {
				throw ApiError.BadRequest("Unsupported OAuth provider");
			}

			// Проверяем 2FA код
			const verified = speakeasy.totp.verify({
				secret: admin.google2faSecret,
				encoding: "base32",
				token: otp,
				window: 1, // допускаем +/- 30 сек
			});

			if (!verified) {
				logger.warn("OAuth 2FA verification failed: invalid code", {
					provider,
					email: admin.email,
				});
				throw ApiError.UnauthorizedError("Invalid 2FA code");
			}

			logger.info("OAuth 2FA verification successful", {
				provider,
				id: admin.id,
				email: admin.email,
			});

			// Генерируем токены и возвращаем результат
			return await this.generateAdminTokensAndResponse(
				admin,
				"OAuth 2FA verification successful"
			);
		} catch (error) {
			if (error instanceof ApiError) {
				throw error;
			}
			logger.error("OAuth 2FA verification error", {
				error: error.message,
			});
			throw ApiError.UnauthorizedError("2FA verification failed");
		}
	}

	/**
	 * Поиск админа по email
	 * @param {string} email - Email админа
	 * @returns {Object|null} - Найденный админ или null
	 */
	async findAdminByEmail(email) {
		if (!email) {
			return null;
		}

		logger.info("Searching for admin by email", { email });

		try {
			const admin = await Admin.findOne({
				where: {
					email: email.toLowerCase(),
					role: { [Op.in]: ["ADMIN", "SUPERVISOR"] },
				},
				order: [["id", "ASC"]],
			});

			if (admin) {
				logger.info("Admin found", {
					id: admin.id,
					email: admin.email,
					role: admin.role,
					is_2fa_enabled: admin.is_2fa_enabled,
					blocked: admin.blocked,
				});
			} else {
				logger.info("Admin not found", { email });
			}

			return admin;
		} catch (error) {
			logger.error("Error finding admin by email", {
				error: error.message,
				email,
			});
			throw error;
		}
	}

	/**
	 * Удаление токена админа
	 * @param {string} refreshToken - Refresh токен для удаления
	 */
	async removeAdminToken(refreshToken) {
		await tokenService.removeAdminToken(refreshToken);
	}

	/**
	 * Обновление JWT токена админа
	 * @param {string} refreshToken - Refresh token
	 * @returns {Object} - Новые токены и данные админа
	 */
	async refreshToken(refreshToken) {
		if (!refreshToken) {
			throw ApiError.BadRequest("Refresh token is required");
		}

		logger.info("Admin token refresh attempt");

		try {
			// Валидируем refresh token
			const userData = tokenService.validateRefreshToken(refreshToken);

			// Ищем токен в базе данных
			const tokenFromDb = await tokenService.findAdminToken(refreshToken);
			if (!tokenFromDb) {
				logger.warn(
					"Admin token refresh failed: token not found in database"
				);
				throw ApiError.UnauthorizedError("Invalid refresh token");
			}

			// Находим админа
			const admin = await Admin.findOne({ where: { id: userData.id } });
			if (!admin) {
				logger.warn("Admin token refresh failed: admin not found", {
					adminId: userData.id,
				});
				throw ApiError.UnauthorizedError("Admin not found");
			}

			// Проверяем, что аккаунт не заблокирован
			if (admin.blocked) {
				logger.warn("Admin token refresh failed: account blocked", {
					adminId: admin.id,
				});
				throw ApiError.Forbidden("Account is blocked");
			}

			// Генерируем новые токены
			const payload = {
				id: admin.id,
				email: admin.email,
				username: admin.name, // Map name to username for frontend compatibility
				firstName: admin.name?.split(" ")[0] || "",
				lastName: admin.name?.split(" ").slice(1).join(" ") || "",
				role: admin.role,
				provider: "google",
				providerId: admin.google_id,
			};
			const tokens = tokenService.generateTokens(payload);

			// Сохраняем новый refresh token
			await tokenService.saveAdminToken(admin.id, tokens.refreshToken);

			// Удаляем старый refresh token
			await tokenService.removeAdminToken(refreshToken);

			logger.info("Admin token refresh successful", {
				adminId: admin.id,
				email: admin.email,
			});

			return {
				message: "Token refreshed successfully",
				email: admin.email,
				id: admin.id,
				username: admin.name,
				firstName: admin.name?.split(" ")[0] || "",
				lastName: admin.name?.split(" ").slice(1).join(" ") || "",
				role: admin.role,
				provider: "google",
				providerId: admin.google_id,
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
			};
		} catch (error) {
			logger.error("Admin token refresh error", {
				error: error.message,
			});
			throw error;
		}
	}

	/**
	 * Генерация токенов и ответа для админа
	 * @param {Object} admin - Объект админа
	 * @param {string} message - Сообщение
	 * @returns {Object} - Ответ с токенами и данными пользователя
	 */
	async generateAdminTokensAndResponse(admin, message, provider = "google") {
		// Генерируем JWT-токены для админа
		const payload = {
			id: admin.id,
			email: admin.email,
			username: admin.name,
			firstName: admin.name?.split(" ")[0] || "",
			lastName: admin.name?.split(" ").slice(1).join(" ") || "",
			role: admin.role,
			provider: provider,
			providerId: admin.google_id || null,
		};
		const tokens = tokenService.generateTokens(payload);

		// Сохраняем refresh токен
		await tokenService.saveAdminToken(admin.id, tokens.refreshToken);

		return {
			message,
			email: admin.email,
			id: admin.id,
			username: admin.name,
			firstName: admin.name?.split(" ")[0] || "",
			lastName: admin.name?.split(" ").slice(1).join(" ") || "",
			role: admin.role,
			provider: provider,
			providerId: admin.google_id || null,
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
		};
	}

	/**
	 * Авторизация админа через email и пароль
	 */
	async loginAdminWithPassword(email, password) {
		if (!email || !password) {
			throw ApiError.BadRequest("Email and password are required");
		}

		logger.info("Admin password login attempt", { email });

		const admin = await this.findAdminByEmail(email);
		if (!admin) {
			throw ApiError.UnauthorizedError("Invalid email or password");
		}

		if (admin.blocked) {
			throw ApiError.Forbidden("Account is blocked");
		}

		// Проверяем блокировку аккаунта
		const lockCheck = passwordService.checkAccountLock(admin);
		if (lockCheck.isLocked) {
			throw ApiError.Forbidden(
				`Account is locked. Try again in ${lockCheck.minutesLeft} minutes.`
			);
		}

		// Проверяем пароль
		if (!admin.password) {
			await passwordService.handleFailedLogin(admin);
			throw ApiError.UnauthorizedError("Invalid email or password");
		}

		const isPasswordValid = await passwordService.comparePassword(
			password,
			admin.password
		);
		if (!isPasswordValid) {
			await passwordService.handleFailedLogin(admin);
			throw ApiError.UnauthorizedError("Invalid email or password");
		}

		// Проверяем срок действия пароля
		const passwordCheck = passwordService.checkPasswordChangeRequired(admin);
		if (passwordCheck.changeRequired) {
			throw ApiError.ForbiddenError(passwordCheck.message);
		}

		// Сбрасываем счетчик неудачных попыток
		await passwordService.resetLoginAttempts(admin);

		// Проверяем, что 2FA настроен
		if (!admin.is_2fa_enabled) {
			logger.warn("Password login failed: 2FA not enabled", {
				email: admin.email,
			});
			throw ApiError.Forbidden("2FA not enabled for this account");
		}

		logger.info("Admin password login successful, requires 2FA", { email });

		return {
			message: "Please enter 2FA code",
			requires2FA: true,
			userData: {
				id: admin.id,
				email: admin.email,
				name: admin.name,
				role: admin.role,
				provider: "password",
			},
			// Добавляем информацию о пароле
			passwordWarning: passwordCheck.warning,
			passwordDaysLeft: passwordCheck.daysLeft,
			passwordMessage: passwordCheck.message,
		};
	}

	/**
	 * 2FA верификация для входа через пароль
	 * @param {string} email - Email пользователя
	 * @param {string} otp - 2FA код
	 * @returns {Object} - Результат верификации с токенами
	 */
	async password2FAVerify(email, otp) {
		if (!email || !otp) {
			throw ApiError.BadRequest("Email and OTP are required");
		}

		logger.info("Password 2FA verification attempt", { email });

		const admin = await this.findAdminByEmail(email);
		if (!admin) {
			throw ApiError.UnauthorizedError("Invalid email or password");
		}

		if (admin.blocked) {
			throw ApiError.Forbidden("Account is blocked");
		}

		// Проверяем 2FA код
		const verified = speakeasy.totp.verify({
			secret: admin.google2faSecret,
			encoding: "base32",
			token: otp,
			window: 1, // допускаем +/- 30 сек
		});

		if (!verified) {
			logger.warn("Password 2FA verification failed: invalid code", {
				email: admin.email,
			});
			throw ApiError.UnauthorizedError("Invalid 2FA code");
		}

		logger.info("Password 2FA verification successful", {
			id: admin.id,
			email: admin.email,
		});

		const response = await this.generateAdminTokensAndResponse(
			admin,
			"Admin login successful",
			"password"
		);

		return response;
	}

	/**
	 * Авторизация админа через email (устаревший метод)
	 * @param {string} email - Email пользователя
	 * @returns {Object} - Данные админа и токены
	 */
	async loginAdmin(email) {
		if (!email) {
			throw ApiError.BadRequest("Email is required");
		}

		logger.info("Admin login attempt (deprecated)", { email });

		// Проверяем, что пользователь существует и имеет роль ADMIN
		const admin = await this.findAdminByEmail(email);
		if (!admin) {
			logger.warn("Admin login failed: user not found", {
				email,
			});
			throw ApiError.Forbidden("Access denied - user not found");
		}

		logger.info("Admin found", {
			id: admin.id,
			email: admin.email,
			role: admin.role,
			is_2fa_enabled: admin.is_2fa_enabled,
			blocked: admin.blocked,
		});

		// Проверяем, что аккаунт не заблокирован
		if (admin.blocked) {
			logger.warn("Admin login failed: account blocked", {
				email,
			});
			throw ApiError.Forbidden("Account is blocked");
		}

		// Проверяем, что 2FA настроен
		if (!admin.is_2fa_enabled) {
			logger.warn("Admin login failed: 2FA not enabled", {
				email,
			});
			throw ApiError.Forbidden("2FA not enabled for this account");
		}

		logger.info("Admin login successful", {
			id: admin.id,
			email: admin.email,
		});

		return {
			message: "Please enter 2FA code",
			email: admin.email,
			id: admin.id,
			role: admin.role,
			requires2FA: true,
		};
	}

	/**
	 * Инициализация админа (назначение роли ADMIN пользователю)
	 * @param {string} email - Email пользователя
	 * @param {string} secretKey - Секретный ключ для инициализации админа
	 * @returns {Object} - Данные инициализированного админа
	 */
	async initAdmin(email, secretKey) {
		const EXPECTED_SECRET = process.env.ADMIN_INIT_SECRET || "supersecret";

		// Проверяем секретный ключ
		if (secretKey !== EXPECTED_SECRET) {
			logger.warn("Admin init failed: invalid secret key");
			throw ApiError.Forbidden("Invalid secret key");
		}

		// Находим пользователя по email
		const user = await this.findAdminByEmail(email);
		if (!user) {
			throw ApiError.BadRequest("User with this email not found");
		}
		if (user.role === "ADMIN") {
			throw ApiError.BadRequest("User is already admin");
		}

		// Генерируем секрет для Google 2FA
		const google2faSecret = speakeasy.generateSecret({
			length: 20,
			name: `Admin (${user.email})`,
			issuer: "Nebulahunt",
		});

		// Обновляем пользователя
		user.role = "ADMIN";
		user.google2faSecret = google2faSecret.base32;
		user.is_2fa_enabled = true;
		await user.save();

		logger.info("Admin initialized", {
			id: user.id,
			email: user.email,
		});

		return {
			message: "Admin initialized",
			email: user.email,
			id: user.id,
			google2faSecret: google2faSecret.base32,
			otpAuthUrl: google2faSecret.otpauth_url,
		};
	}

	/**
	 * Проверка 2FA кода для админа (устаревший метод)
	 * @param {string} email - Email админа
	 * @param {string} otp - 2FA код
	 * @returns {Object} - Результат верификации с токенами
	 */
	async verify2FA(email, otp) {
		if (!email || !otp) {
			throw ApiError.BadRequest("Email and OTP are required");
		}

		logger.info("2FA verification attempt (deprecated)", { email });

		// Проверяем, что пользователь существует и имеет роль ADMIN
		const admin = await this.findAdminByEmail(email);
		if (!admin) {
			logger.warn("2FA verification failed: user not found or not admin", {
				email,
			});
			throw ApiError.Forbidden("Access denied");
		}

		// Проверяем, что 2FA включен
		if (!admin.is_2fa_enabled || !admin.google2faSecret) {
			logger.warn("2FA verification failed: 2FA not enabled", {
				email,
			});
			throw ApiError.Forbidden("2FA not enabled for this account");
		}

		// Проверяем 2FA код
		const verified = speakeasy.totp.verify({
			secret: admin.google2faSecret,
			encoding: "base32",
			token: otp,
			window: 1, // допускаем +/- 30 сек
		});

		if (!verified) {
			logger.warn("2FA verification failed: invalid code", {
				email,
			});
			throw ApiError.UnauthorizedError("Invalid 2FA code");
		}

		logger.info("2FA verification successful", { id: admin.id });

		return await this.generateAdminTokensAndResponse(
			admin,
			"2FA verification successful"
		);
	}

	/**
	 * Инициализация супервайзера через email из переменной окружения
	 * @returns {Object} - Данные инициализированного супервайзера
	 */
	async initSupervisor() {
		// Проверяем, была ли уже выполнена инициализация
		if (AdminService.supervisorInitialized) {
			logger.info("Supervisor initialization already completed, skipping...");
			return {
				message: "Supervisor initialization already completed",
				skipped: true,
			};
		}

		const supervisorEmail = process.env.SUPERVISOR_EMAIL;
		if (!supervisorEmail) {
			throw ApiError.Internal("SUPERVISOR_EMAIL not configured");
		}

		logger.info("Checking for existing supervisor...", {
			email: supervisorEmail,
		});

		try {
			// Проверяем, существует ли уже супервизор
			const existingSupervisor = await this.findAdminByEmail(supervisorEmail);

			// Проверяем, что супервизор существует и имеет валидный ID
			if (
				existingSupervisor &&
				existingSupervisor.role === "SUPERVISOR" &&
				existingSupervisor.id > 0
			) {
				logger.info("Supervisor already exists", {
					email: supervisorEmail,
					id: existingSupervisor.id,
					role: existingSupervisor.role,
					is_2fa_enabled: existingSupervisor.is_2fa_enabled,
				});
				// Отмечаем инициализацию как завершенную
				AdminService.supervisorInitialized = true;
				return {
					message: "Supervisor already exists",
					email: existingSupervisor.email,
					id: existingSupervisor.id,
				};
			}

			logger.info("Creating new supervisor...", {
				email: supervisorEmail,
			});

			// Создаем нового супервайзера
			const google2faSecret = speakeasy.generateSecret({
				length: 20,
				name: `Supervisor (${supervisorEmail})`,
				issuer: "Nebulahunt",
			});

			const supervisor = await Admin.create({
				email: supervisorEmail,
				name: "Supervisor",
				role: "SUPERVISOR",
				google2faSecret: google2faSecret.base32,
				is_2fa_enabled: true,
				blocked: false,
			});

			// Устанавливаем пароль супервизора из переменной окружения
			const supervisorPassword = process.env.SUPERVISOR_PASSWORD;
			if (supervisorPassword) {
				await passwordService.setPasswordWithExpiry(
					supervisor,
					supervisorPassword
				);
				logger.info("Supervisor password set from environment variable");
			}

			logger.info("Supervisor created successfully", {
				id: supervisor.id,
				email: supervisor.email,
				role: supervisor.role,
			});

			// Отмечаем инициализацию как завершенную
			AdminService.supervisorInitialized = true;

			return {
				message: "Supervisor initialized successfully",
				email: supervisor.email,
				id: supervisor.id,
				google2faSecret: google2faSecret.base32,
				otpAuthUrl: google2faSecret.otpauth_url,
			};
		} catch (error) {
			if (error.name === "SequelizeUniqueConstraintError") {
				logger.info("Supervisor already exists (unique constraint)", {
					email: supervisorEmail,
				});
				AdminService.supervisorInitialized = true;
				return {
					message: "Supervisor already exists",
					email: supervisorEmail,
				};
			}
			logger.error("Supervisor initialization error", {
				error: error.message,
			});
			throw error;
		}
	}

	/**
	 * Завершение настройки 2FA при регистрации
	 * @param {string} email - Email админа
	 * @param {string} otp - 2FA код
	 * @param {string} inviteToken - Токен приглашения
	 */
	async complete2FA(email, otp, inviteToken) {
		if (!email || !otp) {
			throw ApiError.BadRequest("Email and OTP are required");
		}

		logger.info("Complete 2FA attempt", { email });

		// Находим админа
		const admin = await this.findAdminByEmail(email);
		if (!admin) {
			throw ApiError.BadRequest("Admin not found");
		}

		// Проверяем 2FA код
		const verified = speakeasy.totp.verify({
			secret: admin.google2faSecret,
			encoding: "base32",
			token: otp,
			window: 1,
		});

		if (!verified) {
			throw ApiError.UnauthorizedError("Invalid 2FA code");
		}

		// Если это регистрация через приглашение, валидируем токен
		if (inviteToken && inviteToken !== "existing-admin") {
			const invite = await this.validateInviteToken(inviteToken);
			if (!invite) {
				throw ApiError.BadRequest("Invalid invite token");
			}
			// Отмечаем приглашение как использованное
			await this.markInviteAsUsed(inviteToken, admin.id);
		}

		logger.info("2FA setup completed", { id: admin.id, email });

		return {
			message: "2FA setup completed successfully",
		};
	}

	/**
	 * Настройка 2FA для существующего администратора
	 * @param {number} adminId - ID администратора
	 * @param {string} email - Email администратора
	 * @returns {Object} - Результат настройки 2FA
	 */
	async setup2FA(adminId, email) {
		if (!adminId || !email) {
			throw ApiError.BadRequest("Admin ID and email required");
		}

		logger.info("2FA setup attempt", { adminId, email });

		// Находим админа
		const admin = await Admin.findByPk(adminId);
		if (!admin) {
			throw ApiError.BadRequest("Admin not found");
		}

		// Проверяем, что 2FA еще не включен
		if (admin.is_2fa_enabled && admin.google2faSecret) {
			throw ApiError.BadRequest("2FA is already enabled for this account");
		}

		// Генерируем новый секрет для Google 2FA
		const google2faSecret = speakeasy.generateSecret({
			length: 20,
			name: `Nebulahunt Admin (${admin.email})`,
		});

		// Обновляем админа
		admin.google2faSecret = google2faSecret.base32;
		admin.is_2fa_enabled = true;
		await admin.save();

		logger.info("2FA setup initiated", { id: admin.id, email });

		return {
			message: "2FA setup initiated",
			google2faSecret: google2faSecret.base32,
			otpAuthUrl: google2faSecret.otpauth_url,
		};
	}

	/**
	 * Отключение 2FA
	 * @param {number} adminId - ID администратора
	 * @param {string} email - Email администратора
	 */
	async disable2FA(adminId, email) {
		if (!adminId || !email) {
			throw ApiError.BadRequest("Admin ID and email required");
		}

		logger.info("2FA disable attempt", { adminId, email });

		// Находим админа
		const admin = await Admin.findByPk(adminId);
		if (!admin) {
			throw ApiError.BadRequest("Admin not found");
		}

		// Проверяем, что 2FA включен
		if (!admin.is_2fa_enabled || !admin.google2faSecret) {
			throw ApiError.BadRequest("2FA is not enabled for this account");
		}

		// Отключаем 2FA
		admin.google2faSecret = null;
		admin.is_2fa_enabled = false;
		await admin.save();

		logger.info("2FA disabled", { id: admin.id, email });
	}

	/**
	 * Получение информации о 2FA (QR код и секрет)
	 * @param {number} adminId - ID администратора
	 * @returns {Object} - Информация о 2FA
	 */
	async get2FAInfo(adminId) {
		if (!adminId) {
			throw ApiError.BadRequest("Admin ID required");
		}

		logger.info("2FA info request", { adminId });

		// Находим админа
		const admin = await Admin.findByPk(adminId);
		if (!admin) {
			throw ApiError.BadRequest("Admin not found");
		}

		// Проверяем, что 2FA включен
		if (!admin.is_2fa_enabled || !admin.google2faSecret) {
			throw ApiError.BadRequest("2FA is not enabled for this account");
		}

		// Генерируем otpauth URL для QR кода
		const otpAuthUrl = `otpauth://totp/Admin%20(${admin.email})?secret=${admin.google2faSecret}&issuer=Nebulahunt`;

		logger.info("2FA info retrieved", { id: admin.id, email: admin.email });

		return {
			message: "2FA info retrieved successfully",
			google2faSecret: admin.google2faSecret,
			otpAuthUrl: otpAuthUrl,
			is2FAEnabled: admin.is_2fa_enabled,
		};
	}

	/**
	 * Получение QR кода 2FA для входа (без аутентификации)
	 * @param {string} email - Email админа
	 * @returns {Object} - QR код и секрет для 2FA
	 */
	async get2FAQRForLogin(email) {
		if (!email) {
			throw ApiError.BadRequest("Email required");
		}

		logger.info("2FA QR code request for login", { email });

		// Находим админа по email
		const admin = await Admin.findOne({
			where: {
				email: email.toLowerCase(),
				role: { [Op.in]: ["ADMIN", "SUPERVISOR"] },
			},
		});

		if (!admin) {
			throw ApiError.NotFound("Admin not found");
		}

		// Проверяем, что 2FA включен
		if (!admin.is_2fa_enabled || !admin.google2faSecret) {
			throw ApiError.BadRequest("2FA is not enabled for this account");
		}

		// Генерируем otpauth URL для QR кода
		const otpAuthUrl = `otpauth://totp/Admin%20(${admin.email})?secret=${admin.google2faSecret}&issuer=Nebulahunt`;

		logger.info("2FA QR code retrieved for login", {
			id: admin.id,
			email: admin.email,
		});

		return {
			message: "2FA QR code retrieved successfully",
			google2faSecret: admin.google2faSecret,
			otpAuthUrl: otpAuthUrl,
			email: admin.email,
			name: admin.name,
		};
	}

	/**
	 * Регистрация админа через приглашение
	 * @param {string} email - Email админа
	 * @param {string} password - Пароль (не используется в OAuth)
	 * @param {string} name - Имя админа
	 * @param {string} inviteToken - Токен приглашения
	 * @returns {Object} - Данные зарегистрированного админа
	 */
	async registerAdmin(email, password, name, inviteToken) {
		if (!email || !name || !inviteToken) {
			throw ApiError.BadRequest("Email, name and inviteToken are required");
		}

		logger.info("Admin registration attempt", { email, name });

		// Валидируем токен приглашения
		const invite = await this.validateInviteToken(inviteToken);
		if (!invite) {
			throw ApiError.BadRequest("Invalid invite token");
		}

		// Проверяем, что приглашение не истекло
		if (invite.expiresAt < new Date()) {
			throw ApiError.BadRequest("Invite token expired");
		}

		// Проверяем, что приглашение не использовано
		if (invite.used) {
			throw ApiError.BadRequest("Invite token already used");
		}

		// Проверяем, что email совпадает
		if (invite.email !== email) {
			throw ApiError.BadRequest("Email does not match invite");
		}

		// Генерируем секрет для Google 2FA
		const google2faSecret = speakeasy.generateSecret({
			length: 20,
			name: `Admin (${email})`,
			issuer: "Nebulahunt",
		});

		// Создаем админа
		const admin = await Admin.create({
			email: email.toLowerCase(),
			name: name,
			role: invite.role,
			google2faSecret: google2faSecret.base32,
			is_2fa_enabled: true,
			blocked: false,
		});

		// Устанавливаем пароль, если он предоставлен
		if (password) {
			await passwordService.setPasswordWithExpiry(admin, password);
		}

		// Отмечаем приглашение как использованное
		await this.markInviteAsUsed(inviteToken, admin.id);

		logger.info("Admin registered successfully", {
			id: admin.id,
			email: admin.email,
			role: admin.role,
		});

		return {
			message: "Admin registered successfully",
			email: admin.email,
			id: admin.id,
			google2faSecret: google2faSecret.base32,
			otpAuthUrl: google2faSecret.otpauth_url,
		};
	}

	/**
	 * Отправка приглашения админу
	 * @param {string} email - Email админа
	 * @param {string} name - Имя админа
	 * @param {string} role - Роль админа
	 * @param {number} adminId - ID админа, отправляющего приглашение
	 * @returns {Object} - Результат отправки приглашения
	 */
	async sendInvite(email, name, role, adminId) {
		if (!email || !name || !role || !adminId) {
			throw ApiError.BadRequest("Email, name, role and adminId are required");
		}

		logger.info("Send invite attempt", { email, name, role, adminId });

		console.log("🔐 sendInvite service - Parameters:", {
			email,
			name,
			role,
			adminId,
			adminIdType: typeof adminId,
		});

		// Проверяем, что роль валидна
		if (!["ADMIN", "SUPERVISOR"].includes(role)) {
			throw ApiError.BadRequest("Invalid role");
		}

		// Проверяем, что админ существует
		const admin = await Admin.findByPk(adminId);
		if (!admin || !["ADMIN", "SUPERVISOR"].includes(admin.role)) {
			throw ApiError.Forbidden("Access denied");
		}

		// Генерируем токен приглашения
		const token = require("crypto").randomBytes(32).toString("hex");

		console.log("🔐 sendInvite service - Creating invite with data:", {
			email: email.toLowerCase(),
			name,
			role,
			token: token.substring(0, 8) + "...",
			adminId,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		});

		// Создаем приглашение
		const invite = await AdminInvite.create({
			email: email.toLowerCase(),
			name: name,
			role: role,
			token: token,
			adminId: adminId, // Добавляем adminId
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
			used: false,
		});

		logger.info("Invite created successfully", {
			id: invite.id,
			email: invite.email,
			role: invite.role,
		});

		// Отправляем email (если настроен)
		try {
			logger.info("Attempting to send invite email", {
				email,
				name,
				role,
			});
			await this.sendInviteEmail(email, name, role, token);
			logger.info("Invite email sent successfully", {
				email,
				name,
				role,
			});
		} catch (error) {
			logger.error("Failed to send invite email", {
				error: error.message,
				errorCode: error.code,
				errorStack: error.stack,
				email,
				name,
				role,
			});
			// Не прерываем процесс, если email не отправлен
		}

		return {
			message: "Invitation sent successfully",
			email: invite.email,
			name: invite.name,
			role: invite.role,
		};
	}

	/**
	 * Валидация токена приглашения
	 * @param {string} token - Токен приглашения
	 * @returns {Object} - Данные приглашения
	 */
	async validateInvite(token) {
		if (!token) {
			throw ApiError.BadRequest("Token is required");
		}

		logger.info("Validate invite attempt", {
			token: token.substring(0, 8) + "...",
		});

		const invite = await this.validateInviteToken(token);
		if (!invite) {
			throw ApiError.BadRequest("Invalid invite token");
		}

		return {
			email: invite.email,
			name: invite.name,
			role: invite.role,
			status: this.getInviteStatus(invite),
		};
	}

	/**
	 * Получение всех приглашений
	 * @returns {Array} - Список приглашений
	 */
	async getInvites() {
		const invites = await AdminInvite.findAll({
			order: [["createdAt", "DESC"]],
		});

		const result = invites.map((invite) => ({
			id: invite.id,
			email: invite.email,
			name: invite.name || "",
			role: invite.role || "ADMIN",
			status: this.getInviteStatus(invite),
			createdAt: invite.createdAt ? invite.createdAt.toISOString() : null,
			expiresAt: invite.expiresAt ? invite.expiresAt.toISOString() : null,
		}));

		return result;
	}

	/**
	 * Получение статистики админа
	 * @returns {Object} - Статистика
	 */
	async getStats() {
		const [
			totalAdmins,
			totalInvites,
			pendingInvites,
			usedInvites,
			expiredInvites,
		] = await Promise.all([
			Admin.count({
				where: {
					role: { [Op.in]: ["ADMIN", "SUPERVISOR"] },
				},
			}),
			AdminInvite.count(),
			AdminInvite.count({
				where: {
					used: false,
					expiresAt: { [Op.gt]: new Date() },
				},
			}),
			AdminInvite.count({
				where: { used: true },
			}),
			AdminInvite.count({
				where: {
					used: false,
					expiresAt: { [Op.lt]: new Date() },
				},
			}),
		]);

		return {
			totalAdmins,
			totalInvites,
			pendingInvites,
			usedInvites,
			expiredInvites,
		};
	}

	/**
	 * Валидация токена приглашения (внутренний метод)
	 * @param {string} token - Токен приглашения
	 * @returns {Object|null} - Приглашение или null
	 */
	async validateInviteToken(token) {
		return await this.findInviteByToken(token);
	}

	/**
	 * Отметка приглашения как использованного
	 * @param {string} token - Токен приглашения
	 * @param {number} adminId - ID админа
	 */
	async markInviteAsUsed(token, adminId) {
		const invite = await this.findInviteByToken(token);
		if (invite) {
			invite.used = true;
			invite.usedBy = adminId;
			invite.usedAt = new Date();
			await invite.save();
		}
	}

	/**
	 * Поиск приглашения по токену
	 * @param {string} token - Токен приглашения
	 * @returns {Object|null} - Приглашение или null
	 */
	async findInviteByToken(token) {
		return await AdminInvite.findOne({
			where: { token: token },
		});
	}

	/**
	 * Получение статуса приглашения
	 * @param {Object} invite - Объект приглашения
	 * @returns {string} - Статус приглашения
	 */
	getInviteStatus(invite) {
		if (invite.used) {
			return "ACCEPTED";
		}
		if (invite.expiresAt && invite.expiresAt < new Date()) {
			return "EXPIRED";
		}
		return "PENDING";
	}

	/**
	 * Отправка email с приглашением
	 * @param {string} email - Email получателя
	 * @param {string} name - Имя получателя
	 * @param {string} role - Роль
	 * @param {string} token - Токен приглашения
	 */
	async sendInviteEmail(email, name, role, token) {
		try {
			const emailService = require("./email-service");
			await emailService.sendAdminInvite(email, name, role, token);
		} catch (error) {
			logger.error("Failed to send invite email", {
				error: error.message,
				email,
				name,
				role,
			});
			// Не прерываем процесс, если email не отправлен
		}
	}

	/**
	 * Смена пароля администратора
	 * @param {number} adminId - ID администратора
	 * @param {string} currentPassword - Текущий пароль
	 * @param {string} newPassword - Новый пароль
	 * @returns {Object} - Результат смены пароля
	 */
	async changePassword(adminId, currentPassword, newPassword) {
		if (!adminId || !currentPassword || !newPassword) {
			throw ApiError.BadRequest(
				"Admin ID, current password and new password are required"
			);
		}

		logger.info("Admin password change attempt", { adminId });

		const admin = await Admin.findByPk(adminId);
		if (!admin) {
			throw ApiError.NotFound("Admin not found");
		}

		if (admin.blocked) {
			throw ApiError.Forbidden("Account is blocked");
		}

		// Проверяем текущий пароль
		if (!admin.password) {
			throw ApiError.BadRequest("No password set for this account");
		}

		const isCurrentPasswordValid = await passwordService.comparePassword(
			currentPassword,
			admin.password
		);
		if (!isCurrentPasswordValid) {
			throw ApiError.UnauthorizedError("Current password is incorrect");
		}

		// Валидируем новый пароль
		const passwordValidation = passwordService.validatePassword(newPassword);
		if (!passwordValidation.isValid) {
			throw ApiError.BadRequest(passwordValidation.error);
		}

		// Проверяем, что новый пароль отличается от текущего
		const isSamePassword = await passwordService.comparePassword(
			newPassword,
			admin.password
		);
		if (isSamePassword) {
			throw ApiError.BadRequest(
				"New password must be different from current password"
			);
		}

		// Устанавливаем новый пароль
		await passwordService.setPasswordWithExpiry(admin, newPassword);

		logger.info("Admin password changed successfully", { adminId });

		return {
			message: "Password changed successfully",
			email: admin.email,
			id: admin.id,
		};
	}

	/**
	 * Принудительная смена пароля администратора (для супервизора)
	 * @param {number} adminId - ID администратора
	 * @param {string} newPassword - Новый пароль
	 * @returns {Object} - Результат смены пароля
	 */
	async forceChangePassword(adminId, newPassword) {
		if (!adminId || !newPassword) {
			throw ApiError.BadRequest("Admin ID and new password are required");
		}

		logger.info("Admin force password change attempt", { adminId });

		const admin = await Admin.findByPk(adminId);
		if (!admin) {
			throw ApiError.NotFound("Admin not found");
		}

		// Валидируем новый пароль
		const passwordValidation = passwordService.validatePassword(newPassword);
		if (!passwordValidation.isValid) {
			throw ApiError.BadRequest(passwordValidation.error);
		}

		// Устанавливаем новый пароль
		await passwordService.setPasswordWithExpiry(admin, newPassword);

		logger.info("Admin password force changed successfully", { adminId });

		return {
			message: "Password changed successfully",
			email: admin.email,
			id: admin.id,
		};
	}

	/**
	 * Получение информации о пароле администратора
	 * @param {number} adminId - ID администратора
	 * @returns {Object} - Информация о пароле
	 */
	async getPasswordInfo(adminId) {
		if (!adminId) {
			throw ApiError.BadRequest("Admin ID is required");
		}

		const admin = await Admin.findByPk(adminId);
		if (!admin) {
			throw ApiError.NotFound("Admin not found");
		}

		const passwordCheck = passwordService.checkPasswordChangeRequired(admin);
		const lockCheck = passwordService.checkAccountLock(admin);

		return {
			hasPassword: !!admin.password,
			passwordChangedAt: admin.passwordChangedAt,
			passwordExpiresAt: admin.passwordExpiresAt,
			lastLoginAt: admin.lastLoginAt,
			loginAttempts: admin.loginAttempts,
			lockedUntil: admin.lockedUntil,
			passwordWarning: passwordCheck.warning,
			passwordDaysLeft: passwordCheck.daysLeft,
			passwordMessage: passwordCheck.message,
			isLocked: lockCheck.isLocked,
			lockMinutesLeft: lockCheck.minutesLeft,
		};
	}

	/**
	 * Устанавливает пароль с датой истечения
	 * @param {number} adminId - ID администратора
	 * @param {string} password - Новый пароль
	 */
	async setPasswordWithExpiry(adminId, password) {
		const admin = await Admin.findByPk(adminId);
		if (!admin) {
			throw ApiError.NotFound("Admin not found");
		}

		const hashedPassword = await passwordService.hashPassword(password);
		const expiryDays = parseInt(process.env.ADMIN_PASSWORD_EXPIRY_DAYS) || 90;
		const expiryDate = new Date();
		expiryDate.setDate(expiryDate.getDate() + expiryDays);

		await admin.update({
			password: hashedPassword,
			passwordExpiresAt: expiryDate,
			lastPasswordChange: new Date(),
			passwordExpiryNotified: false,
			isLocked: false,
		});

		logger.info("Password set with expiry", {
			adminId,
			expiryDate: expiryDate.toISOString(),
		});
	}

	/**
	 * Получает админа по ID
	 * @param {number} adminId - ID администратора
	 * @returns {Object} - Администратор
	 */
	async getAdminById(adminId) {
		const admin = await Admin.findByPk(adminId);
		if (!admin) {
			throw ApiError.NotFound("Admin not found");
		}
		return admin;
	}

	/**
	 * Получает админа по email
	 * @param {string} email - Email администратора
	 * @returns {Object} - Администратор
	 */
	async getAdminByEmail(email) {
		const admin = await Admin.findOne({
			where: { email },
		});
		return admin;
	}

	/**
	 * Проверяет, заблокирован ли админ из-за истекшего пароля
	 * @param {number} adminId - ID администратора
	 * @returns {boolean} - Заблокирован ли админ
	 */
	async isAdminLocked(adminId) {
		const admin = await Admin.findByPk(adminId);
		if (!admin) {
			return false;
		}
		return admin.isLocked || false;
	}

	/**
	 * Получает всех администраторов
	 * @returns {Array} - Список всех администраторов
	 */
	async getAllAdmins() {
		return await Admin.findAll({
			where: {
				role: { [Op.in]: ["ADMIN", "SUPERVISOR"] },
			},
			order: [["createdAt", "DESC"]],
		});
	}
}

module.exports = new AdminService();
