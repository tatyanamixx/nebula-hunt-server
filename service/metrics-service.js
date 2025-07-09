/**
 * created by Tatyana Mikhniukevich on 04.07.2025
 */
const { User, UserState, PaymentTransaction } = require('../models/models');
const { Op } = require('sequelize');
const { prometheusMetrics } = require('../middlewares/prometheus-middleware');

class MetricsService {
	// Retention: D1, D3, D7
	async getRetention({ from, to }) {
		// from, to — диапазон дат регистрации
		const users = await User.findAll({
			where: {
				createdAt: { [Op.between]: [from, to] },
				role: 'USER',
			},
			attributes: ['id', 'createdAt'],
		});
		const userIds = users.map((u) => u.id);
		const userStates = await UserState.findAll({
			where: { userId: userIds },
		});
		const result = { D1: 0, D3: 0, D7: 0, total: users.length };
		const now = new Date();
		for (const user of users) {
			const state = userStates.find((s) => s.userId === user.id);
			if (!state) continue;
			const regDate = new Date(user.createdAt);
			// D1
			if (
				state.lastLoginDate &&
				(new Date(state.lastLoginDate) - regDate) / 86400000 >= 1
			)
				result.D1++;
			// D3
			if (
				state.lastLoginDate &&
				(new Date(state.lastLoginDate) - regDate) / 86400000 >= 3
			)
				result.D3++;
			// D7
			if (
				state.lastLoginDate &&
				(new Date(state.lastLoginDate) - regDate) / 86400000 >= 7
			)
				result.D7++;
		}
		return result;
	}

	// ARPU (Average Revenue Per User)
	async getARPU({ from, to, currency }) {
		const users = await User.findAll({
			where: {
				createdAt: { [Op.between]: [from, to] },
				role: 'USER',
			},
			attributes: ['id'],
		});
		const userIds = users.map((u) => u.id);
		const payments = await PaymentTransaction.findAll({
			where: {
				fromAccount: userIds,
				currency,
				status: 'CONFIRMED',
				createdAt: { [Op.between]: [from, to] },
			},
		});
		const totalRevenue = payments.reduce(
			(sum, p) => sum + Number(p.amount),
			0
		);
		return {
			ARPU: userIds.length ? totalRevenue / userIds.length : 0,
			totalRevenue,
			users: userIds.length,
		};
	}

	// LTV (Lifetime Value)
	async getLTV({ from, to, currency }) {
		// Сумма всех платежей на пользователя за всё время
		const users = await User.findAll({
			where: {
				createdAt: { [Op.between]: [from, to] },
				role: 'USER',
			},
			attributes: ['id'],
		});
		const userIds = users.map((u) => u.id);
		const payments = await PaymentTransaction.findAll({
			where: {
				fromAccount: userIds,
				currency,
				status: 'CONFIRMED',
			},
		});
		const totalRevenue = payments.reduce(
			(sum, p) => sum + Number(p.amount),
			0
		);
		return {
			LTV: userIds.length ? totalRevenue / userIds.length : 0,
			totalRevenue,
			users: userIds.length,
		};
	}

	// K-factor (viral coefficient)
	async getKFactor({ from, to }) {
		// Пример: считаем по рефералам
		const users = await User.findAll({
			where: {
				createdAt: { [Op.between]: [from, to] },
				role: 'USER',
			},
			attributes: ['id', 'referral'],
		});
		const invited = users.filter((u) => u.referral && u.referral !== 0);
		return {
			KFactor: users.length ? invited.length / users.length : 0,
			invited: invited.length,
			total: users.length,
		};
	}

	// Conversion по валютам (сколько пользователей совершили хотя бы одну покупку в валюте)
	async getConversion({ from, to, currency }) {
		const users = await User.findAll({
			where: {
				createdAt: { [Op.between]: [from, to] },
				role: 'USER',
			},
			attributes: ['id'],
		});
		const userIds = users.map((u) => u.id);
		const payments = await PaymentTransaction.findAll({
			where: {
				fromAccount: userIds,
				currency,
				status: 'CONFIRMED',
			},
		});
		const uniqueBuyers = new Set(payments.map((p) => p.fromAccount));
		return {
			conversion: users.length ? uniqueBuyers.size / users.length : 0,
			buyers: uniqueBuyers.size,
			users: users.length,
		};
	}

	// Обновление DAU/WAU/MAU
	async updateActiveUsers() {
		const now = new Date();
		const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
		const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		const [dau, wau, mau] = await Promise.all([
			UserState.count({
				where: { lastLoginDate: { [Op.gte]: since24h } },
			}),
			UserState.count({
				where: { lastLoginDate: { [Op.gte]: since7d } },
			}),
			UserState.count({
				where: { lastLoginDate: { [Op.gte]: since30d } },
			}),
		]);
		prometheusMetrics.activeUsersDAU.set(dau);
		prometheusMetrics.activeUsersWAU.set(wau);
		prometheusMetrics.activeUsersMAU.set(mau);
	}
}

module.exports = new MetricsService();
