const jwt = require('jsonwebtoken');
const { Token } = require('../models/models');

class TokenService {
	generateTokens(payload) {
		const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
			expiresIn: '5m',
		});
		const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
			expiresIn: '7d',
		});
		return { accessToken, refreshToken };
	}

	async saveToken(userId, refreshToken) {
		const tokenData = await Token.findOne({where:{ userId: userId }});
        
		if (tokenData) {
			tokenData.refreshToken = refreshToken;
			return tokenData.save();
		}
		const token = await Token.create({ userId: userId, refreshToken });
		return token;
	}
}
module.exports = new TokenService();
