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
			const { sellerId, artifactId, price, currency, expiresAt } =
				req.body;
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
			const { offerId, buyerId } = req.body;
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
			const { userId } = req.params;
			const transactions = await marketService.getUserTransactions(
				userId
			);
			res.json(transactions);
		} catch (e) {
			prometheusMetrics.errorCounter.inc({ type: '5xx' });
			res.status(500).json({ error: e.message });
		}
	}
}

module.exports = new MarketController();
