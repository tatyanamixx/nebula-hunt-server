/**
 * created by Tatyana Mikhniukevich on 04.07.2025
 */
const { Artifact, User } = require('../models/models');

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
	 * Получить артефакт по ID
	 * @param {number|string} artifactId - ID артефакта
	 * @param {number} userId - ID пользователя для проверки владения
	 * @returns {Promise<Object>} - артефакт
	 */
	async getArtifactById(artifactId, userId) {
		const artifact = await Artifact.findOne({
			where: { id: artifactId },
		});

		// Проверка владения артефактом (если не системный)
		if (artifact && artifact.userId !== userId) {
			// Проверяем, не является ли артефакт системным
			const { SYSTEM_USER_ID } = require('../config/constants');
			if (artifact.userId !== SYSTEM_USER_ID) {
				throw new Error(
					'You do not have permission to access this artifact'
				);
			}
		}

		return artifact;
	}

	/**
	 * Сгенерировать случайный артефакт для пользователя
	 * @param {number} userId - ID пользователя
	 * @returns {Promise<Object>} - созданный артефакт
	 */
	async generateRandomArtifact(userId) {
		// Генерация случайных свойств артефакта
		const seed = `artifact-${Date.now()}-${Math.random()
			.toString(36)
			.substring(2, 15)}`;
		const rarities = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
		const rarity = rarities[Math.floor(Math.random() * rarities.length)];

		// Генерация случайных эффектов в зависимости от редкости
		const effects = {};
		const effectTypes = ['chaos', 'stability', 'production', 'luck'];
		const maxEffects = Math.min(
			2 + rarities.indexOf(rarity),
			effectTypes.length
		);

		for (let i = 0; i < maxEffects; i++) {
			const effectType = effectTypes[i];
			const baseValue = 0.05 * (rarities.indexOf(rarity) + 1);
			effects[effectType] = +(
				baseValue +
				Math.random() * baseValue
			).toFixed(2);
		}

		// Создание имени артефакта
		const prefixes = [
			'Ancient',
			'Mysterious',
			'Powerful',
			'Enchanted',
			'Cosmic',
		];
		const suffixes = [
			'Relic',
			'Crystal',
			'Shard',
			'Artifact',
			'Stone',
			'Core',
		];
		const name = `${
			prefixes[Math.floor(Math.random() * prefixes.length)]
		} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;

		// Создание артефакта
		return await this.addArtifactToUser({
			userId,
			seed,
			name,
			description: `A ${rarity.toLowerCase()} artifact with ${
				Object.keys(effects).length
			} effects.`,
			rarity,
			image: `artifact_${rarity.toLowerCase()}.png`,
			effects,
			tradable: true,
		});
	}

	/**
	 * Активировать артефакт
	 * @param {number|string} artifactId - ID артефакта
	 * @param {number} userId - ID пользователя
	 * @returns {Promise<Object>} - результат активации
	 */
	async activateArtifact(artifactId, userId) {
		// Получаем артефакт
		const artifact = await Artifact.findOne({
			where: { id: artifactId },
		});

		if (!artifact) {
			throw new Error('Artifact not found');
		}

		if (artifact.userId !== userId) {
			throw new Error('You can only activate artifacts that you own');
		}

		// Здесь должна быть логика активации артефакта
		// Например, применение эффектов к состоянию пользователя

		// Для примера просто возвращаем информацию об артефакте
		return {
			success: true,
			message: `Artifact ${artifact.name} has been activated`,
			effects: artifact.effects,
		};
	}

	/**
	 * Деактивировать артефакт
	 * @param {number|string} artifactId - ID артефакта
	 * @param {number} userId - ID пользователя
	 * @returns {Promise<Object>} - результат деактивации
	 */
	async deactivateArtifact(artifactId, userId) {
		// Получаем артефакт
		const artifact = await Artifact.findOne({
			where: { id: artifactId },
		});

		if (!artifact) {
			throw new Error('Artifact not found');
		}

		if (artifact.userId !== userId) {
			throw new Error('You can only deactivate artifacts that you own');
		}

		// Здесь должна быть логика деактивации артефакта
		// Например, удаление эффектов из состояния пользователя

		// Для примера просто возвращаем информацию об артефакте
		return {
			success: true,
			message: `Artifact ${artifact.name} has been deactivated`,
			effects: artifact.effects,
		};
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
			const { SYSTEM_USER_ID } = require('../config/constants');

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
