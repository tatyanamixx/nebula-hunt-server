const { Artifact } = require('../models/models');

class ArtifactService {
	/**
	 * Добавить артефакт пользователю
	 * @param {Object} params { userId, seed, name, description, rarity, image, effects, tradable }
	 */
	async addArtifactToUser({
		userId,
		seed,
		name,
		description,
		rarity,
		image,
		effects,
		tradable = true,
	}) {
		return await Artifact.create({
			userId,
			seed,
			name,
			description,
			rarity,
			image,
			effects,
			tradable,
		});
	}

	/**
	 * Получить все артефакты пользователя
	 * @param {number} userId
	 */
	async getUserArtifacts(userId) {
		return await Artifact.findAll({ where: { userId } });
	}

	/**
	 * Создать артефакт от имени SYSTEM и создать оферту с инвойсом
	 * @param {Object} artifactData - данные артефакта
	 * @param {number} buyerId - ID покупателя
	 * @param {Object} offerData - данные оферты (price, currency, expiresAt)
	 */
	async createSystemArtifactWithOffer(artifactData, buyerId, offerData) {
		const t = await require('../db').transaction();

		try {
			const SYSTEM_USER_ID = process.env.SYSTEM_USER_ID || -1;

			// 1. Создаем артефакт от имени SYSTEM
			const artifact = await Artifact.create(
				{
					userId: SYSTEM_USER_ID,
					seed: artifactData.seed,
					name: artifactData.name,
					description: artifactData.description,
					rarity: artifactData.rarity,
					image: artifactData.image,
					effects: artifactData.effects,
					tradable: artifactData.tradable !== false, // по умолчанию true
				},
				{ transaction: t }
			);

			// 2. Создаем оферту на продажу артефакта
			const { MarketOffer } = require('../models/models');
			const offer = await MarketOffer.create(
				{
					sellerId: SYSTEM_USER_ID,
					itemType: 'artifact',
					itemId: artifact.id,
					price: offerData.price,
					currency: offerData.currency,
					offerType: 'SYSTEM',
					expiresAt: offerData.expiresAt,
					status: 'ACTIVE',
				},
				{ transaction: t }
			);

			// 3. Создаем инвойс для покупателя
			const {
				MarketTransaction,
				PaymentTransaction,
			} = require('../models/models');
			const transaction = await MarketTransaction.create(
				{
					offerId: offer.id,
					buyerId: buyerId,
					sellerId: SYSTEM_USER_ID,
					status: 'PENDING',
				},
				{ transaction: t }
			);

			const payment = await PaymentTransaction.create(
				{
					marketTransactionId: transaction.id,
					fromAccount: buyerId,
					toAccount: SYSTEM_USER_ID,
					amount: offerData.price,
					currency: offerData.currency,
					txType: 'BUYER_TO_CONTRACT',
					status: 'PENDING',
				},
				{ transaction: t }
			);

			await t.commit();
			return { artifact, offer, transaction, payment };
		} catch (err) {
			await t.rollback();
			throw new Error(
				`Failed to create system artifact with offer: ${err.message}`
			);
		}
	}
}

module.exports = new ArtifactService();
