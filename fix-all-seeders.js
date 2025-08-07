const fs = require("fs");
const path = require("path");

// Функция для исправления JSONB полей в сидерах
function fixSeederFile(filePath) {
	console.log(`🔧 Исправляю файл: ${path.basename(filePath)}`);

	let content = fs.readFileSync(filePath, "utf8");
	let modified = false;

	// Исправляем одинарные кавычки на двойные
	content = content.replace(/'use strict';/g, '"use strict";');

	// Исправляем JSONB поля - добавляем JSON.stringify
	const jsonbPatterns = [
		// description поля
		{
			pattern: /description:\s*{([^}]+)}/g,
			replacement: "description: JSON.stringify({$1})",
		},
		// effects поля
		{
			pattern: /effects:\s*{([^}]+)}/g,
			replacement: "effects: JSON.stringify({$1})",
		},
		// modifiers поля
		{
			pattern: /modifiers:\s*{([^}]+)}/g,
			replacement: "modifiers: JSON.stringify({$1})",
		},
		// conditions поля
		{
			pattern: /conditions:\s*{([^}]+)}/g,
			replacement: "conditions: JSON.stringify({$1})",
		},
		// title поля
		{
			pattern: /title:\s*{([^}]+)}/g,
			replacement: "title: JSON.stringify({$1})",
		},
		// reward поля (если это объект)
		{
			pattern: /reward:\s*{([^}]+)}/g,
			replacement: "reward: JSON.stringify({$1})",
		},
		// condition поля
		{
			pattern: /condition:\s*{([^}]+)}/g,
			replacement: "condition: JSON.stringify({$1})",
		},
		// triggerConfig поля
		{
			pattern: /triggerConfig:\s*{([^}]+)}/g,
			replacement: "triggerConfig: JSON.stringify({$1})",
		},
		// effect поля
		{
			pattern: /effect:\s*{([^}]+)}/g,
			replacement: "effect: JSON.stringify({$1})",
		},
		// frequency поля
		{
			pattern: /frequency:\s*{([^}]+)}/g,
			replacement: "frequency: JSON.stringify({$1})",
		},
		// playerParameters поля
		{
			pattern: /playerParameters:\s*{([^}]+)}/g,
			replacement: "playerParameters: JSON.stringify({$1})",
		},
		// lastBotNotification поля
		{
			pattern: /lastBotNotification:\s*{([^}]+)}/g,
			replacement: "lastBotNotification: JSON.stringify({$1})",
		},
		// eventMultipliers поля
		{
			pattern: /eventMultipliers:\s*{([^}]+)}/g,
			replacement: "eventMultipliers: JSON.stringify({$1})",
		},
		// eventCooldowns поля
		{
			pattern: /eventCooldowns:\s*{([^}]+)}/g,
			replacement: "eventCooldowns: JSON.stringify({$1})",
		},
		// progress поля
		{
			pattern: /progress:\s*{([^}]+)}/g,
			replacement: "progress: JSON.stringify({$1})",
		},
		// galaxyProperties поля
		{
			pattern: /galaxyProperties:\s*{([^}]+)}/g,
			replacement: "galaxyProperties: JSON.stringify({$1})",
		},
	];

	jsonbPatterns.forEach(({ pattern, replacement }) => {
		const newContent = content.replace(pattern, replacement);
		if (newContent !== content) {
			content = newContent;
			modified = true;
		}
	});

	// Исправляем фиксированные ID на динамические
	if (
		content.includes("id: 1,") ||
		content.includes("id: 2,") ||
		content.includes("id: 3,")
	) {
		console.log(
			`  ⚠️  Файл содержит фиксированные ID - требует ручного исправления`
		);
	}

	// Исправляем кавычки в строках
	content = content.replace(/'([^']*)'/g, (match, p1) => {
		// Пропускаем уже исправленные JSON.stringify
		if (p1.includes("JSON.stringify")) return match;
		// Пропускаем специальные случаи
		if (p1.includes("use strict")) return match;
		return `"${p1}"`;
	});

	if (modified) {
		fs.writeFileSync(filePath, content, "utf8");
		console.log(`  ✅ Файл исправлен`);
	} else {
		console.log(`  ℹ️  Файл не требует исправлений`);
	}
}

// Основная функция
function fixAllSeeders() {
	console.log("🔧 Начинаю исправление всех сидеров...\n");

	const seedersDir = path.join(__dirname, "seeders");
	const files = fs.readdirSync(seedersDir).filter((file) => file.endsWith(".js"));

	files.forEach((file) => {
		const filePath = path.join(seedersDir, file);
		fixSeederFile(filePath);
	});

	console.log("\n🎉 Исправление завершено!");
	console.log("\n📋 Рекомендации:");
	console.log(
		"1. Проверьте файлы с фиксированными ID - их нужно исправить вручную"
	);
	console.log("2. Запустите тесты: npm run seed");
	console.log("3. Если есть ошибки, исправьте их вручную");
}

// Запускаем только если скрипт вызван напрямую
if (require.main === module) {
	fixAllSeeders();
}

module.exports = { fixAllSeeders, fixSeederFile };
