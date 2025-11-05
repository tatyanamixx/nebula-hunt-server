/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 * updated by Claude on 26.07.2025
 */
const adminService = require("../service/admin-service");
const ApiError = require("../exceptions/api-error");
const logger = require("../service/logger-service");

class AdminController {
	/**
	 * Google OAuth аутентификация для администраторов
	 */
	async googleOAuth(req, res, next) {
		try {
			const { accessToken } = req.body;
			logger.info("Google OAuth attempt", {
				accessToken: accessToken ? "present" : "missing",
			});

			const oauthResult = await adminService.googleOAuth(accessToken);
			logger.info("Google OAuth successful", { result: oauthResult });

			return res.status(200).json(oauthResult);
		} catch (e) {
			logger.error("Google OAuth error", { error: e.message });
			next(e);
		}
	}

	/**
	 * 2FA верификация для Google OAuth
	 */
	async oauth2FAVerify(req, res, next) {
		try {
			const { provider, otp, ...oauthData } = req.body;
			logger.info("OAuth 2FA verification attempt", { provider });

			const verifyResult = await adminService.oauth2FAVerify(
				provider,
				otp,
				oauthData
			);
			logger.info("OAuth 2FA verification successful", { provider });

			return res.status(200).json(verifyResult);
		} catch (e) {
			logger.error("OAuth 2FA verification error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Авторизация админа через email (устаревший метод)
	 */
	async loginAdmin(req, res, next) {
		try {
			const { email } = req.body;
			logger.info("Admin login attempt (deprecated)", { email });

			const loginResult = await adminService.loginAdmin(email);
			logger.info("Admin login successful", {
				email,
				result: loginResult,
			});

			return res.status(200).json(loginResult);
		} catch (e) {
			logger.error("Admin login error", {
				error: e.message,
				email: req.body.email,
			});
			next(e);
		}
	}

	/**
	 * Выход админа из системы
	 */
	async logoutAdmin(req, res, next) {
		try {
			const { refreshToken } = req.body;
			if (!refreshToken) {
				return next(ApiError.BadRequest("refreshToken required"));
			}

			await adminService.removeAdminToken(refreshToken);
			logger.info("Admin logout successful", { id: req.userToken.id });

			return res
				.status(200)
				.json({ message: "Admin logged out successfully" });
		} catch (e) {
			logger.error("Admin logout error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Инициализация админа (назначение роли ADMIN пользователю)
	 */
	async initAdmin(req, res, next) {
		try {
			const { email, secretKey } = req.body;

			if (!email) {
				return next(ApiError.BadRequest("Email required"));
			}

			const initResult = await adminService.initAdmin(email, secretKey);
			return res.status(201).json(initResult);
		} catch (e) {
			logger.error("Admin init error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Проверка 2FA кода для админа (устаревший метод)
	 */
	async verify2FA(req, res, next) {
		try {
			const { email } = req.body;
			const { otp } = req.body;

			const verifyResult = await adminService.verify2FA(email, otp);
			return res.status(200).json(verifyResult);
		} catch (e) {
			logger.error("2FA verification error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Инициализация супервайзера
	 */
	async initSupervisor(req, res, next) {
		try {
			const initResult = await adminService.initSupervisor();
			return res.status(201).json(initResult);
		} catch (e) {
			logger.error("Supervisor init error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Завершение настройки 2FA (для регистрации)
	 */
	async complete2FA(req, res, next) {
		try {
			const { email, otp, inviteToken } = req.body;

			if (!email || !otp || !inviteToken) {
				return next(
					ApiError.BadRequest("Email, OTP and inviteToken required")
				);
			}

			await adminService.complete2FA(email, otp, inviteToken);
			return res.status(200).json({
				message: "2FA setup completed successfully",
			});
		} catch (e) {
			logger.error("Complete 2FA error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Настройка 2FA для существующего администратора
	 */
	async setup2FA(req, res, next) {
		try {
			const { email } = req.body;
			const adminId = req.userToken.id;

			logger.info("2FA setup attempt", { adminId, email });

			const setupResult = await adminService.setup2FA(adminId, email);
			return res.status(200).json(setupResult);
		} catch (e) {
			logger.error("Setup 2FA error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Отключение 2FA
	 */
	async disable2FA(req, res, next) {
		try {
			const { email } = req.body;
			const adminId = req.userToken.id;

			logger.info("2FA disable attempt", { adminId, email });

			await adminService.disable2FA(adminId, email);
			return res.status(200).json({
				message: "2FA has been disabled successfully",
			});
		} catch (e) {
			logger.error("Disable 2FA error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Получение информации о 2FA (QR код и секрет)
	 */
	async get2FAInfo(req, res, next) {
		try {
			console.log("🔐 get2FAInfo controller - Request object:", {
				userToken: req.userToken ? "present" : "missing",
				userTokenId: req.userToken?.id,
				userTokenEmail: req.userToken?.email,
				headers: req.headers.authorization ? "present" : "missing",
			});

			const adminId = req.userToken.id;

			logger.info("2FA info request", { adminId });
			console.log(
				"🔐 get2FAInfo controller - Calling service with adminId:",
				adminId
			);

			const info = await adminService.get2FAInfo(adminId);
			console.log("🔐 get2FAInfo controller - Service response:", info);

			return res.status(200).json(info);
		} catch (e) {
			console.error("🔐 get2FAInfo controller - Error:", e);
			logger.error("Get 2FA info error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Получение QR кода 2FA для входа (без аутентификации)
	 */
	async get2FAQRForLogin(req, res, next) {
		try {
			const { email } = req.params;

			if (!email) {
				return next(ApiError.BadRequest("Email required"));
			}

			logger.info("2FA QR code request for login", { email });

			const qrInfo = await adminService.get2FAQRForLogin(email);
			return res.status(200).json(qrInfo);
		} catch (e) {
			logger.error("Get 2FA QR for login error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Регистрация админа через приглашение
	 */
	async registerAdmin(req, res, next) {
		try {
			const { email, password, name, inviteToken } = req.body;

			if (!email || !password || !name || !inviteToken) {
				return next(
					ApiError.BadRequest(
						"Email, password, name and inviteToken required"
					)
				);
			}

			const registerResult = await adminService.registerAdmin(
				email,
				password,
				name,
				inviteToken
			);
			return res.status(201).json(registerResult);
		} catch (e) {
			logger.error("Admin registration error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Отправка приглашения админу
	 */
	async sendInvite(req, res, next) {
		try {
			const { email, name, role } = req.body;
			const adminId = req.userToken.id;

			console.log("🔐 sendInvite controller - Request data:", {
				email,
				name,
				role,
				adminId,
				userToken: req.userToken ? "present" : "missing",
			});

			if (!email || !name || !role) {
				return next(ApiError.BadRequest("Email, name and role required"));
			}

			const inviteResult = await adminService.sendInvite(
				email,
				name,
				role,
				adminId
			);
			return res.status(201).json(inviteResult);
		} catch (e) {
			logger.error("Send invite error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Валидация токена приглашения
	 */
	async validateInvite(req, res, next) {
		try {
			const { token } = req.query;

			if (!token) {
				return next(ApiError.BadRequest("Token required"));
			}

			const validateResult = await adminService.validateInvite(token);
			return res.status(200).json(validateResult);
		} catch (e) {
			logger.error("Validate invite error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Получение всех приглашений
	 */
	async getInvites(req, res, next) {
		try {
			const invites = await adminService.getInvites();
			return res.status(200).json(invites);
		} catch (e) {
			logger.error("Get invites error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Получение статистики админа
	 */
	async getStats(req, res, next) {
		try {
			const stats = await adminService.getStats();
			return res.status(200).json(stats);
		} catch (e) {
			logger.error("Get stats error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Обновление JWT токена админа
	 */
	async refreshToken(req, res, next) {
		try {
			const { refreshToken } = req.body;
			if (!refreshToken) {
				return next(ApiError.BadRequest("refreshToken required"));
			}

			const refreshResult = await adminService.refreshToken(refreshToken);
			logger.info("Admin token refresh successful", {
				id: req.userToken?.id,
			});

			return res.status(200).json(refreshResult);
		} catch (e) {
			logger.error("Admin token refresh error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Вход администратора через email и пароль
	 */
	async loginWithPassword(req, res, next) {
		try {
			console.log("🔐 Получен запрос на вход через пароль");
			console.log("🔐 Тело запроса:", req.body);
			console.log("🔐 Email:", req.body.email);
			console.log("🔐 Has password:", !!req.body.password);

			const { email, password } = req.body;
			if (!email || !password) {
				console.log("❌ Отсутствует email или пароль");
				return next(ApiError.BadRequest("Email and password are required"));
			}

			const loginResult = await adminService.loginAdminWithPassword(
				email,
				password
			);
			logger.info("Admin password login successful", { email });
			logger.info("Login result keys:", Object.keys(loginResult));

			return res.status(200).json(loginResult);
		} catch (e) {
			logger.error("Admin password login error", {
				error: e.message,
				email: req.body.email,
			});
			next(e);
		}
	}

	/**
	 * 2FA верификация для входа через пароль
	 */
	async password2FAVerify(req, res, next) {
		try {
			const { email, otp } = req.body;

			if (!email || !otp) {
				return next(ApiError.BadRequest("Email and OTP are required"));
			}

			const verifyResult = await adminService.password2FAVerify(email, otp);
			logger.info("Admin password 2FA verification successful", {
				email,
			});

			return res.status(200).json(verifyResult);
		} catch (e) {
			logger.error("Admin password 2FA verification error", {
				error: e.message,
				email: req.body.email,
			});
			next(e);
		}
	}

	/**
	 * Смена пароля администратора
	 */
	async changePassword(req, res, next) {
		try {
			const { currentPassword, newPassword } = req.body;
			const adminId = req.userToken.id;

			if (!currentPassword || !newPassword) {
				return next(
					ApiError.BadRequest(
						"Current password and new password are required"
					)
				);
			}

			const changeResult = await adminService.changePassword(
				adminId,
				currentPassword,
				newPassword
			);
			logger.info("Admin password change successful", { adminId });

			return res.status(200).json(changeResult);
		} catch (e) {
			logger.error("Admin password change change error", {
				error: e.message,
			});
			next(e);
		}
	}

	/**
	 * Принудительная смена пароля администратора (для супервизора)
	 */
	async forceChangePassword(req, res, next) {
		try {
			const { adminId, newPassword } = req.body;
			const currentAdminId = req.userToken.id;

			if (!adminId || !newPassword) {
				return next(
					ApiError.BadRequest("Admin ID and new password are required")
				);
			}

			// Проверяем, что текущий пользователь - супервизор
			if (req.userToken.role !== "SUPERVISOR") {
				return next(
					ApiError.Forbidden("Only supervisor can force change passwords")
				);
			}

			const changeResult = await adminService.forceChangePassword(
				adminId,
				newPassword
			);
			logger.info("Admin force password change successful", {
				adminId,
				changedBy: currentAdminId,
			});

			return res.status(200).json(changeResult);
		} catch (e) {
			logger.error("Admin force password change error", {
				error: e.message,
			});
			next(e);
		}
	}

	/**
	 * Получение информации о пароле администратора
	 */
	async getPasswordInfo(req, res, next) {
		try {
			const adminId = req.userToken.id;
			const passwordInfo = await adminService.getPasswordInfo(adminId);

			return res.status(200).json(passwordInfo);
		} catch (e) {
			logger.error("Get password info error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Получить текущие игровые константы
	 */
	async getGameConstants(req, res, next) {
		try {
			const constants = require("../config/game-constants");

			logger.info("Game constants retrieved by admin", {
				adminId: req.userToken?.id,
			});

			return res.json({
				success: true,
				data: constants,
			});
		} catch (e) {
			logger.error("Get game constants error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Получить информацию о текущем администраторе
	 */
	async getCurrentAdmin(req, res, next) {
		try {
			const adminId = req.userToken.id;
			const admin = await adminService.getAdminById(adminId);

			if (!admin) {
				return next(ApiError.NotFound("Admin not found"));
			}

			// Return admin data without sensitive information
			const adminData = {
				id: admin.id,
				email: admin.email,
				username: admin.name, // Map name to username for frontend compatibility
				firstName: admin.name?.split(" ")[0] || "",
				lastName: admin.name?.split(" ").slice(1).join(" ") || "",
				role: admin.role,
				provider: "google", // Default provider
				providerId: admin.google_id,
				is2FAEnabled: admin.is_2fa_enabled,
				createdAt: admin.createdAt,
				lastLoginAt: admin.lastLoginAt,
			};

			return res.json(adminData);
		} catch (e) {
			logger.error("Get current admin error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Обновить игровые константы
	 */
	async updateGameConstants(req, res, next) {
		try {
			const { constants } = req.body;
			const adminId = req.userToken.id;

			if (!constants) {
				return next(ApiError.BadRequest("Constants data required"));
			}

			// Валидация констант
			if (constants.ECONOMY) {
				if (constants.ECONOMY.INITIAL_STARDUST < 0) {
					return next(
						ApiError.BadRequest("INITIAL_STARDUST cannot be negative")
					);
				}
				if (constants.ECONOMY.INITIAL_DARK_MATTER < 0) {
					return next(
						ApiError.BadRequest("INITIAL_DARK_MATTER cannot be negative")
					);
				}
				if (constants.ECONOMY.INITIAL_STARS < 0) {
					return next(
						ApiError.BadRequest("INITIAL_STARS cannot be negative")
					);
				}
			}

			// Обновляем файл game-constants.js
			const fs = require("fs");
			const path = require("path");
			const constantsPath = path.join(
				__dirname,
				"../config/game-constants.js"
			);

			// Читаем текущий файл
			let fileContent = fs.readFileSync(constantsPath, "utf8");

			// Обновляем константы в файле
			if (constants.ECONOMY) {
				if (constants.ECONOMY.INITIAL_STARDUST !== undefined) {
					fileContent = fileContent.replace(
						/INITIAL_STARDUST:\s*\d+/,
						`INITIAL_STARDUST: ${constants.ECONOMY.INITIAL_STARDUST}`
					);
				}
				if (constants.ECONOMY.INITIAL_DARK_MATTER !== undefined) {
					fileContent = fileContent.replace(
						/INITIAL_DARK_MATTER:\s*\d+/,
						`INITIAL_DARK_MATTER: ${constants.ECONOMY.INITIAL_DARK_MATTER}`
					);
				}
				if (constants.ECONOMY.INITIAL_STARS !== undefined) {
					fileContent = fileContent.replace(
						/INITIAL_STARS:\s*\d+/,
						`INITIAL_STARS: ${constants.ECONOMY.INITIAL_STARS}`
					);
				}
			}

			// Записываем обновленный файл
			fs.writeFileSync(constantsPath, fileContent, "utf8");

			// Очищаем require cache для этого файла
			delete require.cache[require.resolve("../config/game-constants")];

			logger.info("Game constants updated by admin", {
				adminId,
				changes: constants,
			});

			return res.json({
				success: true,
				message: "Game constants updated successfully",
				data: require("../config/game-constants"),
			});
		} catch (e) {
			logger.error("Update game constants error", { error: e.message });
			next(e);
		}
	}

	/**
	 * Тестовый endpoint для проверки SMTP
	 */
	async testSMTP(req, res, next) {
		try {
			const emailService = require("../service/email-service");
			
			// Проверяем конфигурацию SMTP
			const smtpConfig = {
				SMTP_HOST: process.env.SMTP_HOST ? "set" : "missing",
				SMTP_PORT: process.env.SMTP_PORT ? "set" : "missing",
				SMTP_USER: process.env.SMTP_USER ? "set" : "missing",
				SMTP_PASS: process.env.SMTP_PASS ? (process.env.SMTP_PASS.length > 0 ? "set" : "empty") : "missing",
				SMTP_SECURE: process.env.SMTP_SECURE,
				SMTP_FROM: process.env.SMTP_FROM,
				FRONTEND_URL: process.env.FRONTEND_URL,
			};

			// Проверяем соединение с SMTP
			let connectionStatus = "not_configured";
			const transporter = emailService.getTransporter();
			if (transporter) {
				try {
					await emailService.verifyConnection();
					connectionStatus = "connected";
				} catch (error) {
					connectionStatus = `error: ${error.message}`;
				}
			}

			return res.status(200).json({
				smtpConfig,
				connectionStatus,
				transporterInitialized: transporter !== null,
			});
		} catch (e) {
			logger.error("Test SMTP error", { error: e.message });
			next(e);
		}
	}
}

module.exports = new AdminController();
