'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// 1. Создаем таблицу users
		await queryInterface.createTable('users', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				allowNull: false,
			},
			username: {
				type: Sequelize.STRING,
				allowNull: true,
			},
			role: {
				type: Sequelize.ENUM('USER', 'SYSTEM'),
				defaultValue: 'USER',
				allowNull: false,
			},
			referral: {
				type: Sequelize.BIGINT,
				defaultValue: 0,
				allowNull: false,
			},
			blocked: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			tonWallet: {
				type: Sequelize.STRING,
				allowNull: true,
				comment: 'TON wallet address of the user',
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

		// Индексы для users
		await queryInterface.addIndex('users', ['referral'], {
			name: 'user_referral_idx',
		});

		// 2. Создаем таблицу userstates
		await queryInterface.createTable('userstates', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			userId: {
				type: Sequelize.BIGINT,
				unique: true,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			stardust: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
				allowNull: false,
			},
			darkMatter: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
				allowNull: false,
			},
			tgStars: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
				allowNull: false,
			},
			lastDailyBonus: {
				type: Sequelize.DATE,
				allowNull: true,
			},
			lockedStardust: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
				allowNull: true,
			},
			lockedDarkMatter: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
				allowNull: true,
			},
			lockedTgStars: {
				type: Sequelize.INTEGER,
				defaultValue: 0,
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

		// Индексы для userstates
		await queryInterface.addIndex('userstates', ['userId'], {
			name: 'userstate_user_id_idx',
		});

		// 3. Создаем таблицу tokens
		await queryInterface.createTable('tokens', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			refreshToken: {
				type: Sequelize.TEXT,
				allowNull: false,
				comment: 'JWT refresh token (может быть длиннее 255 символов)',
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

		// Индексы для tokens
		await queryInterface.addIndex('tokens', ['refreshToken'], {
			name: 'tokens_refresh_token_idx',
		});
		await queryInterface.addIndex('tokens', ['userId'], {
			name: 'token_user_id_idx',
		});

		// 4. Создаем таблицу galaxies
		await queryInterface.createTable('galaxies', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			starMin: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
				allowNull: false,
			},
			starCurrent: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
				allowNull: false,
			},
			price: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
				allowNull: false,
			},
			seed: {
				type: Sequelize.STRING,
				unique: true,
				allowNull: false,
			},
			particleCount: {
				type: Sequelize.INTEGER,
				defaultValue: 100,
				allowNull: false,
			},
			onParticleCountChange: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
				allowNull: false,
			},
			galaxyProperties: {
				type: Sequelize.JSONB,
				allowNull: true,
			},
			active: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
				allowNull: false,
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

		// Индексы для galaxies
		await queryInterface.addIndex('galaxies', ['seed'], {
			name: 'galaxy_seed_idx',
		});
		await queryInterface.addIndex('galaxies', ['userId'], {
			name: 'galaxy_user_id_idx',
		});

		// 5. Создаем таблицу artifacts
		await queryInterface.createTable('artifacts', {
			id: {
				type: Sequelize.BIGINT,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			userId: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'users',
					key: 'id',
				},
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE',
			},
			seed: {
				type: Sequelize.STRING,
				unique: true,
				allowNull: false,
			},
			artifactTemplateId: {
				type: Sequelize.BIGINT,
				allowNull: false,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			description: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			tradable: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
				allowNull: false,
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

		// Индексы для artifacts
		await queryInterface.addIndex('artifacts', ['userId'], {
			name: 'artifact_user_id_idx',
		});
		await queryInterface.addIndex('artifacts', ['artifactTemplateId'], {
			name: 'artifact_artifact_template_id_idx',
		});
		await queryInterface.addIndex('artifacts', ['seed'], {
			name: 'artifact_seed_idx',
		});
		await queryInterface.addIndex('artifacts', ['tradable'], {
			name: 'artifact_tradable_idx',
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('artifacts');
		await queryInterface.dropTable('galaxies');
		await queryInterface.dropTable('tokens');
		await queryInterface.dropTable('userstates');
		await queryInterface.dropTable('users');
	},
};
