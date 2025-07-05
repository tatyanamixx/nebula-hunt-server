/**
 * created by Tatyana Mikhniukevich on 04.05.2025
 */
const marketService = require('../service/market-service');
const { prometheusMetrics } = require('../middlewares/prometheus-middleware');

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
			prometheusMetrics.errorCounter.inc({ type: '4xx' });
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
			prometheusMetrics.errorCounter.inc({ type: '4xx' });
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
			prometheusMetrics.errorCounter.inc({ type: '4xx' });
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
			prometheusMetrics.errorCounter.inc({ type: '5xx' });
			res.status(500).json({ error: e.message });
		}
	}

	async getGalaxyOffers(req, res, next) {
		try {
			const offers = await marketService.getGalaxyOffers();
			res.json(offers);
		} catch (e) {
			next(e);
		}
	}

	async getPackageOffers(req, res, next) {
		try {
			const offers = await marketService.getPackageOffers();
			res.json(offers);
		} catch (e) {
			next(e);
		}
	}

	async getArtifactOffers(req, res, next) {
		try {
			const offers = await marketService.getArtifactOffers();
			res.json(offers);
		} catch (e) {
			next(e);
		}
	}

	async createPackageInvoice(req, res, next) {
		try {
			const { offerId } = req.body;
			const buyerId = req.initdata.id;
			const result = await marketService.createPackageInvoice({
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
			const result = await marketService.processPackageDeal({
				transactionId,
				blockchainTxId,
			});
			res.json(result);
		} catch (e) {
			next(e);
		}
	}

	async cancelOffer(req, res, next) {
		try {
			const { offerId, reason } = req.body;
			const sellerId = req.initdata.id;
			const result = await marketService.cancelOffer({
				offerId,
				sellerId,
				reason,
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
}

module.exports = new MarketController();
