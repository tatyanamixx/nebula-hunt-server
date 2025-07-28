const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Генерирует токен для сброса пароля
 * @param {number} adminId - ID администратора
 * @returns {string} - Токен для сброса пароля
 */
async function generatePasswordResetToken(adminId) {
	try {
		// Генерируем случайный токен
		const resetToken = crypto.randomBytes(32).toString('hex');

		// Создаем JWT токен с информацией об админе
		const token = jwt.sign(
			{
				adminId,
				resetToken,
				type: 'password_reset',
			},
			process.env.JWT_ACCESS_SECRET,
			{ expiresIn: '24h' } // Токен действителен 24 часа
		);

		return token;
	} catch (error) {
		throw new Error('Failed to generate password reset token');
	}
}

/**
 * Валидирует токен сброса пароля
 * @param {string} token - Токен для проверки
 * @returns {object} - Данные токена или null если недействителен
 */
function validatePasswordResetToken(token) {
	try {
		const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

		// Проверяем что это токен для сброса пароля
		if (decoded.type !== 'password_reset') {
			return null;
		}

		return decoded;
	} catch (error) {
		return null;
	}
}

/**
 * Генерирует временный токен для подтверждения смены пароля
 * @param {number} adminId - ID администратора
 * @returns {string} - Временный токен
 */
function generateTemporaryToken(adminId) {
	try {
		return jwt.sign(
			{
				adminId,
				type: 'temporary_access',
			},
			process.env.JWT_ACCESS_SECRET,
			{ expiresIn: '1h' } // Токен действителен 1 час
		);
	} catch (error) {
		throw new Error('Failed to generate temporary token');
	}
}

module.exports = {
	generatePasswordResetToken,
	validatePasswordResetToken,
	generateTemporaryToken,
};
