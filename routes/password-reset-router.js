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
	rateLimitMiddleware(5, 5), // 5 попыток за 5 минут
	passwordResetController.validateResetToken
);

/**
 * @route POST /api/admin/password-reset/reset
 * @desc Сбрасывает пароль администратора
 * @access Public
 */
router.post(
	'/reset',
	rateLimitMiddleware(3, 10), // 3 попытки за 10 минут
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
	rateLimitMiddleware(2, 15), // 2 попытки за 15 минут
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
	rateLimitMiddleware(10, 1), // 10 попыток за минуту
	passwordResetController.getPasswordStatus
);

module.exports = router;
