'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Получаем все записи из таблицы userstates
		const userstates = await queryInterface.sequelize.query(
			'SELECT id, "userId", "userUpgrades", "completedUpgrades", "activeUpgrades", "upgradeMultipliers", "lastUpgradeCheck", "userTasks", "completedTasks", "activeTasks", "taskMultipliers", "lastTaskCheck", "activeEvents", "eventMultipliers", "lastEventCheck", "eventCooldowns", "eventPreferences" FROM userstates',
			{ type: queryInterface.sequelize.QueryTypes.SELECT }
		);

		// Для каждого пользователя переносим данные в новые таблицы
		for (const userstate of userstates) {
			// 1. Переносим данные апгрейдов
			if (userstate.userUpgrades) {
				for (const [nodeId, upgradeData] of Object.entries(
					userstate.userUpgrades
				)) {
					await queryInterface.sequelize.query(
						`INSERT INTO userupgrades ("userId", "nodeId", level, progress, "targetProgress", completed, stability, instability, "progressHistory", "lastProgressUpdate", "createdAt", "updatedAt")
						VALUES (:userId, :nodeId, :level, :progress, :targetProgress, :completed, :stability, :instability, :progressHistory, :lastProgressUpdate, NOW(), NOW())`,
						{
							replacements: {
								userId: userstate.userId,
								nodeId: nodeId,
								level: upgradeData.level || 0,
								progress: upgradeData.progress || 0,
								targetProgress:
									upgradeData.targetProgress || 100,
								completed: upgradeData.completed || false,
								stability: upgradeData.stability || 0.0,
								instability: upgradeData.instability || 0.0,
								progressHistory: JSON.stringify(
									upgradeData.progressHistory || []
								),
								lastProgressUpdate:
									upgradeData.lastProgressUpdate ||
									new Date(),
							},
							type: queryInterface.sequelize.QueryTypes.INSERT,
						}
					);
				}
			}

			// 2. Переносим данные задач
			if (userstate.userTasks) {
				for (const [taskId, taskData] of Object.entries(
					userstate.userTasks
				)) {
					await queryInterface.sequelize.query(
						`INSERT INTO usertasks ("userId", "taskId", progress, "targetProgress", completed, reward, "progressHistory", "lastProgressUpdate", active, "completedAt", "createdAt", "updatedAt")
						VALUES (:userId, :taskId, :progress, :targetProgress, :completed, :reward, :progressHistory, :lastProgressUpdate, :active, :completedAt, NOW(), NOW())`,
						{
							replacements: {
								userId: userstate.userId,
								taskId: taskId,
								progress: taskData.progress || 0,
								targetProgress: taskData.targetProgress || 100,
								completed: taskData.completed || false,
								reward: taskData.reward || 0,
								progressHistory: JSON.stringify(
									taskData.progressHistory || []
								),
								lastProgressUpdate:
									taskData.lastProgressUpdate || new Date(),
								active: userstate.activeTasks
									? userstate.activeTasks.includes(taskId)
									: true,
								completedAt: taskData.completed
									? new Date()
									: null,
							},
							type: queryInterface.sequelize.QueryTypes.INSERT,
						}
					);
				}
			}

			// 3. Переносим данные событий
			if (
				userstate.activeEvents &&
				Array.isArray(userstate.activeEvents)
			) {
				for (const eventData of userstate.activeEvents) {
					await queryInterface.sequelize.query(
						`INSERT INTO userevents ("userId", "eventId", status, "triggeredAt", "expiresAt", effects, progress, "completedAt", "createdAt", "updatedAt")
						VALUES (:userId, :eventId, :status, :triggeredAt, :expiresAt, :effects, :progress, :completedAt, NOW(), NOW())`,
						{
							replacements: {
								userId: userstate.userId,
								eventId: eventData.id,
								status: eventData.status || 'ACTIVE',
								triggeredAt:
									eventData.triggeredAt || new Date(),
								expiresAt: eventData.expiresAt || null,
								effects: JSON.stringify(
									eventData.effects || {}
								),
								progress: JSON.stringify(
									eventData.progress || {}
								),
								completedAt: null,
							},
							type: queryInterface.sequelize.QueryTypes.INSERT,
						}
					);
				}
			}

			// 4. Создаем настройки событий
			await queryInterface.sequelize.query(
				`INSERT INTO usereventsettings ("userId", "eventMultipliers", "lastEventCheck", "eventCooldowns", "enabledTypes", "disabledEvents", "priorityEvents", "createdAt", "updatedAt")
				VALUES (:userId, :eventMultipliers, :lastEventCheck, :eventCooldowns, :enabledTypes, :disabledEvents, :priorityEvents, NOW(), NOW())`,
				{
					replacements: {
						userId: userstate.userId,
						eventMultipliers: JSON.stringify(
							userstate.eventMultipliers || {
								production: 1.0,
								chaos: 1.0,
								stability: 1.0,
								entropy: 1.0,
								rewards: 1.0,
							}
						),
						lastEventCheck: userstate.lastEventCheck || new Date(),
						eventCooldowns: JSON.stringify(
							userstate.eventCooldowns || {}
						),
						enabledTypes: userstate.eventPreferences
							?.enabledTypes || [
							'RANDOM',
							'PERIODIC',
							'CONDITIONAL',
						],
						disabledEvents:
							userstate.eventPreferences?.disabledEvents || [],
						priorityEvents:
							userstate.eventPreferences?.priorityEvents || [],
					},
					type: queryInterface.sequelize.QueryTypes.INSERT,
				}
			);
		}
	},

	async down(queryInterface, Sequelize) {
		// Очищаем новые таблицы
		await queryInterface.sequelize.query('DELETE FROM usereventsettings');
		await queryInterface.sequelize.query('DELETE FROM userevents');
		await queryInterface.sequelize.query('DELETE FROM usertasks');
		await queryInterface.sequelize.query('DELETE FROM userupgrades');
	},
};
