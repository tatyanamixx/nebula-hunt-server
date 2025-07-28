const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/password-reset-controller');
const { validateRequest } = require('../middlewares/validation-middleware');
const { rateLimitMiddleware } = require('../middlewares/rate-limit-middleware');

/**
 * @route GET /api/admin/password-reset/validate/:token
 * @desc Валидирует токен сброса пароля
 * @access Public
 */
router.get(
	'/validate/:token',
	rateLimitMiddleware('password-reset', 5, 300000), // 5 попыток за 5 минут
	passwordResetController.validateResetToken
);

/**
 * @route POST /api/admin/password-reset/reset
 * @desc Сбрасывает пароль администратора
 * @access Public
 */
router.post(
	'/reset',
	rateLimitMiddleware('password-reset', 3, 600000), // 3 попытки за 10 минут
	validateRequest({
		body: {
			token: { type: 'string', required: true },
			newPassword: { type: 'string', required: true, minLength: 8 },
			confirmPassword: { type: 'string', required: true },
		},
	}),
	passwordResetController.resetPassword
);

/**
 * @route POST /api/admin/password-reset/resend
 * @desc Отправляет повторное уведомление о сбросе пароля
 * @access Public
 */
router.post(
	'/resend',
	rateLimitMiddleware('password-reset', 2, 900000), // 2 попытки за 15 минут
	validateRequest({
		body: {
			email: { type: 'string', required: true, format: 'email' },
		},
	}),
	passwordResetController.resendResetNotification
);

/**
 * @route GET /api/admin/password-reset/status/:adminId
 * @desc Получает информацию о статусе пароля администратора
 * @access Admin
 */
router.get(
	'/status/:adminId',
	rateLimitMiddleware('password-reset', 10, 60000), // 10 попыток за минуту
	passwordResetController.getPasswordStatus
);

module.exports = router;
