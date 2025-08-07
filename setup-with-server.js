const { spawn } = require("child_process");
const { sequelize } = require("./models");

async function waitForServer() {
	console.log("🔄 Ожидание запуска сервера...");

	return new Promise((resolve) => {
		const checkInterval = setInterval(async () => {
			try {
				await sequelize.authenticate();
				console.log("✅ Сервер готов!");
				clearInterval(checkInterval);
				resolve();
			} catch (error) {
				// Сервер еще не готов, продолжаем ждать
			}
		}, 1000);
	});
}

async function createSystemUser() {
	console.log("🔧 Создание системного пользователя...");

	try {
		// Проверяем, есть ли уже системный пользователь
		const systemUser = await sequelize.query(
			"SELECT id FROM users WHERE role = :role",
			{
				replacements: { role: "SYSTEM" },
				type: sequelize.QueryTypes.SELECT,
			}
		);

		if (systemUser.length === 0) {
			// Создаем системного пользователя
			await sequelize.query(
				`INSERT INTO users (id, username, role, referral, blocked, "createdAt", "updatedAt") 
         VALUES (1, 'system', 'SYSTEM', 0, false, NOW(), NOW())`
			);

			// Создаем состояние для системного пользователя
			await sequelize.query(
				`INSERT INTO userstates ("userId", stardust, "darkMatter", stars, "tgStars", "tonToken", 
         "lastLoginDate", "currentStreak", "maxStreak", "streakUpdatedAt", "chaosLevel", "stabilityLevel", 
         "entropyVelocity", "lockedStardust", "lockedDarkMatter", "lockedStars", "playerParameters", 
         "lastBotNotification", "createdAt", "updatedAt")
         VALUES (1, 0, 0, 0, 0, 0, NULL, 0, 0, NULL, 0.0, 0.0, 0.0, 0, 0, 0, 
         '{"stardustProduction":0,"starDiscount":0,"darkMatterChance":0,"stardustMultiplier":0,"galaxyExplorer":0,"darkMatterSynthesis":0,"bulkCreation":0,"stellarMarket":0,"cosmicHarmony":0,"overflowProtection":0,"quantumInstability":0,"voidResonance":0,"stellarForge":0}',
         '{"lastBotNotificationTime":null,"lastBotNotificationToday":{"date":null,"count":0}}',
         NOW(), NOW())`
			);

			console.log("✅ Системный пользователь создан");
		} else {
			console.log("ℹ️  Системный пользователь уже существует");
		}
	} catch (error) {
		console.error("❌ Ошибка при создании системного пользователя:", error);
	}
}

async function runSeeders() {
	console.log("🌱 Запуск сидеров...");

	return new Promise((resolve, reject) => {
		const seedProcess = spawn("npx", ["sequelize-cli", "db:seed:all"], {
			stdio: "inherit",
			shell: true,
		});

		seedProcess.on("close", (code) => {
			if (code === 0) {
				console.log("✅ Сидеры выполнены успешно!");
				resolve();
			} else {
				console.error("❌ Ошибка при выполнении сидеров");
				reject(new Error(`Seeders failed with code ${code}`));
			}
		});
	});
}

async function main() {
	try {
		console.log("🚀 Начинаем настройку базы данных...");

		// Ждем запуска сервера
		await waitForServer();

		// Создаем системного пользователя
		await createSystemUser();

		// Запускаем сидеры
		await runSeeders();

		console.log("🎉 Настройка завершена успешно!");
	} catch (error) {
		console.error("❌ Ошибка при настройке:", error);
		process.exit(1);
	} finally {
		await sequelize.close();
	}
}

// Запускаем только если скрипт вызван напрямую
if (require.main === module) {
	main();
}

module.exports = { main };
