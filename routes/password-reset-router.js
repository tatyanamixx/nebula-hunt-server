const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/password-reset-controller');
const {
	validateRequest,
} = require('../middlewares/request-validation-middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit-middleware');

/**
 * @route GET /api/admin/password-reset/validate/:token
 * @desc Валидирует токен сброса пароля
 * @access Public
 */
router.get(
	'/validate/:token',
	rateLimitMiddleware(25, 5), // 25 попыток за 5 минут
	passwordResetController.validateResetToken
);

/**
 * @route POST /api/admin/password-reset/reset
 * @desc Сбрасывает пароль администратора
 * @access Public
 */
router.post(
	'/reset',
	rateLimitMiddleware(15, 10), // 15 попыток за 10 минут
	validateRequest(),
	passwordResetController.resetPassword
);

/**
 * @route POST /api/admin/password-reset/resend
 * @desc Отправляет повторное уведомление о сбросе пароля
 * @access Public
 */
router.post(
	'/resend',
	rateLimitMiddleware(10, 15), // 10 попыток за 15 минут
	validateRequest(),
	passwordResetController.resendResetNotification
);

/**
 * @route GET /api/admin/password-reset/status/:adminId
 * @desc Получает информацию о статусе пароля администратора
 * @access Admin
 */
router.get(
	'/status/:adminId',
	rateLimitMiddleware(50, 1), // 50 попыток за минуту
	passwordResetController.getPasswordStatus
);

module.exports = router;
