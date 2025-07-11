'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Create MarketOffer table
		await queryInterface.createTable('marketoffers', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
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
					'resource',
					'package'
				),
				allowNull: false,
			},
			itemId: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			price: {
				type: Sequelize.DECIMAL(30, 8),
				allowNull: false,
			},
			currency: {
				type: Sequelize.ENUM('tgStars', 'tonToken'),
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
			},
			offerType: {
				type: Sequelize.ENUM('SYSTEM', 'P2P'),
				allowNull: false,
				defaultValue: 'SYSTEM',
			},
			createdAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.NOW,
			},
			expiresAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			isItemLocked: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: true,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create MarketTransaction table
		await queryInterface.createTable('markettransactions', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
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
			},
			createdAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.NOW,
			},
			completedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create PaymentTransaction table
		await queryInterface.createTable('paymenttransactions', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
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
			amount: {
				type: Sequelize.DECIMAL(30, 8),
				allowNull: false,
			},
			currency: {
				type: Sequelize.ENUM('tgStars', 'tonToken'),
				allowNull: false,
			},
			txType: {
				type: Sequelize.ENUM(
					'BUYER_TO_CONTRACT',
					'CONTRACT_TO_SELLER',
					'FEE',
					'RESOURCE_TRANSFER',
					'UPGRADE_RESOURCE',
					'TASK_RESOURCE',
					'EVENT_RESOURCE',
					'FARMING_RESOURCE',
					'GALAXY_RESOURCE'
				),
				allowNull: false,
			},
			blockchainTxId: {
				type: Sequelize.STRING,
				allowNull: true,
				comment: 'ID транзакции в блокчейне',
			},
			status: {
				type: Sequelize.ENUM('PENDING', 'CONFIRMED', 'FAILED'),
				defaultValue: 'PENDING',
			},
			createdAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.NOW,
			},
			confirmedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create MarketCommission table
		await queryInterface.createTable('marketcommissions', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
			},
			currency: {
				type: Sequelize.ENUM(
					'tgStars',
					'tonToken',
					'stardust',
					'darkMatter'
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
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
			},
		});

		// Create indexes
		await queryInterface.addIndex('marketoffers', ['sellerId'], {
			name: 'marketoffers_seller_id_idx',
		});
		await queryInterface.addIndex('marketoffers', ['status'], {
			name: 'marketoffers_status_idx',
		});
		await queryInterface.addIndex('marketoffers', ['expiresAt'], {
			name: 'marketoffers_expires_at_idx',
		});

		await queryInterface.addIndex('markettransactions', ['offerId'], {
			name: 'markettransactions_offer_id_idx',
		});
		await queryInterface.addIndex('markettransactions', ['buyerId'], {
			name: 'markettransactions_buyer_id_idx',
		});
		await queryInterface.addIndex('markettransactions', ['sellerId'], {
			name: 'markettransactions_seller_id_idx',
		});
		await queryInterface.addIndex('markettransactions', ['status'], {
			name: 'markettransactions_status_idx',
		});

		await queryInterface.addIndex(
			'paymenttransactions',
			['marketTransactionId'],
			{
				name: 'paymenttransactions_market_transaction_id_idx',
			}
		);
		await queryInterface.addIndex('paymenttransactions', ['fromAccount'], {
			name: 'paymenttransactions_from_account_idx',
		});
		await queryInterface.addIndex('paymenttransactions', ['toAccount'], {
			name: 'paymenttransactions_to_account_idx',
		});
		await queryInterface.addIndex('paymenttransactions', ['status'], {
			name: 'paymenttransactions_status_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		// Drop tables in reverse order
		await queryInterface.dropTable('marketcommissions');
		await queryInterface.dropTable('paymenttransactions');
		await queryInterface.dropTable('markettransactions');
		await queryInterface.dropTable('marketoffers');
	},
};
