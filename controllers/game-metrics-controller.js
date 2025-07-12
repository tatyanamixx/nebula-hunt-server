/**
 * created by Tatyana Mikhniukevich on 04.07.2025
 */
const gameMetricsService = require('../service/game-metrics-service');

class GameMetricsController {
	async retention(req, res) {
		try {
			const { from, to } = req.query;
			const result = await gameMetricsService.getRetention({ from, to });
			res.json(result);
		} catch (e) {
			res.status(500).json({ error: e.message });
		}
	}

	async arpu(req, res) {
		try {
			const { from, to, currency } = req.query;
			const result = await gameMetricsService.getARPU({ from, to, currency });
			res.json(result);
		} catch (e) {
			res.status(500).json({ error: e.message });
		}
	}

	async ltv(req, res) {
		try {
			const { from, to, currency } = req.query;
			const result = await gameMetricsService.getLTV({ from, to, currency });
			res.json(result);
		} catch (e) {
			res.status(500).json({ error: e.message });
		}
	}

	async kfactor(req, res) {
		try {
			const { from, to } = req.query;
			const result = await gameMetricsService.getKFactor({ from, to });
			res.json(result);
		} catch (e) {
			res.status(500).json({ error: e.message });
		}
	}

	async conversion(req, res) {
		try {
			const { from, to, currency } = req.query;
			const result = await gameMetricsService.getConversion({
				from,
				to,
				currency,
			});
			res.json(result);
		} catch (e) {
			res.status(500).json({ error: e.message });
		}
	}
}

module.exports = new GameMetricsController();
