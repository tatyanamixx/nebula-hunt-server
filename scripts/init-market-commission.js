const { sequelize, MarketCommission } = require('../models/models');

async function initMarketCommission() {
	const data = [
		{
			currency: 'stardust',
			rate: 0.05,
			description: 'Комиссия 5% для stardust',
		},
		{
			currency: 'darkMatter',
			rate: 0.07,
			description: 'Комиссия 7% для darkMatter',
		},
		{
			currency: 'tgStars',
			rate: 0.03,
			description: 'Комиссия 3% для tgStars',
		},
		{
			currency: 'tonToken',
			rate: 0.1,
			description: 'Комиссия 10% для tonToken',
		},
	];
	for (const entry of data) {
		await MarketCommission.findOrCreate({
			where: { currency: entry.currency },
			defaults: entry,
		});
	}
	console.log('MarketCommission table initialized');
}

sequelize.sync().then(() => {
	initMarketCommission().then(() => {
		process.exit(0);
	});
});
