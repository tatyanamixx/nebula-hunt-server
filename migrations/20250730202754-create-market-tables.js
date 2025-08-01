'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// 1. Создаем таблицу marketoffers
		await queryInterface.createTable('marketoffers', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			sellerId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			itemType: {
				type: Sequelize.ENUM(
					'artifact',
					'galaxy',
					'task',
					'package',
					'event',
					'upgrade',
					'resource'
				),
				allowNull: false,
			},
			itemId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			amount: {
				type: Sequelize.DECIMAL,
				allowNull: false,
			},
			resource: {
				type: Sequelize.ENUM('stardust', 'darkMatter', 'stars'),
				allowNull: false,
			},
			price: {
				type: Sequelize.DECIMAL(30, 8),
				allowNull: false,
			},
			currency: {
				type: Sequelize.ENUM(
					'tgStars',
					'tonToken',
					'stars',
					'stardust',
					'darkMatter'
				),
				allowNull: false,
			},
			status: {
				type: Sequelize.ENUM(
					'ACTIVE',
					'COMPLETED',
					'CANCELLED',
					'EXPIRED'
				),
				defaultValue: 'ACTIVE',
				allowNull: false,
			},
			offerType: {
				type: Sequelize.ENUM('SYSTEM', 'P2P', 'PERSONAL'),
				allowNull: false,
				defaultValue: 'SYSTEM',
			},
			createdAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
				allowNull: false,
			},
			expiresAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			isItemLocked: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});

		// Индексы для marketoffers
		await queryInterface.addIndex('marketoffers', ['sellerId'], {
			name: 'marketoffer_seller_id_idx',
		});
		await queryInterface.addIndex('marketoffers', ['status'], {
			name: 'marketoffer_status_idx',
		});
		await queryInterface.addIndex('marketoffers', ['itemType'], {
			name: 'marketoffer_item_type_idx',
		});

		// 2. Создаем таблицу markettransactions
		await queryInterface.createTable('markettransactions', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			offerId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'marketoffers',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			buyerId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			sellerId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			status: {
				type: Sequelize.ENUM(
					'PENDING',
					'COMPLETED',
					'FAILED',
					'CANCELLED'
				),
				defaultValue: 'PENDING',
				allowNull: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
				allowNull: false,
			},
			completedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});

		// Индексы для markettransactions
		await queryInterface.addIndex('markettransactions', ['offerId'], {
			name: 'markettransaction_offer_id_idx',
		});
		await queryInterface.addIndex('markettransactions', ['buyerId'], {
			name: 'markettransaction_buyer_id_idx',
		});
		await queryInterface.addIndex('markettransactions', ['sellerId'], {
			name: 'markettransaction_seller_id_idx',
		});
		await queryInterface.addIndex('markettransactions', ['status'], {
			name: 'markettransaction_status_idx',
		});

		// 3. Создаем таблицу paymenttransactions
		await queryInterface.createTable('paymenttransactions', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			marketTransactionId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'markettransactions',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			fromAccount: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			toAccount: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			priceOrAmount: {
				type: Sequelize.DECIMAL(30, 8),
				allowNull: false,
			},
			currencyOrResource: {
				type: Sequelize.ENUM(
					'tgStars',
					'tonToken',
					'stars',
					'stardust',
					'darkMatter'
				),
				allowNull: false,
			},
			txType: {
				type: Sequelize.ENUM(
					'BUYER_TO_CONTRACT',
					'CONTRACT_TO_SELLER',
					'FEE',
					'RESOURCE_TRANSFER',
					'UPGRADE_REWARD',
					'TASK_REWARD',
					'EVENT_REWARD',
					'FARMING_REWARD',
					'GALAXY_RESOURCE',
					'ARTIFACT_RESOURCE',
					'STARS_TRANSFER',
					'TON_TRANSFER',
					'TG_STARS_TRANSFER',
					'STARDUST_TRANSFER',
					'DARK_MATTER_TRANSFER'
				),
				allowNull: false,
			},
			blockchainTxId: {
				type: Sequelize.STRING,
				allowNull: true,
				comment: 'ID транзакции в блокчейне',
			},
			status: {
				type: Sequelize.ENUM(
					'PENDING',
					'CONFIRMED',
					'FAILED',
					'CANCELLED'
				),
				defaultValue: 'PENDING',
				allowNull: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
				allowNull: false,
			},
			confirmedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});

		// Индексы для paymenttransactions
		await queryInterface.addIndex(
			'paymenttransactions',
			['marketTransactionId'],
			{
				name: 'paymenttransaction_market_transaction_id_idx',
			}
		);

		// 4. Создаем таблицу marketcommissions
		await queryInterface.createTable('marketcommissions', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			currency: {
				type: Sequelize.ENUM(
					'tgstars',
					'tontoken',
					'stardust',
					'darkmatter',
					'stars'
				),
				unique: true,
				allowNull: false,
			},
			rate: {
				type: Sequelize.FLOAT,
				allowNull: false,
			},
			description: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		});

		// Индексы для marketcommissions
		await queryInterface.addIndex('marketcommissions', ['currency'], {
			name: 'marketcommission_currency_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('marketcommissions');
		await queryInterface.dropTable('paymenttransactions');
		await queryInterface.dropTable('markettransactions');
		await queryInterface.dropTable('marketoffers');
	},
};
