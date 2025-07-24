/**
 * Token Service for JWT operations
 * created by Tatyana Mikhniukevich on 04.05.2025
 * updated by Claude on 15.07.2025
 */
const jwt = require('jsonwebtoken');
const { Token, AdminToken } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const logger = require('./logger-service');

class TokenService {
	generateTokens(payload) {
		try {
			// Проверяем обязательные поля в payload
			if (!payload || !payload.id) {
				throw new Error('Invalid payload: missing user ID');
			}

			// Преобразуем id в число для JWT токенов
			const userId = Number(payload.id);
			if (isNaN(userId) || userId <= 0) {
				throw new Error(
					'Invalid payload: user ID must be a positive number'
				);
			}

			const accessToken = jwt.sign(
				{ ...payload, id: userId },
				process.env.JWT_ACCESS_SECRET,
				{
					expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30m',
					issuer: 'nebulahunt-server',
					audience: 'nebulahunt-users',
				}
			);

			const refreshToken = jwt.sign(
				{
					id: userId,
					type: 'refresh',
					version: Date.now(), // Для инвалидации старых токенов
				},
				process.env.JWT_REFRESH_SECRET,
				{
					expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
					issuer: 'nebulahunt-server',
					audience: 'nebulahunt-users',
				}
			);

			logger.debug('Tokens generated successfully', {
				userId: userId,
				accessTokenExpiresIn:
					process.env.JWT_ACCESS_EXPIRES_IN || '30m',
				refreshTokenExpiresIn:
					process.env.JWT_REFRESH_EXPIRES_IN || '7d',
			});

			return { accessToken, refreshToken };
		} catch (err) {
			logger.error('Failed to generate tokens', {
				error: err.message,
				payload: payload
					? { id: payload.id, idType: typeof payload.id }
					: null,
			});
			throw ApiError.Internal(
				`Failed to generate tokens: ${err.message}`
			);
		}
	}

	validateAccessToken(token) {
		try {
			if (!token || typeof token !== 'string') {
				throw new Error('Token must be a non-empty string');
			}

			const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
				issuer: 'nebulahunt-server',
				audience: 'nebulahunt-users',
			});

			// Дополнительные проверки payload
			if (!userData || !userData.id) {
				throw new Error('Invalid token payload: missing user ID');
			}

			// Преобразуем id в число для проверки
			const userId = Number(userData.id);
			if (isNaN(userId) || userId <= 0) {
				throw new Error(
					'Invalid token payload: user ID must be a positive number'
				);
			}

			logger.debug('Access token validated successfully', {
				userId: userId,
				exp: userData.exp,
			});

