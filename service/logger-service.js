const { Log } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');

class LoggerService {
	async logservice(userId, opCode, opDesc, opAmount, transaction = null) {
		const shouldCommit = !transaction;
		const t = transaction || (await sequelize.transaction());

		try {
			const logging = await Log.create(
				{
					userId: userId,
					operation: opCode,
					description: opDesc,
					amount: opAmount,
				},
				{ transaction: t }
			);

			if (shouldCommit) {
				await t.commit();
			}

			return logging;
		} catch (err) {
			if (shouldCommit) {
				await t.rollback();
			}
			throw ApiError.Internal(`Failed to create log: ${err.message}`);
		}
	}
}

module.exports = new LoggerService();
