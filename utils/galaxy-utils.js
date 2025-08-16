/**
 * Утилиты для работы с галактиками
 */

/**
 * Генерирует имя галактики на основе seed
 * @param {string} seed - Уникальный идентификатор галактики
 * @returns {string} Сгенерированное имя галактики
 */
function getGalaxyNameFromSeed(seed) {
	if (!seed || typeof seed !== "string" || !seed.length) {
		return "Unknown-0X00000";
	}

	// Список космических слов для первой части
	const words = [
		"Zeta",
		"Nova",
		"Orion",
		"Vega",
		"Lyra",
		"Astra",
		"Cygnus",
		"Draco",
		"Altair",
		"Sirius",
		"Aurora",
		"Nebula",
		"Pulsar",
		"Quasar",
		"Andromeda",
		"Phoenix",
		"Hydra",
		"Lynx",
		"Pegasus",
		"Taurus",
		"Cosmos",
		"Celestia",
		"Eclipse",
		"Horizon",
		"Infinity",
		"Meridian",
		"Nexus",
		"Polaris",
		"Quantum",
		"Radiance",
		"Stellar",
		"Umbra",
		"Vertex",
		"Zenith",
		"Astral",
		"Comet",
	];

	// Генерируем хеш из seed
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash * 31 + seed.charCodeAt(i)) % 1000000;
	}

	// Выбираем слово на основе хеша
	const word = words[hash % words.length];

	// Генерируем алфавитно-цифровой код в формате 2Ae11aA
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let code = "";

	// Используем разные части хеша для выбора символов
	for (let i = 0; i < 7; i++) {
		const charIndex = Math.floor((hash / Math.pow(10, i)) % chars.length);
		code += chars[charIndex];
	}

	// Объединяем слово и код через дефис
	return `${word}-${code}`;
}

/**
 * Генерирует случайное максимальное количество звезд для галактики
 * @param {string} seed - Seed для детерминированной генерации (опционально)
 * @returns {number} Максимальное количество звезд (80,000 - 100,000)
 */
function generateMaxStars(seed = null) {
	if (seed) {
		// Детерминированная генерация на основе seed
		let hash = 0;
		for (let i = 0; i < seed.length; i++) {
			hash = (hash * 31 + seed.charCodeAt(i)) % 1000000;
		}
		// Используем хеш для генерации числа в диапазоне 80k-100k
		return 80000 + (hash % 20001);
	} else {
		// Случайная генерация
		return Math.floor(Math.random() * (100000 - 80000 + 1) + 80000);
	}
}

/**
 * Генерирует стартовую дату рождения галактики
 * @returns {Date} Объект Date для корректной работы с Sequelize
 */
function generateBirthDate() {
	return new Date();
}

/**
 * Парсит данные галактики от клиента и подготавливает для создания в БД
 * @param {Object} clientGalaxyData - Данные галактики от клиента
 * @returns {Object} Подготовленные данные для БД
 */
function parseClientGalaxyData(clientGalaxyData) {
	if (!clientGalaxyData || !clientGalaxyData.seed) {
		throw new Error("Galaxy data must contain seed");
	}

	const seed = clientGalaxyData.seed;

	// Логируем входные данные для отладки
	console.log("🔍 parseClientGalaxyData - Input:", {
		birthDate: clientGalaxyData.birthDate,
		lastCollectTime: clientGalaxyData.lastCollectTime,
		birthDateType: typeof clientGalaxyData.birthDate,
		lastCollectTimeType: typeof clientGalaxyData.lastCollectTime,
	});

	const generatedBirthDate = generateBirthDate();
	const generatedLastCollectTime = new Date();

	console.log("🔍 parseClientGalaxyData - Generated:", {
		generatedBirthDate,
		generatedBirthDateType: typeof generatedBirthDate,
		generatedLastCollectTime,
		generatedLastCollectTimeType: typeof generatedLastCollectTime,
	});

	const result = {
		// === ОСНОВНЫЕ ПОЛЯ ===
		name: clientGalaxyData.name || getGalaxyNameFromSeed(seed),
		seed: seed,

		// === ЗВЕЗДЫ И РЕСУРСЫ ===
		starMin: clientGalaxyData.starMin || 100,
		starCurrent: clientGalaxyData.stars || clientGalaxyData.starCurrent || 1000,
		maxStars: clientGalaxyData.maxStars || generateMaxStars(seed),

		// === ВРЕМЕННЫЕ МЕТКИ ===
		birthDate: (() => {
			if (clientGalaxyData.birthDate) {
				const date = new Date(clientGalaxyData.birthDate);
				return isNaN(date.getTime()) ? generatedBirthDate : date;
			}
			return generatedBirthDate;
		})(),
		lastCollectTime: (() => {
			if (clientGalaxyData.lastCollectTime) {
				const date = new Date(clientGalaxyData.lastCollectTime);
				return isNaN(date.getTime()) ? generatedLastCollectTime : date;
			}
			return generatedLastCollectTime;
		})(),

		// === ВИЗУАЛЬНЫЕ СВОЙСТВА ===
		galaxyType: clientGalaxyData.type || clientGalaxyData.galaxyType || null,
		colorPalette: clientGalaxyData.colorPalette || null,
		backgroundType:
			clientGalaxyData.background || clientGalaxyData.backgroundType || null,

		// === ИГРОВЫЕ ПАРАМЕТРЫ ===
		price: clientGalaxyData.price || null, // Будет установлен в game-service
		particleCount: clientGalaxyData.particleCount || 100,
		onParticleCountChange:
			clientGalaxyData.onParticleCountChange !== undefined
				? clientGalaxyData.onParticleCountChange
				: true,

		// === ДОПОЛНИТЕЛЬНЫЕ СВОЙСТВА ===
		galaxyProperties: clientGalaxyData.galaxyProperties || {},
	};

	console.log("🔍 parseClientGalaxyData - Result:", {
		birthDate: result.birthDate,
		birthDateType: typeof result.birthDate,
		lastCollectTime: result.lastCollectTime,
		lastCollectTimeType: typeof result.lastCollectTime,
	});

	return result;
}

module.exports = {
	getGalaxyNameFromSeed,
	generateMaxStars,
	generateBirthDate,
	parseClientGalaxyData,
};