			return { ...userData, id: userId };
		} catch (err) {
			if (err instanceof jwt.TokenExpiredError) {
				logger.warn('Access token expired', {
					token: token ? token.substring(0, 20) + '...' : 'null',
				});
				throw err;
			}
			if (err instanceof jwt.JsonWebTokenError) {
				logger.warn('Invalid access token', {
					token: token ? token.substring(0, 20) + '...' : 'null',
					error: err.message,
				});
				throw err;
			}

			logger.error('Access token validation error', {
				error: err.message,
				token: token ? token.substring(0, 20) + '...' : 'null',
			});
			throw err;
		}
	}

	validateRefreshToken(token) {
		try {
			if (!token || typeof token !== 'string') {
				throw new Error('Token must be a non-empty string');
			}

			const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
				issuer: 'nebulahunt-server',
				audience: 'nebulahunt-users',
			});

			// Проверяем, что это refresh token
			if (!userData || userData.type !== 'refresh') {
				throw new Error('Invalid token type: expected refresh token');
			}

			// Проверяем обязательные поля
			if (!userData.id) {
				throw new Error('Invalid token payload: missing user ID');
			}

			// Преобразуем id в число для проверки
			const userId = Number(userData.id);
			if (isNaN(userId) || userId <= 0) {
				throw new Error(
					'Invalid token payload: user ID must be a positive number'
				);
			}

			logger.debug('Refresh token validated successfully', {
				userId: userId,
				exp: userData.exp,
			});

			return { ...userData, id: userId };
		} catch (err) {
			if (err instanceof jwt.TokenExpiredError) {
				logger.warn('Refresh token expired', {
					token: token ? token.substring(0, 20) + '...' : 'null',
				});
				throw err;
			}
			if (err instanceof jwt.JsonWebTokenError) {
				logger.warn('Invalid refresh token', {
					token: token ? token.substring(0, 20) + '...' : 'null',
					error: err.message,
				});
				throw err;
			}

			logger.error('Refresh token validation error', {
				error: err.message,
				token: token ? token.substring(0, 20) + '...' : 'null',
			});
			throw err;
		}
	}

	async saveToken(userId, refreshToken, transaction = null) {
		const shouldCommit = !transaction;
		const t = transaction || (await sequelize.transaction());

		try {
			if (!userId || !refreshToken) {
				throw new Error('User ID and refresh token are required');
			}

			// Проверяем длину refresh token (для безопасности)
			if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
				throw new Error('Refresh token must be a non-empty string');
			}

			// Логируем длину токена для отладки
			logger.debug('Saving refresh token', {
				userId,
				tokenLength: refreshToken.length,
				tokenPreview: refreshToken.substring(0, 50) + '...',
			});

			const tokenData = await Token.findOne({
				where: { userId: userId },
				transaction: t,
			});

			if (tokenData) {
				tokenData.refreshToken = refreshToken;
				await tokenData.save({ transaction: t });
				if (shouldCommit) {
					await t.commit();
				}
				logger.debug('Token updated in database', { userId });
				return tokenData;
			}

			const token = await Token.create(
				{
					userId: userId,
					refreshToken,
				},
				{ transaction: t }
			);

			if (shouldCommit) {
				await t.commit();
			}
			logger.debug('Token saved to database', { userId });
			return token;
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			logger.error('Failed to save token', {
				userId,
				error: err.message,
			});
			throw ApiError.Internal(`Failed to save token: ${err.message}`);
		}
	}

	async removeToken(refreshToken, transaction = null) {
		const shouldCommit = !transaction;
		const t = transaction || (await sequelize.transaction());

		try {
			if (!refreshToken) {
				throw new Error('Refresh token is required');
			}

			const tokenData = await Token.destroy({
				where: { refreshToken: refreshToken },
				transaction: t,
			});

			if (shouldCommit) {
				await t.commit();
			}
			logger.debug('Token removed from database', {
				removed: tokenData > 0,
				token: refreshToken.substring(0, 20) + '...',
			});
			return tokenData;
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			logger.error('Failed to remove token', {
				error: err.message,
				token: refreshToken
					? refreshToken.substring(0, 20) + '...'
					: 'null',
			});
			throw ApiError.Internal(`Failed to remove token: ${err.message}`);
		}
	}

	async findToken(refreshToken, transaction = null) {
		const shouldCommit = !transaction;
		const t = transaction || (await sequelize.transaction());

		try {
			if (!refreshToken) {
				throw new Error('Refresh token is required');
			}

			const tokenData = await Token.findOne({
				where: { refreshToken: refreshToken },
				transaction: t,
			});

			if (shouldCommit) {
				await t.commit();
			}

			if (tokenData) {
				logger.debug('Token found in database', {
					userId: tokenData.userId,
					token: refreshToken.substring(0, 20) + '...',
				});
			} else {
				logger.debug('Token not found in database', {
					token: refreshToken.substring(0, 20) + '...',
				});
			}

			return tokenData;
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			logger.error('Failed to find token', {
				error: err.message,
				token: refreshToken
					? refreshToken.substring(0, 20) + '...'
					: 'null',
			});
			throw ApiError.Internal(`Failed to find token: ${err.message}`);
		}
	}

	async saveAdminToken(adminId, refreshToken, transaction = null) {
		const shouldCommit = !transaction;
		const t = transaction || (await sequelize.transaction());

		try {
			if (!adminId || !refreshToken) {
				throw new Error('Admin ID and refresh token are required');
			}

			// Проверяем длину refresh token (для безопасности)
			if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
				throw new Error('Refresh token must be a non-empty string');
			}

			// Логируем длину токена для отладки
			logger.debug('Saving admin refresh token', {
				adminId,
				tokenLength: refreshToken.length,
				tokenPreview: refreshToken.substring(0, 50) + '...',
			});

			const tokenData = await AdminToken.findOne({
				where: { adminId: adminId },
				transaction: t,
			});

			if (tokenData) {
				tokenData.refreshToken = refreshToken;
				await tokenData.save({ transaction: t });
				if (shouldCommit) {
					await t.commit();
				}
				logger.debug('Admin token updated in database', { adminId });
				return tokenData;
			}

			const token = await AdminToken.create(
				{
					adminId: adminId,
					refreshToken,
				},
				{ transaction: t }
			);

			if (shouldCommit) {
				await t.commit();
			}
			logger.debug('Admin token saved to database', { adminId });
			return token;
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			logger.error('Failed to save admin token', {
				adminId,
				error: err.message,
			});
			throw ApiError.Internal(
				`Failed to save admin token: ${err.message}`
			);
		}
	}

	async removeAdminToken(refreshToken, transaction = null) {
		const shouldCommit = !transaction;
		const t = transaction || (await sequelize.transaction());

		try {
			if (!refreshToken) {
				throw new Error('Refresh token is required');
			}

			const tokenData = await AdminToken.destroy({
				where: { refreshToken: refreshToken },
				transaction: t,
			});

			if (shouldCommit) {
				await t.commit();
			}
			logger.debug('Admin token removed from database', {
				removed: tokenData > 0,
				token: refreshToken.substring(0, 20) + '...',
			});
			return tokenData;
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			logger.error('Failed to remove admin token', {
				error: err.message,
				token: refreshToken
					? refreshToken.substring(0, 20) + '...'
					: 'null',
			});
			throw ApiError.Internal(
				`Failed to remove admin token: ${err.message}`
			);
		}
	}

	async findAdminToken(refreshToken, transaction = null) {
		const shouldCommit = !transaction;
		const t = transaction || (await sequelize.transaction());

		try {
			if (!refreshToken) {
				throw new Error('Refresh token is required');
			}

			const tokenData = await AdminToken.findOne({
				where: { refreshToken: refreshToken },
				transaction: t,
			});

			if (shouldCommit) {
				await t.commit();
			}

			if (tokenData) {
				logger.debug('Admin token found in database', {
					adminId: tokenData.adminId,
					token: refreshToken.substring(0, 20) + '...',
				});
			} else {
				logger.debug('Admin token not found in database', {
					token: refreshToken.substring(0, 20) + '...',
				});
			}

			return tokenData;
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			logger.error('Failed to find admin token', {
				error: err.message,
				token: refreshToken
					? refreshToken.substring(0, 20) + '...'
					: 'null',
			});
			throw ApiError.Internal(
				`Failed to find admin token: ${err.message}`
			);
		}
	}
}

module.exports = new TokenService();
