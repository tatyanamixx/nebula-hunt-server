/* created by Tatyana Mikhniukevich on 04.07.2025 */
const { sequelize, MarketCommission } = require('../models/models');
const marketConfig = require('../config/market.config');

async function initMarketCommission() {
	const data = Object.entries(marketConfig.commission).map(
		([currency, rate]) => ({
			currency,
			rate,
			description: `Комиссия ${(rate * 100).toFixed(0)}% для ${currency}`,
		})
	);

	for (const entry of data) {
		await MarketCommission.findOrCreate({
			where: { currency: entry.currency },
			defaults: entry,
		});
	}
}
