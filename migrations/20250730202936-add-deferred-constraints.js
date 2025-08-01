'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Добавляем отложенные ограничения для всех внешних ключей
		const constraints = [
			// userstates -> users
			{
				table: 'userstates',
				constraint: 'userstates_userId_fkey',
				columns: ['userId'],
				references: { table: 'users', column: 'id' },
			},
			// tokens -> users
			{
				table: 'tokens',
				constraint: 'tokens_userId_fkey',
				columns: ['userId'],
				references: { table: 'users', column: 'id' },
			},
			// galaxies -> users
			{
				table: 'galaxies',
				constraint: 'galaxies_userId_fkey',
				columns: ['userId'],
				references: { table: 'users', column: 'id' },
			},
			// artifacts -> users
			{
				table: 'artifacts',
				constraint: 'artifacts_userId_fkey',
				columns: ['userId'],
				references: { table: 'users', column: 'id' },
			},
			// artifacts -> artifacttemplates
			{
				table: 'artifacts',
				constraint: 'artifacts_artifactTemplateId_fkey',
				columns: ['artifactTemplateId'],
				references: { table: 'artifacttemplates', column: 'id' },
			},
			// userupgrades -> users
			{
				table: 'userupgrades',
				constraint: 'userupgrades_userId_fkey',
				columns: ['userId'],
				references: { table: 'users', column: 'id' },
			},
			// userupgrades -> upgradenodetemplates
			{
				table: 'userupgrades',
				constraint: 'userupgrades_upgradeNodeTemplateId_fkey',
				columns: ['upgradeNodeTemplateId'],
				references: { table: 'upgradenodetemplates', column: 'id' },
			},
			// usertasks -> users
			{
				table: 'usertasks',
				constraint: 'usertasks_userId_fkey',
				columns: ['userId'],
				references: { table: 'users', column: 'id' },
			},
			// usertasks -> tasktemplates
			{
				table: 'usertasks',
				constraint: 'usertasks_taskTemplateId_fkey',
				columns: ['taskTemplateId'],
				references: { table: 'tasktemplates', column: 'id' },
			},
			// userevents -> users
			{
				table: 'userevents',
				constraint: 'userevents_userId_fkey',
				columns: ['userId'],
				references: { table: 'users', column: 'id' },
			},
			// userevents -> eventtemplates
			{
				table: 'userevents',
				constraint: 'userevents_eventTemplateId_fkey',
				columns: ['eventTemplateId'],
				references: { table: 'eventtemplates', column: 'id' },
			},
			// usereventsettings -> users
			{
				table: 'usereventsettings',
				constraint: 'usereventsettings_userId_fkey',
				columns: ['userId'],
				references: { table: 'users', column: 'id' },
			},
			// packagestore -> users
			{
				table: 'packagestore',
				constraint: 'packagestore_userId_fkey',
				columns: ['userId'],
				references: { table: 'users', column: 'id' },
			},
			// packagestore -> packagetemplates
			{
				table: 'packagestore',
				constraint: 'packagestore_packageTemplateId_fkey',
				columns: ['packageTemplateId'],
				references: { table: 'packagetemplates', column: 'id' },
			},
			// marketoffers -> users
			{
				table: 'marketoffers',
				constraint: 'marketoffers_sellerId_fkey',
				columns: ['sellerId'],
				references: { table: 'users', column: 'id' },
			},
			// markettransactions -> marketoffers
			{
				table: 'markettransactions',
				constraint: 'markettransactions_offerId_fkey',
				columns: ['offerId'],
				references: { table: 'marketoffers', column: 'id' },
			},
			// markettransactions -> users (buyer)
			{
				table: 'markettransactions',
				constraint: 'markettransactions_buyerId_fkey',
				columns: ['buyerId'],
				references: { table: 'users', column: 'id' },
			},
			// markettransactions -> users (seller)
			{
				table: 'markettransactions',
				constraint: 'markettransactions_sellerId_fkey',
				columns: ['sellerId'],
				references: { table: 'users', column: 'id' },
			},
			// paymenttransactions -> markettransactions
			{
				table: 'paymenttransactions',
				constraint: 'paymenttransactions_marketTransactionId_fkey',
				columns: ['marketTransactionId'],
				references: { table: 'markettransactions', column: 'id' },
			},
			// paymenttransactions -> users (fromAccount)
			{
				table: 'paymenttransactions',
				constraint: 'paymenttransactions_fromAccount_fkey',
				columns: ['fromAccount'],
				references: { table: 'users', column: 'id' },
			},
			// paymenttransactions -> users (toAccount)
			{
				table: 'paymenttransactions',
				constraint: 'paymenttransactions_toAccount_fkey',
				columns: ['toAccount'],
				references: { table: 'users', column: 'id' },
			},
			// admintokens -> admins
			{
				table: 'admintokens',
				constraint: 'admintokens_adminId_fkey',
				columns: ['adminId'],
				references: { table: 'admins', column: 'id' },
			},
			// admininvites -> admins
			{
				table: 'admininvites',
				constraint: 'admininvites_adminId_fkey',
				columns: ['adminId'],
				references: { table: 'admins', column: 'id' },
			},
		];

		// Удаляем существующие ограничения и создаем новые с отложенной проверкой
		for (const constraint of constraints) {
			try {
				// Удаляем существующее ограничение
				await queryInterface.removeConstraint(
					constraint.table,
					constraint.constraint
				);
			} catch (error) {
				// Игнорируем ошибки если ограничение не существует
				console.log(
					`Constraint ${constraint.constraint} not found, skipping removal`
				);
			}

			// Создаем новое ограничение с отложенной проверкой
			await queryInterface.addConstraint(constraint.table, {
				fields: constraint.columns,
				type: 'foreign key',
				name: constraint.constraint,
				references: {
					table: constraint.references.table,
					field: constraint.references.column,
				},
				onDelete: 'CASCADE',
				onUpdate: 'CASCADE',
				deferrable: 'INITIALLY DEFERRED',
			});
		}
	},

	async down(queryInterface, Sequelize) {
		// В down миграции просто удаляем все ограничения
		const constraints = [
			'userstates_userId_fkey',
			'tokens_userId_fkey',
			'galaxies_userId_fkey',
			'artifacts_userId_fkey',
			'artifacts_artifactTemplateId_fkey',
			'userupgrades_userId_fkey',
			'userupgrades_upgradeNodeTemplateId_fkey',
			'usertasks_userId_fkey',
			'usertasks_taskTemplateId_fkey',
			'userevents_userId_fkey',
			'userevents_eventTemplateId_fkey',
			'usereventsettings_userId_fkey',
			'packagestore_userId_fkey',
			'packagestore_packageTemplateId_fkey',
			'marketoffers_sellerId_fkey',
			'markettransactions_offerId_fkey',
			'markettransactions_buyerId_fkey',
			'markettransactions_sellerId_fkey',
			'paymenttransactions_marketTransactionId_fkey',
			'paymenttransactions_fromAccount_fkey',
			'paymenttransactions_toAccount_fkey',
			'admintokens_adminId_fkey',
			'admininvites_adminId_fkey',
		];

		for (const constraintName of constraints) {
			try {
				await queryInterface.removeConstraint(
					constraintName.includes('userstates')
						? 'userstates'
						: constraintName.includes('tokens')
						? 'tokens'
						: constraintName.includes('galaxies')
						? 'galaxies'
						: constraintName.includes('artifacts')
						? 'artifacts'
						: constraintName.includes('userupgrades')
						? 'userupgrades'
						: constraintName.includes('usertasks')
						? 'usertasks'
						: constraintName.includes('userevents')
						? 'userevents'
						: constraintName.includes('usereventsettings')
						? 'usereventsettings'
						: constraintName.includes('packagestore')
						? 'packagestore'
						: constraintName.includes('marketoffers')
						? 'marketoffers'
						: constraintName.includes('markettransactions')
						? 'markettransactions'
						: constraintName.includes('paymenttransactions')
						? 'paymenttransactions'
						: constraintName.includes('admintokens')
						? 'admintokens'
						: 'admininvites',
					constraintName
				);
			} catch (error) {
				console.log(
					`Constraint ${constraintName} not found, skipping removal`
				);
			}
		}
	},
};
