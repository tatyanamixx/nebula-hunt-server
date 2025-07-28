const {
	validatePasswordResetToken,
	generateTemporaryToken,
} = require('../utils/token-utils');
const { passwordExpiryService } = require('../service/password-expiry-service');
const { adminService } = require('../service/admin-service');
const { logger } = require('../config/logger.config');
const { ApiError } = require('../exceptions/api-error');

class PasswordResetController {
	/**
	 * Валидирует токен сброса пароля
	 */
	async validateResetToken(req, res, next) {
		try {
			const { token } = req.params;

			if (!token) {
				throw new ApiError(400, 'Token is required');
			}

			const decoded = validatePasswordResetToken(token);

			if (!decoded) {
				throw new ApiError(400, 'Invalid or expired token');
			}

			// Проверяем что админ существует и заблокирован
			const admin = await adminService.getAdminById(decoded.adminId);

			if (!admin) {
				throw new ApiError(404, 'Admin not found');
			}

			if (!admin.isLocked) {
				throw new ApiError(400, 'Admin account is not locked');
			}

			res.json({
				success: true,
				message: 'Token is valid',
				data: {
					adminId: admin.id,
					email: admin.email,
					name: admin.name,
				},
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Сбрасывает пароль администратора
	 */
	async resetPassword(req, res, next) {
		try {
			const { token, newPassword, confirmPassword } = req.body;

			if (!token || !newPassword || !confirmPassword) {
				throw new ApiError(
					400,
					'Token, newPassword and confirmPassword are required'
				);
			}

			if (newPassword !== confirmPassword) {
				throw new ApiError(400, 'Passwords do not match');
			}

			// Валидируем токен
			const decoded = validatePasswordResetToken(token);

			if (!decoded) {
				throw new ApiError(400, 'Invalid or expired token');
			}

			// Проверяем требования к паролю
			const minLength =
				parseInt(process.env.ADMIN_MIN_PASSWORD_LENGTH) || 8;

			if (newPassword.length < minLength) {
				throw new ApiError(
					400,
					`Password must be at least ${minLength} characters long`
				);
			}

			// Проверяем что пароль содержит буквы и цифры
			if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
				throw new ApiError(
					400,
					'Password must contain both letters and numbers'
				);
			}

			// Сбрасываем пароль
			await adminService.setPasswordWithExpiry(
				decoded.adminId,
				newPassword
			);

			// Разблокируем админа
			await passwordExpiryService.unlockAdmin(decoded.adminId);

			// Генерируем временный токен для входа
			const temporaryToken = generateTemporaryToken(decoded.adminId);

			logger.info(
				`Password reset successful for admin ${decoded.adminId}`
			);

			res.json({
				success: true,
				message: 'Password reset successful',
				data: {
					temporaryToken,
					expiresIn: '1 hour',
				},
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Отправляет повторное уведомление о сбросе пароля
	 */
	async resendResetNotification(req, res, next) {
		try {
			const { email } = req.body;

			if (!email) {
				throw new ApiError(400, 'Email is required');
			}

			// Находим админа
			const admin = await adminService.getAdminByEmail(email);

			if (!admin) {
				throw new ApiError(404, 'Admin not found');
			}

			// Проверяем что пароль истек
			if (admin.passwordExpiresAt > new Date()) {
				throw new ApiError(400, 'Password has not expired yet');
			}

			// Отправляем уведомление о принудительной смене пароля
			await passwordExpiryService.sendForcedPasswordChange(admin);

			logger.info(`Reset notification resent to admin ${email}`);

			res.json({
				success: true,
				message: 'Reset notification sent successfully',
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Получает информацию о статусе пароля администратора
	 */
	async getPasswordStatus(req, res, next) {
		try {
			const { adminId } = req.params;

			const admin = await adminService.getAdminById(adminId);

			if (!admin) {
				throw new ApiError(404, 'Admin not found');
			}

			const now = new Date();
			const daysUntilExpiry = Math.ceil(
				(admin.passwordExpiresAt - now) / (1000 * 60 * 60 * 24)
			);

			res.json({
				success: true,
				data: {
					isLocked: admin.isLocked,
					passwordExpiresAt: admin.passwordExpiresAt,
					daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : 0,
					isExpired: admin.passwordExpiresAt <= now,
					passwordExpiryNotified: admin.passwordExpiryNotified,
				},
			});
		} catch (error) {
			next(error);
		}
	}
}

module.exports = new PasswordResetController();
