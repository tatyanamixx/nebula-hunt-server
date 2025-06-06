const jwt = require('jsonwebtoken');
const { Token } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');

class TokenService {
	generateTokens(payload) {
		try {
			const accessToken = jwt.sign(
				payload,
				process.env.JWT_ACCESS_SECRET,
				{
					expiresIn: '30m',
				}
			);
			const refreshToken = jwt.sign(
				payload,
				process.env.JWT_REFRESH_SECRET,
				{
					expiresIn: '7d',
				}
			);
			return { accessToken, refreshToken };
		} catch (err) {
			throw ApiError.Internal(
				`Failed to generate tokens: ${err.message}`
			);
		}
	}

	validateAccessToken(token) {
		try {
			const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
			return userData;
		} catch (err) {
			return null;
		}
	}

	validateRefreshToken(token) {
		try {
			const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
			return userData;
		} catch (err) {
			return null;
		}
	}

	async saveToken(userId, refreshToken, transaction = null) {
		const shouldCommit = !transaction;
		const t = transaction || (await sequelize.transaction());

		try {
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
			return token;
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			throw ApiError.Internal(`Failed to save token: ${err.message}`);
		}
	}

	async removeToken(refreshToken, transaction = null) {
		const shouldCommit = !transaction;
		const t = transaction || (await sequelize.transaction());

		try {
			const tokenData = await Token.destroy({
				where: { refreshToken: refreshToken },
				transaction: t,
			});

			if (shouldCommit) {
				await t.commit();
			}
			return tokenData;
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			throw ApiError.Internal(`Failed to remove token: ${err.message}`);
		}
	}

	async findToken(refreshToken, transaction = null) {
		const shouldCommit = !transaction;
		const t = transaction || (await sequelize.transaction());

		try {
			const tokenData = await Token.findOne({
				where: { refreshToken: refreshToken },
				transaction: t,
			});

			if (shouldCommit) {
				await t.commit();
			}
			return tokenData;
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			throw ApiError.Internal(`Failed to find token: ${err.message}`);
		}
	}
}

module.exports = new TokenService();
