/**
 * Миграция для добавления отложенных внешних ключей
 *
 * Эта миграция:
 * 1. Удаляет существующие внешние ключи
 * 2. Создает новые внешние ключи с DEFERRABLE INITIALLY DEFERRED
 * 3. Позволяет отложить проверку ограничений до окончания транзакции
 */

'use strict';

module.exports = {
	async up(queryInterface, Sequelize) {
		try {
			// Удаляем существующие внешние ключи
			console.log('Удаляем существующие внешние ключи...');

			// userstates -> users
			try {
				await queryInterface.removeConstraint(
					'userstates',
					'userstates_user_id_fk'
				);
				console.log('Удален внешний ключ: userstates_user_id_fk');
			} catch (error) {
				console.log(
					'Внешний ключ userstates_user_id_fk не найден или уже удален'
				);
			}

			// tokens -> users
			try {
				await queryInterface.removeConstraint(
					'tokens',
					'tokens_user_id_fk'
				);
				console.log('Удален внешний ключ: tokens_user_id_fk');
			} catch (error) {
				console.log(
					'Внешний ключ tokens_user_id_fk не найден или уже удален'
				);
			}

			// galaxies -> users
			try {
				await queryInterface.removeConstraint(
					'galaxies',
					'galaxies_user_id_fk'
				);
				console.log('Удален внешний ключ: galaxies_user_id_fk');
			} catch (error) {
				console.log(
					'Внешний ключ galaxies_user_id_fk не найден или уже удален'
				);
			}

			// artifacts -> users
			try {
				await queryInterface.removeConstraint(
					'artifacts',
					'artifacts_user_id_fk'
				);
				console.log('Удален внешний ключ: artifacts_user_id_fk');
			} catch (error) {
				console.log(
					'Внешний ключ artifacts_user_id_fk не найден или уже удален'
				);
			}

			// artifacts -> artifacttemplates
			try {
				await queryInterface.removeConstraint(
					'artifacts',
					'artifacts_artifact_template_id_fk'
				);
				console.log(
					'Удален внешний ключ: artifacts_artifact_template_id_fk'
				);
			} catch (error) {
				console.log(
					'Внешний ключ artifacts_artifact_template_id_fk не найден или уже удален'
				);
			}

			// userupgrades -> users
			try {
				await queryInterface.removeConstraint(
					'userupgrades',
					'userupgrades_user_id_fk'
				);
				console.log('Удален внешний ключ: userupgrades_user_id_fk');
			} catch (error) {
				console.log(
					'Внешний ключ userupgrades_user_id_fk не найден или уже удален'
				);
			}

			// userupgrades -> upgradenodetemplates
			try {
				await queryInterface.removeConstraint(
					'userupgrades',
					'userupgrades_upgrade_node_template_id_fk'
				);
				console.log('Удален внешний ключ: userupgrades_upgrade_node_template_id_fk');
			} catch (error) {
				console.log(
					'Внешний ключ userupgrades_upgrade_node_template_id_fk не найден или уже удален'
				);
			}

			// usertasks -> users
			try {
				await queryInterface.removeConstraint(
					'usertasks',
					'usertasks_user_id_fk'
				);
				console.log('Удален внешний ключ: usertasks_user_id_fk');
			} catch (error) {
				console.log(
					'Внешний ключ usertasks_user_id_fk не найден или уже удален'
				);
			}

			// usertasks -> tasktemplates
			try {
				await queryInterface.removeConstraint(
					'usertasks',
					'usertasks_task_template_id_fk'
				);
				console.log('Удален внешний ключ: usertasks_task_template_id_fk');
			} catch (error) {
				console.log(
					'Внешний ключ usertasks_task_template_id_fk не найден или уже удален'
				);
			}

			// userevents -> users
			try {
				await queryInterface.removeConstraint(
					'userevents',
					'userevents_user_id_fk'
				);
				console.log('Удален внешний ключ: userevents_user_id_fk');
			} catch (error) {
				console.log(
					'Внешний ключ userevents_user_id_fk не найден или уже удален'
				);
			}

			// userevents -> eventtemplates
			try {
				await queryInterface.removeConstraint(
					'userevents',
					'userevents_event_template_id_fk'
				);
				console.log('Удален внешний ключ: userevents_event_template_id_fk');
			} catch (error) {
				console.log(
					'Внешний ключ userevents_event_template_id_fk не найден или уже удален'
				);
			}

			// usereventsettings -> users
			try {
				await queryInterface.removeConstraint(
					'usereventsettings',
					'usereventsettings_user_id_fk'
				);
				console.log(
					'Удален внешний ключ: usereventsettings_user_id_fk'
				);
			} catch (error) {
				console.log(
					'Внешний ключ usereventsettings_user_id_fk не найден или уже удален'
				);
			}

			// marketoffers -> users
			try {
				await queryInterface.removeConstraint(
					'marketoffers',
					'marketoffers_seller_id_fk'
				);
				console.log('Удален внешний ключ: marketoffers_seller_id_fk');
			} catch (error) {
				console.log(
					'Внешний ключ marketoffers_seller_id_fk не найден или уже удален'
				);
			}

			// markettransactions -> marketoffers
			try {
				await queryInterface.removeConstraint(
					'markettransactions',
					'markettransactions_offer_id_fk'
				);
				console.log(
					'Удален внешний ключ: markettransactions_offer_id_fk'
				);
			} catch (error) {
				console.log(
					'Внешний ключ markettransactions_offer_id_fk не найден или уже удален'
				);
			}

			// markettransactions -> users (buyer)
			try {
				await queryInterface.removeConstraint(
					'markettransactions',
					'markettransactions_buyer_id_fk'
				);
				console.log(
					'Удален внешний ключ: markettransactions_buyer_id_fk'
				);
			} catch (error) {
				console.log(
					'Внешний ключ markettransactions_buyer_id_fk не найден или уже удален'
				);
			}

			// markettransactions -> users (seller)
			try {
				await queryInterface.removeConstraint(
					'markettransactions',
					'markettransactions_seller_id_fk'
				);
				console.log(
					'Удален внешний ключ: markettransactions_seller_id_fk'
				);
			} catch (error) {
				console.log(
					'Внешний ключ markettransactions_seller_id_fk не найден или уже удален'
				);
			}

			// paymenttransactions -> users (fromAccount)
			try {
				await queryInterface.removeConstraint(
					'paymenttransactions',
					'paymenttransactions_from_account_fk'
				);
				console.log(
					'Удален внешний ключ: paymenttransactions_from_account_fk'
				);
			} catch (error) {
				console.log(
					'Внешний ключ paymenttransactions_from_account_fk не найден или уже удален'
				);
			}

			// paymenttransactions -> users (toAccount)
			try {
				await queryInterface.removeConstraint(
					'paymenttransactions',
					'paymenttransactions_to_account_fk'
				);
				console.log(
					'Удален внешний ключ: paymenttransactions_to_account_fk'
				);
			} catch (error) {
				console.log(
					'Внешний ключ paymenttransactions_to_account_fk не найден или уже удален'
				);
			}

			// paymenttransactions -> markettransactions
			try {
				await queryInterface.removeConstraint(
					'paymenttransactions',
					'paymenttransactions_market_transaction_id_fk'
				);
				console.log(
					'Удален внешний ключ: paymenttransactions_market_transaction_id_fk'
				);
			} catch (error) {
				console.log(
					'Внешний ключ paymenttransactions_market_transaction_id_fk не найден или уже удален'
				);
			}

			// Package tables will be handled in separate migration
			//admintokens -> admins
			try {
				await queryInterface.removeConstraint(
					'admintokens',
					'admintokens_admin_id_fk'
				);
				console.log('Удален внешний ключ: admintokens_admin_id_fk');
			} catch (error) {
				console.log(
					'Внешний ключ admintokens_admin_id_fk не найден или уже удален'
				);
			}

			//admininvites -> admins
			try {
				await queryInterface.removeConstraint(
					'admininvites',
					'admininvites_admin_id_fk'
				);
				console.log('Удален внешний ключ: admininvites_admin_id_fk');
			} catch (error) {
				console.log(
					'Внешний ключ admininvites_admin_id_fk не найден или уже удален'
				);
			}

			console.log('Создаем новые отложенные внешние ключи...');

			// Создаем новые отложенные внешние ключи
			await queryInterface.sequelize.query(`
        ALTER TABLE userstates 
        ADD CONSTRAINT userstates_user_id_fk 
        FOREIGN KEY ("userId") REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE tokens 
        ADD CONSTRAINT tokens_user_id_fk 
        FOREIGN KEY ("userId") REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE galaxies 
        ADD CONSTRAINT galaxies_user_id_fk 
        FOREIGN KEY ("userId") REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE artifacts 
        ADD CONSTRAINT artifacts_user_id_fk 
        FOREIGN KEY ("userId") REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE artifacts 
        ADD CONSTRAINT artifacts_artifact_template_id_fk 
        FOREIGN KEY ("artifactTemplateId") REFERENCES artifacttemplates(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE userupgrades 
        ADD CONSTRAINT userupgrades_user_id_fk 
        FOREIGN KEY ("userId") REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE userupgrades 
        ADD CONSTRAINT userupgrades_upgrade_node_template_id_fk 
        FOREIGN KEY ("upgradeNodeTemplateId") REFERENCES upgradenodetemplates(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE usertasks 
        ADD CONSTRAINT usertasks_user_id_fk 
        FOREIGN KEY ("userId") REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE usertasks 
        ADD CONSTRAINT usertasks_task_template_id_fk 
        FOREIGN KEY ("taskTemplateId") REFERENCES tasktemplates(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE userevents 
        ADD CONSTRAINT userevents_user_id_fk 
        FOREIGN KEY ("userId") REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE userevents 
        ADD CONSTRAINT userevents_event_template_id_fk 
        FOREIGN KEY ("eventTemplateId") REFERENCES eventtemplates(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE usereventsettings 
        ADD CONSTRAINT usereventsettings_user_id_fk 
        FOREIGN KEY ("userId") REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE marketoffers 
        ADD CONSTRAINT marketoffers_seller_id_fk 
        FOREIGN KEY ("sellerId") REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE markettransactions 
        ADD CONSTRAINT markettransactions_offer_id_fk 
        FOREIGN KEY ("offerId") REFERENCES marketoffers(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE markettransactions 
        ADD CONSTRAINT markettransactions_buyer_id_fk 
        FOREIGN KEY ("buyerId") REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE markettransactions 
        ADD CONSTRAINT markettransactions_seller_id_fk 
        FOREIGN KEY ("sellerId") REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE paymenttransactions 
        ADD CONSTRAINT paymenttransactions_from_account_fk 
        FOREIGN KEY ("fromAccount") REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE paymenttransactions 
        ADD CONSTRAINT paymenttransactions_to_account_fk 
        FOREIGN KEY ("toAccount") REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			await queryInterface.sequelize.query(`
        ALTER TABLE paymenttransactions 
        ADD CONSTRAINT paymenttransactions_market_transaction_id_fk 
        FOREIGN KEY ("marketTransactionId") REFERENCES markettransactions(id) 
        ON DELETE SET NULL ON UPDATE CASCADE 
        DEFERRABLE INITIALLY DEFERRED
      `);

			// Package tables will be handled in separate migration

			//admintokens -> admins
			await queryInterface.sequelize.query(`
        ALTER TABLE admintokens
        ADD CONSTRAINT admintokens_admin_id_fk
        FOREIGN KEY ("adminId") REFERENCES admins(id)
        ON DELETE CASCADE ON UPDATE CASCADE
        DEFERRABLE INITIALLY DEFERRED
        `);

			//admininvites -> admins
			await queryInterface.sequelize.query(`
        ALTER TABLE admininvites
        ADD CONSTRAINT admininvites_admin_id_fk
        FOREIGN KEY ("adminId") REFERENCES admins(id)
        ON DELETE CASCADE ON UPDATE CASCADE
        DEFERRABLE INITIALLY DEFERRED
        `);

		// packagestores -> users
		await queryInterface.sequelize.query(`
			ALTER TABLE packagestores
			ADD CONSTRAINT packagestores_user_id_fk
			FOREIGN KEY ("userId") REFERENCES users(id)
			ON DELETE CASCADE ON UPDATE CASCADE
			DEFERRABLE INITIALLY DEFERRED
		`);

		// packagestores -> packagetemplates
		await queryInterface.sequelize.query(`
			ALTER TABLE packagestores
			ADD CONSTRAINT packagestores_template_id_fk
			FOREIGN KEY ("packageTemplateId") REFERENCES packagetemplates(id)
			ON DELETE CASCADE ON UPDATE CASCADE
			DEFERRABLE INITIALLY DEFERRED
		`);

			console.log('Отложенные внешние ключи успешно созданы');
		} catch (error) {
			console.error(
				'Ошибка при создании отложенных внешних ключей:',
				error
			);
			throw error;
		}
	},

	async down(queryInterface, Sequelize) {
		try {
			console.log('Удаляем отложенные внешние ключи...');

			// Удаляем отложенные внешние ключи
			const constraints = [
				'userstates_user_id_fk',
				'tokens_user_id_fk',
				'galaxies_user_id_fk',
				'artifacts_user_id_fk',
				'artifacts_artifact_template_id_fk',
				'userupgrades_user_id_fk',
				'userupgrades_upgrade_node_template_id_fk',
				'usertasks_user_id_fk',
				'usertasks_task_template_id_fk',
				'userevents_user_id_fk',
				'userevents_event_template_id_fk',
				'usereventsettings_user_id_fk',
				'marketoffers_seller_id_fk',
				'markettransactions_offer_id_fk',
				'markettransactions_buyer_id_fk',
				'markettransactions_seller_id_fk',
				'paymenttransactions_from_account_fk',
				'paymenttransactions_to_account_fk',
				'paymenttransactions_market_transaction_id_fk',
				'packagestores_user_id_fk',
				//'packagestores_template_id_fk',
				// Package constraints will be handled in separate migration
				'admintokens_admin_id_fk',
				'admininvites_admin_id_fk',
			];

			for (const constraint of constraints) {
				try {
					// Определяем таблицу для каждого ограничения
					let tableName = '';
					if (constraint.includes('userstates'))
						tableName = 'userstates';
					else if (constraint.includes('tokens'))
						tableName = 'tokens';
					else if (constraint.includes('galaxies'))
						tableName = 'galaxies';
					else if (constraint.includes('artifacts'))
						tableName = 'artifacts';
					else if (
						constraint.includes('artifacts_artifact_template_id_fk')
					)
						tableName = 'artifacts';
					else if (constraint.includes('userupgrades'))
						tableName = 'userupgrades';
					else if (constraint.includes('usertasks'))
						tableName = 'usertasks';
					else if (constraint.includes('userevents'))
						tableName = 'userevents';
					else if (constraint.includes('usereventsettings'))
						tableName = 'usereventsettings';
					else if (constraint.includes('marketoffers'))
						tableName = 'marketoffers';
					else if (constraint.includes('markettransactions'))
						tableName = 'markettransactions';
					else if (constraint.includes('paymenttransactions'))
						tableName = 'paymenttransactions';
					else if (constraint.includes('packagestores'))
						tableName = 'packagestores';
					// Package tables will be handled in separate migration
					else if (constraint.includes('admintokens'))
						tableName = 'admintokens';
					else if (constraint.includes('admininvites'))
						tableName = 'admininvites';
					if (tableName) {
						await queryInterface.removeConstraint(
							tableName,
							constraint
						);
						console.log(`Удален внешний ключ: ${constraint}`);
					}
				} catch (error) {
					console.log(
						`Внешний ключ ${constraint} не найден или уже удален`
					);
				}
			}

			console.log('Создаем обычные внешние ключи...');

			// Создаем обычные внешние ключи (без DEFERRABLE)
			await queryInterface.addConstraint('userstates', {
				fields: ['userId'],
				type: 'foreign key',
				name: 'userstates_user_id_fk',
				references: {
					table: 'users',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('tokens', {
				fields: ['userId'],
				type: 'foreign key',
				name: 'tokens_user_id_fk',
				references: {
					table: 'users',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('galaxies', {
				fields: ['userId'],
				type: 'foreign key',
				name: 'galaxies_user_id_fk',
				references: {
					table: 'users',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('artifacts', {
				fields: ['userId'],
				type: 'foreign key',
				name: 'artifacts_user_id_fk',
				references: {
					table: 'users',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('artifacts', {
				fields: ['artifactTemplateId'],
				type: 'foreign key',
				name: 'artifacts_artifact_template_id_fk',
				references: {
					table: 'artifacttemplates',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('userupgrades', {
				fields: ['userId'],
				type: 'foreign key',
				name: 'userupgrades_user_id_fk',
				references: {
					table: 'users',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('userupgrades', {
				fields: ['upgradeNodeTemplateId'],
				type: 'foreign key',
				name: 'userupgrades_upgrade_node_template_id_fk',
				references: {
					table: 'upgradenodetemplates',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('usertasks', {
				fields: ['userId'],
				type: 'foreign key',
				name: 'usertasks_user_id_fk',
				references: {
					table: 'users',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('usertasks', {
				fields: ['taskTemplateId'],
				type: 'foreign key',
				name: 'usertasks_task_template_id_fk',
				references: {
					table: 'tasktemplates',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('userevents', {
				fields: ['userId'],
				type: 'foreign key',
				name: 'userevents_user_id_fk',
				references: {
					table: 'users',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('userevents', {
				fields: ['eventTemplateId'],
				type: 'foreign key',
				name: 'userevents_event_template_id_fk',
				references: {
					table: 'eventtemplates',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('usereventsettings', {
				fields: ['userId'],
				type: 'foreign key',
				name: 'usereventsettings_user_id_fk',
				references: {
					table: 'users',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('marketoffers', {
				fields: ['sellerId'],
				type: 'foreign key',
				name: 'marketoffers_seller_id_fk',
				references: {
					table: 'users',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('markettransactions', {
				fields: ['offerId'],
				type: 'foreign key',
				name: 'markettransactions_offer_id_fk',
				references: {
					table: 'marketoffers',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('markettransactions', {
				fields: ['buyerId'],
				type: 'foreign key',
				name: 'markettransactions_buyer_id_fk',
				references: {
					table: 'users',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('markettransactions', {
				fields: ['sellerId'],
				type: 'foreign key',
				name: 'markettransactions_seller_id_fk',
				references: {
					table: 'users',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('paymenttransactions', {
				fields: ['fromAccount'],
				type: 'foreign key',
				name: 'paymenttransactions_from_account_fk',
				references: {
					table: 'users',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('paymenttransactions', {
				fields: ['toAccount'],
				type: 'foreign key',
				name: 'paymenttransactions_to_account_fk',
				references: {
					table: 'users',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('paymenttransactions', {
				fields: ['marketTransactionId'],
				type: 'foreign key',
				name: 'paymenttransactions_market_transaction_id_fk',
				references: {
					table: 'markettransactions',
					field: 'id',
				},
				onDelete: 'SET NULL',
				onUpdate: 'CASCADE',
			});

			// Package tables will be handled in separate migration
			await queryInterface.addConstraint('packagestores', {
				fields: ['userId'],
				type: 'foreign key',
				name: 'packagestores_user_id_fk',
				references: {
					table: 'users',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			await queryInterface.addConstraint('packagestores', {
				fields: ['packageTemplateId'],
				type: 'foreign key',
				name: 'packagestores_template_id_fk',
				references: {
					table: 'packagetemplates',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			//admintokens -> admins
			await queryInterface.addConstraint('admintokens', {
				fields: ['adminId'],
				type: 'foreign key',
				name: 'admintokens_admin_id_fk',
				references: {
					table: 'admins',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});

			//admininvites -> admins
			await queryInterface.addConstraint('admininvites', {
				fields: ['adminId'],
				type: 'foreign key',
				name: 'admininvites_admin_id_fk',
				references: {
					table: 'admins',
					field: 'id',
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
			});
			console.log('Обычные внешние ключи успешно восстановлены');
		} catch (error) {
			console.error('Ошибка при восстановлении внешних ключей:', error);
			throw error;
		}
	},
};
