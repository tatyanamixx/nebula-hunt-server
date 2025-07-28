const { Op } = require('sequelize');
const { Admin } = require('../models');
const { emailService } = require('./email-service');
const { logger } = require('../config/logger.config');
const { generatePasswordResetToken } = require('../utils/token-utils');

class PasswordExpiryService {
	/**
	 * Проверяет пароли администраторов на предмет истечения срока
	 * Вызывается раз в сутки через cron job
	 */
	async checkPasswordExpiry() {
		try {
			logger.info('Starting password expiry check...');

			const now = new Date();
			const fiveDaysFromNow = new Date(
				now.getTime() + 5 * 24 * 60 * 60 * 1000
			);

			// Находим админов с истекающими паролями (через 5 дней)
			const expiringAdmins = await Admin.findAll({
				where: {
					passwordExpiresAt: {
						[Op.lte]: fiveDaysFromNow,
						[Op.gt]: now,
					},
					passwordExpiryNotified: false,
				},
			});

			// Находим админов с истекшими паролями
			const expiredAdmins = await Admin.findAll({
				where: {
					passwordExpiresAt: {
						[Op.lte]: now,
					},
					passwordExpiryNotified: false,
				},
			});

			logger.info(
				`Found ${expiringAdmins.length} admins with expiring passwords and ${expiredAdmins.length} with expired passwords`
			);

			// Отправляем предупреждения о скором истечении
			for (const admin of expiringAdmins) {
				await this.sendExpiryWarning(admin);
			}

			// Отправляем уведомления о принудительной смене пароля
			for (const admin of expiredAdmins) {
				await this.sendForcedPasswordChange(admin);
			}

			logger.info('Password expiry check completed successfully');
		} catch (error) {
			logger.error('Error during password expiry check:', error);
			throw error;
		}
	}

	/**
	 * Отправляет предупреждение о скором истечении пароля
	 */
	async sendExpiryWarning(admin) {
		try {
			const daysUntilExpiry = Math.ceil(
				(admin.passwordExpiresAt - new Date()) / (1000 * 60 * 60 * 24)
			);

			const emailContent = {
				to: admin.email,
				subject: `⚠️ Your password expires in ${daysUntilExpiry} days`,
				template: 'password-expiry-warning',
				data: {
					adminName: admin.name || admin.email,
					daysUntilExpiry,
					expiryDate:
						admin.passwordExpiresAt.toLocaleDateString('en-US'),
					changePasswordUrl: `${process.env.FRONTEND_URL}/admin/change-password`,
				},
			};

			await emailService.sendEmail(emailContent);

			// Помечаем что уведомление отправлено
			await admin.update({ passwordExpiryNotified: true });

			logger.info(`Expiry warning sent to admin ${admin.email}`);
		} catch (error) {
			logger.error(
				`Error sending expiry warning to ${admin.email}:`,
				error
			);
		}
	}

	/**
	 * Отправляет уведомление о принудительной смене пароля
	 */
	async sendForcedPasswordChange(admin) {
		try {
			// Генерируем токен для сброса пароля
			const resetToken = await generatePasswordResetToken(admin.id);

			const emailContent = {
				to: admin.email,
				subject: '🚨 Access Blocked - Password Change Required',
				template: 'forced-password-change',
				data: {
					adminName: admin.name || admin.email,
					resetUrl: `${process.env.FRONTEND_URL}/admin/reset-password?token=${resetToken}`,
					expiryDate:
						admin.passwordExpiresAt.toLocaleDateString('en-US'),
				},
			};

			await emailService.sendEmail(emailContent);

			// Помечаем что уведомление отправлено
			await admin.update({
				passwordExpiryNotified: true,
				isLocked: true, // Блокируем доступ
			});

			logger.info(
				`Forced password change notification sent to admin ${admin.email}`
			);
		} catch (error) {
			logger.error(
				`Error sending forced password change to ${admin.email}:`,
				error
			);
		}
	}

	/**
	 * Сбрасывает флаг уведомлений для всех админов
	 * Вызывается после успешной смены пароля
	 */
	async resetNotificationFlags(adminId) {
		try {
			await Admin.update(
				{ passwordExpiryNotified: false },
				{ where: { id: adminId } }
			);

			logger.info(`Reset notification flags for admin ${adminId}`);
		} catch (error) {
			logger.error(
				`Error resetting notification flags for admin ${adminId}:`,
				error
			);
			throw error;
		}
	}

	/**
	 * Разблокирует админа после смены пароля
	 */
	async unlockAdmin(adminId) {
		try {
			await Admin.update(
				{
					isLocked: false,
					passwordExpiryNotified: false,
				},
				{ where: { id: adminId } }
			);

			logger.info(`Unlocked admin ${adminId}`);
		} catch (error) {
			logger.error(`Error unlocking admin ${adminId}:`, error);
			throw error;
		}
	}
}

module.exports = new PasswordExpiryService();
