/**
 * created by Tatyana Mikhniukevich on 04.07.2025
 */
const { User, UserState, PaymentTransaction } = require('../models/models');
const { Op } = require('sequelize');
const { prometheusMetrics } = require('../middlewares/prometheus-middleware');
const sequelize = require('../db'); // Added missing import for sequelize

class MetricsService {
	// Retention: D1, D3, D7
	async getRetention({ from, to }) {
		const t = await sequelize.transaction();

		try {
			// from, to — диапазон дат регистрации
			const users = await User.findAll({
				where: {
					createdAt: { [Op.between]: [from, to] },
					role: 'USER',
				},
				attributes: ['id', 'createdAt'],
				transaction: t,
			});
			const userIds = users.map((u) => u.id);
			const userStates = await UserState.findAll({
				where: { userId: userIds },
				transaction: t,
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

			await t.commit();
			return result;
		} catch (err) {
			await t.rollback();
			throw new Error(`Failed to get retention metrics: ${err.message}`);
		}
	}

	// ARPU (Average Revenue Per User)
	async getARPU({ from, to, currency }) {
		const t = await sequelize.transaction();

		try {
			const users = await User.findAll({
				where: {
					createdAt: { [Op.between]: [from, to] },
					role: 'USER',
				},
				attributes: ['id'],
				transaction: t,
			});
			const userIds = users.map((u) => u.id);
			const payments = await PaymentTransaction.findAll({
				where: {
					fromAccount: userIds,
					currency,
					status: 'CONFIRMED',
					createdAt: { [Op.between]: [from, to] },
				},
				transaction: t,
			});
			const totalRevenue = payments.reduce(
				(sum, p) => sum + Number(p.amount),
				0
			);

			const result = {
				ARPU: userIds.length ? totalRevenue / userIds.length : 0,
				totalRevenue,
				users: userIds.length,
			};

			await t.commit();
			return result;
		} catch (err) {
			await t.rollback();
			throw new Error(`Failed to get ARPU metrics: ${err.message}`);
		}
	}

	// LTV (Lifetime Value)
	async getLTV({ from, to, currency }) {
		const t = await sequelize.transaction();

		try {
			// Сумма всех платежей на пользователя за всё время
			const users = await User.findAll({
				where: {
					createdAt: { [Op.between]: [from, to] },
					role: 'USER',
				},
				attributes: ['id'],
				transaction: t,
			});
			const userIds = users.map((u) => u.id);
			const payments = await PaymentTransaction.findAll({
				where: {
					fromAccount: userIds,
					currency,
					status: 'CONFIRMED',
				},
				transaction: t,
			});
			const totalRevenue = payments.reduce(
				(sum, p) => sum + Number(p.amount),
				0
			);

			const result = {
				LTV: userIds.length ? totalRevenue / userIds.length : 0,
				totalRevenue,
				users: userIds.length,
			};

			await t.commit();
			return result;
		} catch (err) {
			await t.rollback();
			throw new Error(`Failed to get LTV metrics: ${err.message}`);
		}
	}

	// K-factor (viral coefficient)
	async getKFactor({ from, to }) {
		const t = await sequelize.transaction();

		try {
			// Пример: считаем по рефералам
			const users = await User.findAll({
				where: {
					createdAt: { [Op.between]: [from, to] },
					role: 'USER',
				},
				attributes: ['id', 'referral'],
				transaction: t,
			});
			const invited = users.filter((u) => u.referral && u.referral !== 0);

			const result = {
				KFactor: users.length ? invited.length / users.length : 0,
				invited: invited.length,
				total: users.length,
			};

			await t.commit();
			return result;
		} catch (err) {
			await t.rollback();
			throw new Error(`Failed to get K-factor metrics: ${err.message}`);
		}
	}

	// Conversion по валютам (сколько пользователей совершили хотя бы одну покупку в валюте)
	async getConversion({ from, to, currency }) {
		const t = await sequelize.transaction();

		try {
			const users = await User.findAll({
				where: {
					createdAt: { [Op.between]: [from, to] },
					role: 'USER',
				},
				attributes: ['id'],
				transaction: t,
			});
			const userIds = users.map((u) => u.id);
			const payments = await PaymentTransaction.findAll({
				where: {
					fromAccount: userIds,
					currency,
					status: 'CONFIRMED',
				},
				transaction: t,
			});
			const uniqueBuyers = new Set(payments.map((p) => p.fromAccount));

			const result = {
				conversion: users.length ? uniqueBuyers.size / users.length : 0,
				buyers: uniqueBuyers.size,
				users: users.length,
			};

			await t.commit();
			return result;
		} catch (err) {
			await t.rollback();
			throw new Error(`Failed to get conversion metrics: ${err.message}`);
		}
	}

	// Обновление DAU/WAU/MAU
	async updateActiveUsers() {
		const t = await sequelize.transaction();

		try {
			const now = new Date();
			const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
			const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			const [dau, wau, mau] = await Promise.all([
				UserState.count({
					where: { lastLoginDate: { [Op.gte]: since24h } },
					transaction: t,
				}),
				UserState.count({
					where: { lastLoginDate: { [Op.gte]: since7d } },
					transaction: t,
				}),
				UserState.count({
					where: { lastLoginDate: { [Op.gte]: since30d } },
					transaction: t,
				}),
			]);
			prometheusMetrics.activeUsersDAU.set(dau);
			prometheusMetrics.activeUsersWAU.set(wau);
			prometheusMetrics.activeUsersMAU.set(mau);

			await t.commit();
		} catch (err) {
			await t.rollback();
			throw new Error(
				`Failed to update active users metrics: ${err.message}`
			);
		}
	}
}

module.exports = new MetricsService();
