/**
 * Миграция для создания таблицы достижений пользователей
 *
 * Эта миграция добавляет:
 * 1. Таблицу user_achievements для отслеживания достижений пользователей
 * 2. Таблицу achievement_templates для шаблонов достижений
 * 3. Индексы для оптимизации запросов
 * 4. Связи с существующими таблицами
 */

'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		const transaction = await queryInterface.sequelize.transaction();

		try {
			// Создаем таблицу шаблонов достижений
			await queryInterface.createTable(
				'achievement_templates',
				{
					id: {
						type: Sequelize.BIGINT,
						primaryKey: true,
						autoIncrement: true,
						comment: 'Уникальный идентификатор шаблона достижения',
					},
					code: {
						type: Sequelize.STRING(50),
						allowNull: false,
						unique: true,
						comment: 'Уникальный код достижения',
					},
					name: {
						type: Sequelize.JSONB,
						allowNull: false,
						comment: 'Название достижения на разных языках',
					},
					description: {
						type: Sequelize.JSONB,
						allowNull: false,
						comment: 'Описание достижения на разных языках',
					},
					category: {
						type: Sequelize.ENUM(
							'GENERAL',
							'COMBAT',
							'EXPLORATION',
							'ECONOMY',
							'SOCIAL',
							'SPECIAL'
						),
						allowNull: false,
						defaultValue: 'GENERAL',
						comment: 'Категория достижения',
					},
					icon: {
						type: Sequelize.STRING(100),
						allowNull: true,
						comment: 'Иконка достижения',
					},
					rarity: {
						type: Sequelize.ENUM(
							'COMMON',
							'RARE',
							'EPIC',
							'LEGENDARY',
							'MYTHIC'
						),
						allowNull: false,
						defaultValue: 'COMMON',
						comment: 'Редкость достижения',
					},
					points: {
						type: Sequelize.INTEGER,
						allowNull: false,
						defaultValue: 0,
						comment: 'Очки за достижение',
					},
					requirements: {
						type: Sequelize.JSONB,
						allowNull: false,
						defaultValue: {},
						comment: 'Требования для получения достижения',
					},
					rewards: {
						type: Sequelize.JSONB,
						allowNull: false,
						defaultValue: {},
						comment: 'Награды за достижение',
					},
					hidden: {
						type: Sequelize.BOOLEAN,
						allowNull: false,
						defaultValue: false,
						comment: 'Скрытое достижение',
					},
					active: {
						type: Sequelize.BOOLEAN,
						allowNull: false,
						defaultValue: true,
						comment: 'Активно ли достижение',
					},
					createdAt: {
						type: Sequelize.DATE,
						allowNull: false,
						defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
						comment: 'Дата создания',
					},
					updatedAt: {
						type: Sequelize.DATE,
						allowNull: false,
						defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
						comment: 'Дата обновления',
					},
				},
				{
					transaction,
					comment: 'Шаблоны достижений',
				}
			);

			// Создаем таблицу достижений пользователей
			await queryInterface.createTable(
				'user_achievements',
				{
					id: {
						type: Sequelize.BIGINT,
						primaryKey: true,
						autoIncrement: true,
						comment:
							'Уникальный идентификатор достижения пользователя',
					},
					userId: {
						type: Sequelize.BIGINT,
						allowNull: false,
						comment: 'ID пользователя',
					},
					achievementTemplateId: {
						type: Sequelize.BIGINT,
						allowNull: false,
						comment: 'ID шаблона достижения',
					},
					progress: {
						type: Sequelize.INTEGER,
						allowNull: false,
						defaultValue: 0,
						comment: 'Прогресс выполнения',
					},
					targetProgress: {
						type: Sequelize.INTEGER,
						allowNull: false,
						defaultValue: 1,
						comment: 'Целевой прогресс для завершения',
					},
					completed: {
						type: Sequelize.BOOLEAN,
						allowNull: false,
						defaultValue: false,
						comment: 'Завершено ли достижение',
					},
					completedAt: {
						type: Sequelize.DATE,
						allowNull: true,
						comment: 'Дата завершения достижения',
					},
					progressHistory: {
						type: Sequelize.JSONB,
						allowNull: false,
						defaultValue: [],
						comment: 'История прогресса',
					},
					rewardsClaimed: {
						type: Sequelize.BOOLEAN,
						allowNull: false,
						defaultValue: false,
						comment: 'Получены ли награды',
					},
					claimedAt: {
						type: Sequelize.DATE,
						allowNull: true,
						comment: 'Дата получения наград',
					},
					createdAt: {
						type: Sequelize.DATE,
						allowNull: false,
						defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
						comment: 'Дата создания записи',
					},
					updatedAt: {
						type: Sequelize.DATE,
						allowNull: false,
						defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
						comment: 'Дата обновления записи',
					},
				},
				{
					transaction,
					comment: 'Достижения пользователей',
				}
			);

			// Создаем индексы для таблицы achievement_templates
			await queryInterface.addIndex('achievement_templates', ['code'], {
				name: 'achievement_templates_code_idx',
				transaction,
			});

			await queryInterface.addIndex(
				'achievement_templates',
				['category'],
				{
					name: 'achievement_templates_category_idx',
					transaction,
				}
			);

			await queryInterface.addIndex('achievement_templates', ['rarity'], {
				name: 'achievement_templates_rarity_idx',
				transaction,
			});

			await queryInterface.addIndex('achievement_templates', ['active'], {
				name: 'achievement_templates_active_idx',
				transaction,
			});

			// Создаем индексы для таблицы user_achievements
			await queryInterface.addIndex('user_achievements', ['userId'], {
				name: 'user_achievements_user_id_idx',
				transaction,
			});

			await queryInterface.addIndex(
				'user_achievements',
				['achievementTemplateId'],
				{
					name: 'user_achievements_template_id_idx',
					transaction,
				}
			);

			await queryInterface.addIndex(
				'user_achievements',
				['userId', 'achievementTemplateId'],
				{
					name: 'user_achievements_user_template_idx',
					unique: true,
					transaction,
				}
			);

			await queryInterface.addIndex('user_achievements', ['completed'], {
				name: 'user_achievements_completed_idx',
				transaction,
			});

			await queryInterface.addIndex(
				'user_achievements',
				['rewardsClaimed'],
				{
					name: 'user_achievements_rewards_claimed_idx',
					transaction,
				}
			);

			// Создаем внешние ключи
			await queryInterface.addConstraint('user_achievements', {
				fields: ['userId'],
				type: 'foreign key',
				name: 'user_achievements_user_id_fk',
				references: {
					table: 'users',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
				transaction,
			});

			await queryInterface.addConstraint('user_achievements', {
				fields: ['achievementTemplateId'],
				type: 'foreign key',
				name: 'user_achievements_template_id_fk',
				references: {
					table: 'achievement_templates',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
				transaction,
			});

			// Добавляем поле для отслеживания общего прогресса достижений в userstate
			await queryInterface.addColumn(
				'userstates',
				'achievementPoints',
				{
					type: Sequelize.INTEGER,
					allowNull: false,
					defaultValue: 0,
					comment: 'Общее количество очков за достижения',
				},
				{ transaction }
			);

			await queryInterface.addColumn(
				'userstates',
				'achievementsCompleted',
				{
					type: Sequelize.INTEGER,
					allowNull: false,
					defaultValue: 0,
					comment: 'Количество завершенных достижений',
				},
				{ transaction }
			);

			await queryInterface.addColumn(
				'userstates',
				'achievementsProgress',
				{
					type: Sequelize.JSONB,
					allowNull: false,
					defaultValue: {},
					comment: 'Общий прогресс по категориям достижений',
				},
				{ transaction }
			);

			// Создаем индекс для нового поля
			await queryInterface.addIndex('userstates', ['achievementPoints'], {
				name: 'userstates_achievement_points_idx',
				transaction,
			});

			await transaction.commit();
		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	},

	async down(queryInterface, Sequelize) {
		const transaction = await queryInterface.sequelize.transaction();

		try {
			// Удаляем индексы
			await queryInterface.removeIndex(
				'userstates',
				'userstates_achievement_points_idx',
				{ transaction }
			);

			// Удаляем поля из userstates
			await queryInterface.removeColumn(
				'userstates',
				'achievementPoints',
				{ transaction }
			);
			await queryInterface.removeColumn(
				'userstates',
				'achievementsCompleted',
				{ transaction }
			);
			await queryInterface.removeColumn(
				'userstates',
				'achievementsProgress',
				{ transaction }
			);

			// Удаляем внешние ключи
			await queryInterface.removeConstraint(
				'user_achievements',
				'user_achievements_user_id_fk',
				{ transaction }
			);
			await queryInterface.removeConstraint(
				'user_achievements',
				'user_achievements_template_id_fk',
				{ transaction }
			);

			// Удаляем индексы
			await queryInterface.removeIndex(
				'user_achievements',
				'user_achievements_user_id_idx',
				{ transaction }
			);
			await queryInterface.removeIndex(
				'user_achievements',
				'user_achievements_template_id_idx',
				{ transaction }
			);
			await queryInterface.removeIndex(
				'user_achievements',
				'user_achievements_user_template_idx',
				{ transaction }
			);
			await queryInterface.removeIndex(
				'user_achievements',
				'user_achievements_completed_idx',
				{ transaction }
			);
			await queryInterface.removeIndex(
				'user_achievements',
				'user_achievements_rewards_claimed_idx',
				{ transaction }
			);

			await queryInterface.removeIndex(
				'achievement_templates',
				'achievement_templates_code_idx',
				{ transaction }
			);
			await queryInterface.removeIndex(
				'achievement_templates',
				'achievement_templates_category_idx',
				{ transaction }
			);
			await queryInterface.removeIndex(
				'achievement_templates',
				'achievement_templates_rarity_idx',
				{ transaction }
			);
			await queryInterface.removeIndex(
				'achievement_templates',
				'achievement_templates_active_idx',
				{ transaction }
			);

			// Удаляем таблицы
			await queryInterface.dropTable('user_achievements', {
				transaction,
			});
			await queryInterface.dropTable('achievement_templates', {
				transaction,
			});

			await transaction.commit();
		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	},
};
