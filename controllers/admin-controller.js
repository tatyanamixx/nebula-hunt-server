/**
 * created by Tatyana Mikhniukevich on 29.05.2025
 */
const adminService = require('../service/admin-service');
const ApiError = require('../exceptions/api-error');
const speakeasy = require('speakeasy');
const { User } = require('../models/models');
const bcrypt = require('bcrypt');
const tokenService = require('../service/token-service');

class AdminController {
	async getUsers(req, res, next) {
		try {
			const users = await adminService.getAllUsers();
			return res.json(users);
		} catch (e) {
			next(e);
		}
	}

	async blockUser(req, res, next) {
		try {
			const { id } = req.params;
			const user = await adminService.blockUser(id);
			return res.json(user);
		} catch (e) {
			next(e);
		}
	}

	async unblockUser(req, res, next) {
		try {
			const { id } = req.params;
			const user = await adminService.unblockUser(id);
			return res.json(user);
		} catch (e) {
			next(e);
		}
	}

	async loginAdmin(req, res, next) {
		try {
			const { id, username } = req.initdata;
			if (!id || !username) {
				return next(
					ApiError.BadRequest(
						'Telegram user id and username required'
					)
				);
			}

			const admin = await adminService.findAdminByTelegramId(id);

			// Генерируем JWT-токен для админа
			const payload = {
				id: admin.id,
				username: admin.username,
				role: admin.role,
			};
			const tokens = tokenService.generateTokens(payload);

			return res.status(200).json({
				message: 'Admin login successful',
				username: admin.username,
				id: admin.id,
				role: admin.role,
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken,
			});
		} catch (e) {
			next(e);
		}
	}

	async logoutAdmin(req, res, next) {
		try {
			const { refreshToken } = req.body;
			if (!refreshToken) {
				return next(ApiError.BadRequest('refreshToken required'));
			}

			await adminService.removeAdminToken(refreshToken);

			return res
				.status(200)
				.json({ message: 'Admin logged out successfully' });
		} catch (e) {
			next(e);
		}
	}

	async initAdmin(req, res, next) {
		try {
			const { telegramId, secretKey } = req.body;
			const EXPECTED_SECRET =
				process.env.ADMIN_INIT_SECRET || 'supersecret';
			if (secretKey !== EXPECTED_SECRET) {
				return next(ApiError.Forbidden('Invalid secret key'));
			}
			if (!telegramId) {
				return next(ApiError.BadRequest('telegramId required'));
			}

			const user = await adminService.findUserByTelegramId(telegramId);
			if (!user) {
				return next(
					ApiError.BadRequest('User with this Telegram id not found')
				);
			}
			if (user.role === 'ADMIN') {
				return next(ApiError.BadRequest('User is already admin'));
			}

			const google2faSecret = speakeasy.generateSecret({
				length: 20,
				name: `Nebulahunt Admin (${user.username})`,
			});

			user.role = 'ADMIN';
			user.google2faSecret = google2faSecret.base32;
			await user.save();

			return res.status(201).json({
				message: 'Admin initialized',
				username: user.username,
				id: user.id,
				google2faSecret: google2faSecret.base32,
				otpAuthUrl: google2faSecret.otpauth_url,
			});
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new AdminController();
