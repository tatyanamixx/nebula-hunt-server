/**
 * created by Tatyana Mikhniukevich on 04.07.2025
 */
const marketService = require('../service/market-service');
const prometheusService = require('../service/prometheus-service');
const { User } = require('../models/models'); // Правильный импорт модели User
const { SYSTEM_USER_ID } = require('../config/constants');

class MarketController {
	async getAllOffers(req, res) {
		try {
			const offers = await marketService.getAllOffers();
			res.json(offers);
		} catch (e) {
			res.status(500).json({ error: e.message });
		}
	}

	async createOffer(req, res) {
		try {
			const { artifactId, price, currency, expiresAt } = req.body;
			const sellerId = req.initdata.id;
			const offer = await marketService.createOffer({
				sellerId,
				artifactId,
				price,
				currency,
				expiresAt,
			});
			res.json(offer);
		} catch (e) {
			prometheusService.incrementError('4xx');
			res.status(400).json({ error: e.message });
		}
	}

	async createInvoice(req, res) {
		try {
			const { offerId } = req.body;
			const buyerId = req.initdata.id;
			const result = await marketService.createInvoice({
				offerId,
				buyerId,
			});
			res.json(result);
		} catch (e) {
			prometheusService.incrementError('4xx');
			res.status(400).json({ error: e.message });
		}
	}

	async processDeal(req, res) {
		try {
			const { transactionId, blockchainTxId } = req.body;
			const result = await marketService.processDeal({
				transactionId,
				blockchainTxId,
			});
			res.json(result);
		} catch (e) {
			prometheusService.incrementError('4xx');
			res.status(400).json({ error: e.message });
		}
	}

	async getUserTransactions(req, res) {
		try {
			const userId = req.initdata.id;
			const transactions = await marketService.getUserTransactions(
				userId
			);
			res.json(transactions);
		} catch (e) {
			prometheusService.incrementError('5xx');
			res.status(500).json({ error: e.message });
		}
	}

	async getPackageOffers(req, res, next) {
		try {
			const userId = req.initdata.id;
			const offers = await marketService.getPackageOffers(userId);
			res.json(offers);
		} catch (e) {
			next(e);
		}
	}

	async createPackageInvoice(req, res, next) {
		try {
			const { offerId } = req.body;
			const buyerId = req.initdata.id;
			const result = await marketService.createInvoice({
				offerId,
				buyerId,
			});
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async processPackageDeal(req, res, next) {
		try {
			const { transactionId, blockchainTxId } = req.body;
			const result = await marketService.processDeal({
				transactionId,
				blockchainTxId,
			});
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async cancelSystemDeal(req, res, next) {
		try {
			const { transactionId, reason } = req.body;
			const result = await marketService.cancelSystemDeal({
				transactionId,
				reason,
			});
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async cancelOffer(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { offerId } = req.params;

			const result = await marketService.cancelOffer(offerId, userId);

			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async cancelDeal(req, res, next) {
		try {
			const { transactionId, reason } = req.body;
			const result = await marketService.cancelDeal({
				transactionId,
				reason,
			});
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async initializePackages(req, res, next) {
		try {
			const { packages } = req.body;
			const result = await marketService.initializePackages(packages);
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async registerFarmingReward(req, res, next) {
		try {
			const { amount, resource, source } = req.body;
			const userId = req.initdata.id;
			const result = await marketService.registerFarmingReward({
				userId,
				amount,
				resource,
				source,
			});
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async registerGalaxyStarsTransfer(req, res, next) {
		try {
			const { galaxyId, amount, currency } = req.body;
			const userId = req.initdata.id;
			const result = await marketService.registerGalaxyStarsTransfer({
				userId,
				galaxyId,
				amount,
				currency,
			});
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async createResourceOffer(req, res, next) {
		try {
			const { resourceType, amount, price, currency } = req.body;
			const sellerId = req.initdata.id;
			const result = await marketService.createResourceOffer({
				sellerId,
				resourceType,
				amount,
				price,
				currency,
			});
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async exchangeResources(req, res, next) {
		try {
			const { toUserId, resourceType, amount } = req.body;
			const fromUserId = req.initdata.id;
			const result = await marketService.exchangeResources({
				fromUserId,
				toUserId,
				resourceType,
				amount,
			});
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async updateTonWallet(req, res, next) {
		try {
			const { tonWallet } = req.body;
			const userId = req.initdata.id;

			// Обновляем адрес кошелька пользователя
			const user = await User.findByPk(userId);
			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}

			user.tonWallet = tonWallet;
			await user.save();

			res.json({ success: true, tonWallet });
		} catch (e) {
			next(e);
		}
	}

	async getTonWallet(req, res, next) {
		try {
			const userId = req.initdata.id;

			// Получаем адрес кошелька пользователя
			const user = await User.findByPk(userId);
			if (!user) {
				return res.status(404).json({ error: 'User not found' });
			}

			res.json({ tonWallet: user.tonWallet });
		} catch (e) {
			next(e);
		}
	}

	async getOffers(req, res, next) {
		try {
			const { page, limit, itemType, offerType, status, currency } =
				req.query;

			const result = await marketService.getOffers({
				page: parseInt(page) || 1,
				limit: parseInt(limit) || undefined,
				itemType,
				offerType,
				status,
				currency,
			});

			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async getGalaxyOffers(req, res, next) {
		try {
			const { page, limit, status, currency } = req.query;

			const result = await marketService.getGalaxyOffers({
				page: parseInt(page) || 1,
				limit: parseInt(limit) || undefined,
				status,
				currency,
			});

			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async getResourceOffers(req, res, next) {
		try {
			const { page, limit, resourceType, status } = req.query;

			const result = await marketService.getResourceOffers({
				page: parseInt(page) || 1,
				limit: parseInt(limit) || undefined,
				resourceType,
				status,
			});

			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async getArtifactOffers(req, res, next) {
		try {
			const { page, limit, status, currency, rarity } = req.query;

			const result = await marketService.getArtifactOffers({
				page: parseInt(page) || 1,
				limit: parseInt(limit) || undefined,
				status,
				currency,
				rarity,
			});

			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async getP2POffers(req, res, next) {
		try {
			const { page, limit, status, currency, itemType } = req.query;

			const result = await marketService.getP2POffers({
				page: parseInt(page) || 1,
				limit: parseInt(limit) || undefined,
				status,
				currency,
				itemType,
			});

			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async getSystemOffers(req, res, next) {
		try {
			const { page, limit, status, currency, itemType } = req.query;

			const result = await marketService.getSystemOffers({
				page: parseInt(page) || 1,
				limit: parseInt(limit) || undefined,
				status,
				currency,
				itemType,
			});

			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async buyOffer(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { offerId } = req.params;

			const result = await marketService.completeOffer(offerId, userId);

			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async processExpiredOffers(req, res, next) {
		try {
			// Проверяем, что запрос от администратора
			if (req.initdata.id !== SYSTEM_USER_ID && !req.initdata.isAdmin) {
				return res.status(403).json({ error: 'Access denied' });
			}

			const count = await marketService.processExpiredOffers();

			res.json({
				success: true,
				processedOffers: count,
				message: `Processed ${count} expired offers`,
			});
		} catch (e) {
			next(e);
		}
	}

	async getOffer(req, res, next) {
		try {
			const { offerId } = req.params;
			const result = await marketService.getOfferById(offerId);
			res.json(result);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new MarketController();
