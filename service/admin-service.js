/**
 * created by Tatyana Mikhniukevich on 28.05.2025
 */
const axios = require('axios');
const speakeasy = require('speakeasy');
const { Admin, AdminInvite } = require('../models/models');
const { Op } = require('sequelize');
const tokenService = require('./token-service');
const ApiError = require('../exceptions/api-error');
const logger = require('./logger-service');

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
			throw ApiError.BadRequest('Google access token is required');
		}

		logger.info('Google OAuth attempt', { accessToken: 'present' });

		try {
			// Получаем информацию о пользователе от Google
			const googleResponse = await axios.get(
				'https://www.googleapis.com/oauth2/v2/userinfo',
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				}
			);

			const googleUser = googleResponse.data;
			logger.info('Google user info received', {
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
					role: { [Op.in]: ['ADMIN', 'SUPERVISOR'] },
				},
			});

			// Если админ не найден, создаем нового
			if (!admin) {
				logger.info('Creating new admin from Google OAuth', {
					email: googleUser.email,
					googleId: googleUser.id,
				});

				// Генерируем секрет для Google 2FA
				const google2faSecret = speakeasy.generateSecret({
					length: 20,
					name: `Nebulahunt Admin (${googleUser.email})`,
				});

				admin = await Admin.create({
					email: googleUser.email,
					google_id: googleUser.id,
					name: googleUser.name,
					role: 'ADMIN',
					google2faSecret: google2faSecret.base32,
					is_2fa_enabled: true,
					blocked: false,
				});

				logger.info('New admin created from Google OAuth', {
					id: admin.id,
					email: admin.email,
				});
			} else {
				// Обновляем Google ID если его не было
				if (!admin.google_id) {
					admin.google_id = googleUser.id;
					await admin.save();
					logger.info('Updated admin with Google ID', {
						id: admin.id,
						google_id: googleUser.id,
					});
				}
			}

			// Проверяем, что аккаунт не заблокирован
			if (admin.blocked) {
				logger.warn('Google OAuth failed: account blocked', {
					email: admin.email,
				});
				throw ApiError.Forbidden('Account is blocked');
			}

			// Проверяем, что 2FA настроен
			if (!admin.is_2fa_enabled) {
				logger.warn('Google OAuth failed: 2FA not enabled', {
					email: admin.email,
				});
				throw ApiError.Forbidden('2FA not enabled for this account');
			}

			logger.info('Google OAuth successful, requires 2FA', {
				id: admin.id,
				email: admin.email,
			});

			return {
				message: 'Please enter 2FA code',
				requires2FA: true,
				userData: {
					id: admin.id,
					email: admin.email,
					name: admin.name,
					role: admin.role,
					provider: 'google',
					providerId: googleUser.id,
				},
			};
		} catch (error) {
			if (error instanceof ApiError) {
				throw error;
			}
			logger.error('Google OAuth error', { error: error.message });
			throw ApiError.Unauthorized('Google OAuth failed');
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
			throw ApiError.BadRequest('Provider and OTP are required');
		}

		logger.info('OAuth 2FA verification attempt', { provider });

		try {
			let admin;

			if (provider === 'google') {
				const { accessToken } = oauthData;

				// Получаем информацию о пользователе от Google
				const googleResponse = await axios.get(
					'https://www.googleapis.com/oauth2/v2/userinfo',
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
						role: { [Op.in]: ['ADMIN', 'SUPERVISOR'] },
					},
				});

				if (!admin) {
					throw ApiError.Forbidden('Admin not found');
				}
			} else {
				throw ApiError.BadRequest('Unsupported OAuth provider');
			}

			// Проверяем 2FA код
			const verified = speakeasy.totp.verify({
				secret: admin.google2faSecret,
				encoding: 'base32',
				token: otp,
				window: 1, // допускаем +/- 30 сек
			});

			if (!verified) {
				logger.warn('OAuth 2FA verification failed: invalid code', {
					provider,
					email: admin.email,
				});
				throw ApiError.Unauthorized('Invalid 2FA code');
			}

			logger.info('OAuth 2FA verification successful', {
				provider,
				id: admin.id,
				email: admin.email,
			});

			// Генерируем токены и возвращаем результат
			return await this.generateAdminTokensAndResponse(
				admin,
				'OAuth 2FA verification successful'
			);
		} catch (error) {
			if (error instanceof ApiError) {
				throw error;
			}
			logger.error('OAuth 2FA verification error', {
				error: error.message,
			});
			throw ApiError.Unauthorized('2FA verification failed');
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

		logger.info('Searching for admin by email', { email });

		try {
			const admin = await Admin.findOne({
				where: {
					email: email.toLowerCase(),
					role: { [Op.in]: ['ADMIN', 'SUPERVISOR'] },
				},
				order: [['id', 'ASC']],
			});

			if (admin) {
				logger.info('Admin found', {
					id: admin.id,
					email: admin.email,
					role: admin.role,
					is_2fa_enabled: admin.is_2fa_enabled,
					blocked: admin.blocked,
				});
			} else {
				logger.info('Admin not found', { email });
			}

			return admin;
		} catch (error) {
			logger.error('Error finding admin by email', {
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
	 * Генерация токенов и ответа для админа
	 * @param {Object} admin - Объект админа
	 * @param {string} message - Сообщение
	 * @returns {Object} - Ответ с токенами и данными пользователя
	 */
	async generateAdminTokensAndResponse(admin, message) {
		// Генерируем JWT-токены для админа
		const payload = {
			id: admin.id,
			email: admin.email,
			name: admin.name,
			role: admin.role,
			provider: 'google',
			providerId: admin.google_id,
		};
		const tokens = tokenService.generateTokens(payload);

		// Сохраняем refresh токен
		await tokenService.saveAdminToken(admin.id, tokens.refreshToken);

		return {
			message,
			email: admin.email,
			id: admin.id,
			name: admin.name,
			role: admin.role,
			provider: 'google',
			providerId: admin.google_id,
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
		};
	}

	/**
	 * Авторизация админа через email (устаревший метод)
	 * @param {string} email - Email пользователя
	 * @returns {Object} - Данные админа и токены
	 */
	async loginAdmin(email) {
		if (!email) {
			throw ApiError.BadRequest('Email is required');
		}

		logger.info('Admin login attempt (deprecated)', { email });

		// Проверяем, что пользователь существует и имеет роль ADMIN
		const admin = await this.findAdminByEmail(email);
		if (!admin) {
			logger.warn('Admin login failed: user not found', {
				email,
			});
			throw ApiError.Forbidden('Access denied - user not found');
		}

		logger.info('Admin found', {
			id: admin.id,
			email: admin.email,
			role: admin.role,
			is_2fa_enabled: admin.is_2fa_enabled,
			blocked: admin.blocked,
		});

		// Проверяем, что аккаунт не заблокирован
		if (admin.blocked) {
			logger.warn('Admin login failed: account blocked', {
				email,
			});
			throw ApiError.Forbidden('Account is blocked');
		}

		// Проверяем, что 2FA настроен
		if (!admin.is_2fa_enabled) {
			logger.warn('Admin login failed: 2FA not enabled', {
				email,
			});
			throw ApiError.Forbidden('2FA not enabled for this account');
		}

		logger.info('Admin login successful', {
			id: admin.id,
			email: admin.email,
		});

		return {
			message: 'Please enter 2FA code',
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
		const EXPECTED_SECRET = process.env.ADMIN_INIT_SECRET || 'supersecret';

		// Проверяем секретный ключ
		if (secretKey !== EXPECTED_SECRET) {
			logger.warn('Admin init failed: invalid secret key');
			throw ApiError.Forbidden('Invalid secret key');
		}

		// Находим пользователя по email
		const user = await this.findAdminByEmail(email);
		if (!user) {
			throw ApiError.BadRequest('User with this email not found');
		}
		if (user.role === 'ADMIN') {
			throw ApiError.BadRequest('User is already admin');
		}

		// Генерируем секрет для Google 2FA
		const google2faSecret = speakeasy.generateSecret({
			length: 20,
			name: `Nebulahunt Admin (${user.email})`,
		});

		// Обновляем пользователя
		user.role = 'ADMIN';
		user.google2faSecret = google2faSecret.base32;
		user.is_2fa_enabled = true;
		await user.save();

		logger.info('Admin initialized', {
			id: user.id,
			email: user.email,
		});

		return {
			message: 'Admin initialized',
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
			throw ApiError.BadRequest('Email and OTP are required');
		}

		logger.info('2FA verification attempt (deprecated)', { email });

		// Проверяем, что пользователь существует и имеет роль ADMIN
		const admin = await this.findAdminByEmail(email);
		if (!admin) {
			logger.warn(
				'2FA verification failed: user not found or not admin',
				{
					email,
				}
			);
			throw ApiError.Forbidden('Access denied');
		}

		// Проверяем, что 2FA включен
		if (!admin.is_2fa_enabled || !admin.google2faSecret) {
			logger.warn('2FA verification failed: 2FA not enabled', {
				email,
			});
			throw ApiError.Forbidden('2FA not enabled for this account');
		}

		// Проверяем 2FA код
		const verified = speakeasy.totp.verify({
			secret: admin.google2faSecret,
			encoding: 'base32',
			token: otp,
			window: 1, // допускаем +/- 30 сек
		});

		if (!verified) {
			logger.warn('2FA verification failed: invalid code', {
				email,
			});
			throw ApiError.Unauthorized('Invalid 2FA code');
		}

		logger.info('2FA verification successful', { id: admin.id });

		return await this.generateAdminTokensAndResponse(
			admin,
			'2FA verification successful'
		);
	}

	/**
	 * Инициализация супервайзера через email из переменной окружения
	 * @returns {Object} - Данные инициализированного супервайзера
	 */
	async initSupervisor() {
		// Проверяем, была ли уже выполнена инициализация
		if (AdminService.supervisorInitialized) {
			logger.info(
				'Supervisor initialization already completed, skipping...'
			);
			return {
				message: 'Supervisor initialization already completed',
				skipped: true,
			};
		}

		const supervisorEmail = process.env.SUPERVISOR_EMAIL;
		if (!supervisorEmail) {
			throw ApiError.Internal('SUPERVISOR_EMAIL not configured');
		}

		logger.info('Checking for existing supervisor...', {
			email: supervisorEmail,
		});

		try {
			// Проверяем, существует ли уже супервизор
			const existingSupervisor = await this.findAdminByEmail(
				supervisorEmail
			);

			// Проверяем, что супервизор существует и имеет валидный ID
			if (
				existingSupervisor &&
				existingSupervisor.role === 'SUPERVISOR' &&
				existingSupervisor.id > 0
			) {
				logger.info('Supervisor already exists', {
					email: supervisorEmail,
					id: existingSupervisor.id,
					role: existingSupervisor.role,
					is_2fa_enabled: existingSupervisor.is_2fa_enabled,
				});
				// Отмечаем инициализацию как завершенную
				AdminService.supervisorInitialized = true;
				return {
					message: 'Supervisor already exists',
					email: existingSupervisor.email,
					id: existingSupervisor.id,
				};
			}

			logger.info('Creating new supervisor...', {
				email: supervisorEmail,
			});

			// Создаем нового супервайзера
			const google2faSecret = speakeasy.generateSecret({
				length: 20,
				name: `Nebulahunt Supervisor (${supervisorEmail})`,
			});

			const supervisor = await Admin.create({
				email: supervisorEmail,
				name: 'Supervisor',
				role: 'SUPERVISOR',
				google2faSecret: google2faSecret.base32,
				is_2fa_enabled: true,
				blocked: false,
			});

			logger.info('Supervisor created successfully', {
				id: supervisor.id,
				email: supervisor.email,
				role: supervisor.role,
			});

			// Отмечаем инициализацию как завершенную
			AdminService.supervisorInitialized = true;

			return {
				message: 'Supervisor initialized successfully',
				email: supervisor.email,
				id: supervisor.id,
				google2faSecret: google2faSecret.base32,
				otpAuthUrl: google2faSecret.otpauth_url,
			};
		} catch (error) {
			if (error.name === 'SequelizeUniqueConstraintError') {
				logger.info('Supervisor already exists (unique constraint)', {
					email: supervisorEmail,
				});
				AdminService.supervisorInitialized = true;
				return {
					message: 'Supervisor already exists',
					email: supervisorEmail,
				};
			}
			logger.error('Supervisor initialization error', {
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
		if (!email || !otp || !inviteToken) {
			throw ApiError.BadRequest(
				'Email, OTP and inviteToken are required'
			);
		}

		logger.info('Complete 2FA attempt', { email });

		// Валидируем токен приглашения
		const invite = await this.validateInviteToken(inviteToken);
		if (!invite) {
			throw ApiError.BadRequest('Invalid invite token');
		}

		// Находим админа
		const admin = await this.findAdminByEmail(email);
		if (!admin) {
			throw ApiError.BadRequest('Admin not found');
		}

		// Проверяем 2FA код
		const verified = speakeasy.totp.verify({
			secret: admin.google2faSecret,
			encoding: 'base32',
			token: otp,
			window: 1,
		});

		if (!verified) {
			throw ApiError.Unauthorized('Invalid 2FA code');
		}

		// Отмечаем приглашение как использованное
		await this.markInviteAsUsed(inviteToken, admin.id);

		logger.info('2FA setup completed', { id: admin.id, email });

		return {
			message: '2FA setup completed successfully',
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
			throw ApiError.BadRequest(
				'Email, name and inviteToken are required'
			);
		}

		logger.info('Admin registration attempt', { email, name });

		// Валидируем токен приглашения
		const invite = await this.validateInviteToken(inviteToken);
		if (!invite) {
			throw ApiError.BadRequest('Invalid invite token');
		}

		// Проверяем, что приглашение не истекло
		if (invite.expiresAt < new Date()) {
			throw ApiError.BadRequest('Invite token expired');
		}

		// Проверяем, что приглашение не использовано
		if (invite.used) {
			throw ApiError.BadRequest('Invite token already used');
		}

		// Проверяем, что email совпадает
		if (invite.email !== email) {
			throw ApiError.BadRequest('Email does not match invite');
		}

		// Генерируем секрет для Google 2FA
		const google2faSecret = speakeasy.generateSecret({
			length: 20,
			name: `Nebulahunt Admin (${email})`,
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

		logger.info('Admin registered successfully', {
			id: admin.id,
			email: admin.email,
			role: admin.role,
		});

		return {
			message: 'Admin registered successfully',
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
			throw ApiError.BadRequest(
				'Email, name, role and adminId are required'
			);
		}

		logger.info('Send invite attempt', { email, name, role, adminId });

		// Проверяем, что роль валидна
		if (!['ADMIN', 'SUPERVISOR'].includes(role)) {
			throw ApiError.BadRequest('Invalid role');
		}

		// Проверяем, что админ существует
		const admin = await Admin.findByPk(adminId);
		if (!admin || !['ADMIN', 'SUPERVISOR'].includes(admin.role)) {
			throw ApiError.Forbidden('Access denied');
		}

		// Генерируем токен приглашения
		const token = require('crypto').randomBytes(32).toString('hex');

		// Создаем приглашение
		const invite = await AdminInvite.create({
			email: email.toLowerCase(),
			name: name,
			role: role,
			token: token,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
			used: false,
		});

		logger.info('Invite created successfully', {
			id: invite.id,
			email: invite.email,
			role: invite.role,
		});

		// Отправляем email (если настроен)
		try {
			await this.sendInviteEmail(email, name, role, token);
		} catch (error) {
			logger.warn('Failed to send invite email', {
				error: error.message,
			});
			// Не прерываем процесс, если email не отправлен
		}

		return {
			message: 'Invitation sent successfully',
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
			throw ApiError.BadRequest('Token is required');
		}

		logger.info('Validate invite attempt', {
			token: token.substring(0, 8) + '...',
		});

		const invite = await this.validateInviteToken(token);
		if (!invite) {
			throw ApiError.BadRequest('Invalid invite token');
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
			order: [['createdAt', 'DESC']],
		});

		return invites.map((invite) => ({
			id: invite.id,
			email: invite.email,
			name: invite.name,
			role: invite.role,
			status: this.getInviteStatus(invite),
			createdAt: invite.createdAt,
			expiresAt: invite.expiresAt,
		}));
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
					role: { [Op.in]: ['ADMIN', 'SUPERVISOR'] },
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
			return 'used';
		}
		if (invite.expiresAt < new Date()) {
			return 'expired';
		}
		return 'pending';
	}

	/**
	 * Отправка email с приглашением
	 * @param {string} email - Email получателя
	 * @param {string} name - Имя получателя
	 * @param {string} role - Роль
	 * @param {string} token - Токен приглашения
	 */
	async sendInviteEmail(email, name, role, token) {
		// Здесь должна быть логика отправки email
		// Пока просто логируем
		logger.info('Invite email would be sent', {
			email,
			name,
			role,
			token: token.substring(0, 8) + '...',
		});
	}
}

module.exports = new AdminService();
