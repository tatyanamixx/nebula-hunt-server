const ApiError = require('../exceprtions/api-error');
const telegram = require('@telegram-apps/init-data-node');
const token = process.env.TG_BOT_API_KEY;
const userService = require('../service/user-service');

const parseInitData = (initData) => {
	const params = new URLSearchParams(initData);
	return {
		user: JSON.parse(params.get('user')),
		hash: params.get('hash'),
		auth_date: params.get('auth_date'),
		start_param: params.get('start_param'),
		chat_type: params.get('chat_type'),
		chat_instance: params.get('chat_instance'),
	};
};

class UserController {
	async registration(req, res, next) {
		// telegram validation
		const { initDataRaw } = req.body;
		const initData = parseInitData(initDataRaw);
		try {
			telegram.validate(initDataRaw, token);
		} catch (err) {
			next(err);
		}
		// check BD
		try {
			const tgId = initData.user.id;
			const tgUserName = initData.user.username;
			const userData = await userService.registration(tgId, tgUserName);
			res.cookie('refreshToken', userData.refreshToken, {
				maxAge: 7 * 24 * 60 * 60 * 1000,
				httpOnly: true,
				seen: true,
			});
			return res.json(userData);
		} catch (err) {
			next(err);
		}
	}

	async login(req, res, next) {
		try {
		} catch (err) {
			next(err);
		}
	}

	async refresh(req, res, next) {
		try {
		} catch (err) {
			next(err);
		}
	}

	async getUsers(req, res, next) {
		try {
			res.json([123], [456]);
		} catch (err) {
			next(err);
		}
	}

	async auth(req, res, next) {}
}

module.exports = new UserController();
