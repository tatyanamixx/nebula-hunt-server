"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// 1. Создаем таблицу marketoffers
		await queryInterface.createTable("marketoffers", {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			sellerId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			itemType: {
				type: Sequelize.ENUM(
					"artifact",
					"galaxy",
					"task",
					"package",
					"event",
					"upgrade",
					"resource"
				),
				allowNull: false,
			},
			itemId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				comment: "id предмета (artifactId, galaxyId и т.д.)",
			},
			amount: {
				type: Sequelize.DECIMAL,
				allowNull: false,
			},
			resource: {
				type: Sequelize.ENUM("stardust", "darkMatter", "stars"),
				allowNull: false,
			},
			price: {
				type: Sequelize.DECIMAL(30, 8),
				allowNull: false,
			},
			currency: {
				type: Sequelize.ENUM(
					"tgStars",
					"tonToken",
					"stars",
					"stardust",
					"darkMatter"
				),
				allowNull: false,
			},
			status: {
				type: Sequelize.ENUM("ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED"),
				defaultValue: "ACTIVE",
				allowNull: false,
			},
			offerType: {
				type: Sequelize.ENUM("SYSTEM", "P2P", "PERSONAL"),
				defaultValue: "SYSTEM",
				allowNull: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
				allowNull: false,
			},
			expiresAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			isItemLocked: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
				comment: "Флаг блокировки ресурса или объекта",
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
		});

		// 2. Создаем таблицу markettransactions
		await queryInterface.createTable("markettransactions", {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			offerId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			buyerId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			sellerId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			status: {
				type: Sequelize.ENUM("PENDING", "COMPLETED", "FAILED", "CANCELLED"),
				defaultValue: "PENDING",
				allowNull: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
				allowNull: false,
			},
			completedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
		});

		// 3. Создаем таблицу paymenttransactions
		await queryInterface.createTable("paymenttransactions", {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			marketTransactionId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			fromAccount: {
				type: Sequelize.BIGINT,
				allowNull: false,
				comment: "userId или system_wallet",
			},
			toAccount: {
				type: Sequelize.BIGINT,
				allowNull: false,
				comment: "userId или system_wallet",
			},
			priceOrAmount: {
				type: Sequelize.DECIMAL(30, 8),
				allowNull: false,
			},
			currencyOrResource: {
				type: Sequelize.ENUM(
					"tgStars",
					"tonToken",
					"stars",
					"stardust",
					"darkMatter"
				),
				allowNull: false,
			},
			txType: {
				type: Sequelize.ENUM(
					"BUYER_TO_CONTRACT",
					"CONTRACT_TO_SELLER",
					"FEE",
					"RESOURCE_TRANSFER",
					"UPGRADE_REWARD",
					"TASK_REWARD",
					"EVENT_REWARD",
					"FARMING_REWARD",
					"GALAXY_RESOURCE",
					"ARTIFACT_RESOURCE",
					"STARS_TRANSFER",
					"TON_TRANSFER",
					"TG_STARS_TRANSFER",
					"STARDUST_TRANSFER",
					"DARK_MATTER_TRANSFER",
					"DAILY_REWARD",
					"PACKAGE_REWARD",
					"STARDUST_PURCHASE",
					"DARK_MATTER_PURCHASE",
					"GALAXY_CAPTURE"
				),
				allowNull: false,
			},
			blockchainTxId: {
				type: Sequelize.STRING,
				allowNull: true,
				comment: "ID транзакции в блокчейне",
			},
			status: {
				type: Sequelize.ENUM("PENDING", "CONFIRMED", "FAILED", "CANCELLED"),
				defaultValue: "PENDING",
				allowNull: false,
			},
			createdAt: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
				allowNull: false,
			},
			confirmedAt: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
		});

		// 4. Создаем таблицу marketcommissions
		await queryInterface.createTable("marketcommissions", {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			currency: {
				type: Sequelize.ENUM(
					"tgstars",
					"tontoken",
					"stardust",
					"darkmatter",
					"stars"
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
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
		});

		// Создаем индексы
		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS marketoffer_seller_id_idx ON marketoffers ("sellerId");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS marketoffer_status_idx ON marketoffers ("status");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS marketoffer_item_type_idx ON marketoffers ("itemType");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS markettransaction_offer_id_idx ON markettransactions ("offerId");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS markettransaction_buyer_id_idx ON markettransactions ("buyerId");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS markettransaction_seller_id_idx ON markettransactions ("sellerId");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS markettransaction_status_idx ON markettransactions ("status");
		`);

		await queryInterface.sequelize.query(`
			CREATE INDEX IF NOT EXISTS paymenttransaction_market_transaction_id_idx ON paymenttransactions ("marketTransactionId");
		`);

		// Создаем отложенные внешние ключи
		await queryInterface.sequelize.query(`
			ALTER TABLE marketoffers 
			ADD CONSTRAINT marketoffers_seller_id_fkey 
			FOREIGN KEY ("sellerId") 
			REFERENCES users(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE markettransactions 
			ADD CONSTRAINT markettransactions_offer_id_fkey 
			FOREIGN KEY ("offerId") 
			REFERENCES marketoffers(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE markettransactions 
			ADD CONSTRAINT markettransactions_buyer_id_fkey 
			FOREIGN KEY ("buyerId") 
			REFERENCES users(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE markettransactions 
			ADD CONSTRAINT markettransactions_seller_id_fkey 
			FOREIGN KEY ("sellerId") 
			REFERENCES users(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE paymenttransactions 
			ADD CONSTRAINT paymenttransactions_market_transaction_id_fkey 
			FOREIGN KEY ("marketTransactionId") 
			REFERENCES markettransactions(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE paymenttransactions 
			ADD CONSTRAINT paymenttransactions_from_account_fkey 
			FOREIGN KEY ("fromAccount") 
			REFERENCES users(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);

		await queryInterface.sequelize.query(`
			ALTER TABLE paymenttransactions 
			ADD CONSTRAINT paymenttransactions_to_account_fkey 
			FOREIGN KEY ("toAccount") 
			REFERENCES users(id) 
			ON UPDATE CASCADE 
			ON DELETE CASCADE 
			DEFERRABLE INITIALLY DEFERRED;
		`);
	},

	async down(queryInterface, Sequelize) {
		// Удаляем отложенные ограничения
		await queryInterface.removeConstraint(
			"paymenttransactions",
			"paymenttransactions_to_account_fkey"
		);
		await queryInterface.removeConstraint(
			"paymenttransactions",
			"paymenttransactions_from_account_fkey"
		);
		await queryInterface.removeConstraint(
			"paymenttransactions",
			"paymenttransactions_market_transaction_id_fkey"
		);
		await queryInterface.removeConstraint(
			"markettransactions",
			"markettransactions_seller_id_fkey"
		);
		await queryInterface.removeConstraint(
			"markettransactions",
			"markettransactions_buyer_id_fkey"
		);
		await queryInterface.removeConstraint(
			"markettransactions",
			"markettransactions_offer_id_fkey"
		);
		await queryInterface.removeConstraint(
			"marketoffers",
			"marketoffers_seller_id_fkey"
		);

		// Удаляем индексы
		await queryInterface.removeIndex(
			"marketcommissions",
			"marketcommission_currency_idx"
		);
		await queryInterface.removeIndex(
			"paymenttransactions",
			"paymenttransaction_market_transaction_id_idx"
		);
		await queryInterface.removeIndex(
			"markettransactions",
			"markettransaction_status_idx"
		);
		await queryInterface.removeIndex(
			"markettransactions",
			"markettransaction_seller_id_idx"
		);
		await queryInterface.removeIndex(
			"markettransactions",
			"markettransaction_buyer_id_idx"
		);
		await queryInterface.removeIndex(
			"markettransactions",
			"markettransaction_offer_id_idx"
		);
		await queryInterface.removeIndex(
			"marketoffers",
			"marketoffer_item_type_idx"
		);
		await queryInterface.removeIndex("marketoffers", "marketoffer_status_idx");
		await queryInterface.removeIndex(
			"marketoffers",
			"marketoffer_seller_id_idx"
		);

		// Удаляем таблицы
		await queryInterface.dropTable("marketcommissions");
		await queryInterface.dropTable("paymenttransactions");
		await queryInterface.dropTable("markettransactions");
		await queryInterface.dropTable("marketoffers");
	},
};
