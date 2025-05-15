const jwt = require('jsonwebtoken');
const { Token } = require('../models/models');
const { where } = require('sequelize');

class TokenService {
	generateTokens(payload) {
		const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
			expiresIn: '7d',
		});
		const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
			expiresIn: '7d',
		});
		return { accessToken, refreshToken };
	}

	validateAccessToken(token) {
		try {
			const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
			return userData;
		} catch (err) {
			return userData;
		}
	}

	validateRefreshToken(token) {
		try {
			const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
			return userData;
		} catch (err) {
			return userData;
		}
	}

	async saveToken(userId, refreshToken) {
		const tokenData = await Token.findOne({ where: { userId: userId } });

		if (tokenData) {
			tokenData.refreshToken = refreshToken;
			return tokenData.save();
		}
		const token = await Token.create({ userId: userId, refreshToken });
		return token;
	}

	async removeToken(refreshToken) {
		const tokenData = await Token.deleteOne({
			where: { refreshToken: refreshToken },
		});
		return tokenData;
	}

	async findToken(refreshToken) {
		const tokenData = await Token.findOne({
			where: { refreshToken: refreshToken },
		});
		return tokenData;
	}
}
module.exports = new TokenService();
