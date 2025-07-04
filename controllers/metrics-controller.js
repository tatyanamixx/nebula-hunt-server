const metricsService = require('../service/metrics-service');

class MetricsController {
	async retention(req, res) {
		try {
			const { from, to } = req.query;
			const result = await metricsService.getRetention({ from, to });
			res.json(result);
		} catch (e) {
			res.status(500).json({ error: e.message });
		}
	}

	async arpu(req, res) {
		try {
			const { from, to, currency } = req.query;
			const result = await metricsService.getARPU({ from, to, currency });
			res.json(result);
		} catch (e) {
			res.status(500).json({ error: e.message });
		}
	}

	async ltv(req, res) {
		try {
			const { from, to, currency } = req.query;
			const result = await metricsService.getLTV({ from, to, currency });
			res.json(result);
		} catch (e) {
			res.status(500).json({ error: e.message });
		}
	}

	async kfactor(req, res) {
		try {
			const { from, to } = req.query;
			const result = await metricsService.getKFactor({ from, to });
			res.json(result);
		} catch (e) {
			res.status(500).json({ error: e.message });
		}
	}

	async conversion(req, res) {
		try {
			const { from, to, currency } = req.query;
			const result = await metricsService.getConversion({
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

module.exports = new MetricsController();
