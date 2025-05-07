const { Log } = require('../models/models');
const ApiError = require('../exceprtions/api-error');

class LoggerService {
	async logging(userId, opCode, opDesc, opAmount) {
		const logging = await Log.create({
			userId: userId,
			operation: opCode,
			description: opDesc,
			amount: opAmount,
		});

		return logging;
	}
}
module.exports = new LoggerService();
