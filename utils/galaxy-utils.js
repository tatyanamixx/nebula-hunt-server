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
 * Генерирует детерминированное количество звезд для захвата галактики на основе seed
 * @param {string} seed - Seed галактики
 * @returns {number} Количество звезд (40,000 - 60,000)
 */
function generateStarCountForCapture(seed) {
	if (!seed) {
		// Fallback к случайной генерации, если seed не передан
		return Math.floor(Math.random() * (60000 - 40000 + 1) + 40000);
	}
	
	// Детерминированная генерация на основе seed
	// Используем тот же алгоритм, что и на клиенте
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash * 31 + seed.charCodeAt(i)) % 1000000;
	}
	
	// Генерируем число в диапазоне 40000-60000
	const minStars = 40000;
	const maxStars = 60000;
	const range = maxStars - minStars + 1;
	const starCount = minStars + (Math.abs(hash) % range);
	
	return starCount;
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
		// ✅ Генерируем название на основе seed, если клиент не передал
		name: clientGalaxyData.name || getGalaxyNameFromSeed(seed),
		seed: seed,

		// === ЗВЕЗДЫ И РЕСУРСЫ ===
		starMin: clientGalaxyData.starMin || 100,
		// ✅ Принимаем starCurrent от клиента как есть:
		// - Для регистрации нового пользователя: 1000 звёзд
		// - Для награды за максимум звёзд: 1000 звёзд  
		// - Для захвата галактики: 40000-60000 (клиент получает от /preview-galaxy)
		// Если не передан - сервер сгенерирует в createGalaxyWithOffer
		starCurrent: (() => {
			const clientStarCurrent = clientGalaxyData.stars || clientGalaxyData.starCurrent;
			// Принимаем любое положительное значение от клиента
			if (clientStarCurrent && clientStarCurrent > 0) {
				return clientStarCurrent;
			}
			// Если не передано - возвращаем null, сервер сам рассчитает
			return null;
		})(),
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
		// ✅ Для захвата галактики используем свойства от клиента, если они переданы
		// Это нужно, чтобы галактика не изменилась после захвата (пользователь видит те же свойства)
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

/**
 * Генерирует детерминированный тип галактики на основе seed
 * @param {string} seed - Seed галактики
 * @returns {string} Тип галактики
 */
function generateGalaxyTypeFromSeed(seed) {
	if (!seed || typeof seed !== "string" || !seed.length) {
		return "spiral";
	}
	
	const types = [
		"spiral",
		"barred",
		"elliptical",
		"irregular",
		"ring",
		"lenticular",
	];
	
	// Используем тот же алгоритм хеширования, что и на клиенте
	const hash = seed.split("").reduce((a, b) => {
		a = (a << 5) - a + b.charCodeAt(0);
		return a & a;
	}, 0);
	
	return types[Math.abs(hash) % types.length];
}

/**
 * Генерирует детерминированную цветовую палитру на основе seed
 * @param {string} seed - Seed галактики
 * @returns {string} Цветовая палитра
 */
function generateColorPaletteFromSeed(seed) {
	if (!seed || typeof seed !== "string" || !seed.length) {
		return "cosmic";
	}
	
	const palettes = [
		"spiral",
		"barred",
		"elliptical",
		"irregular",
		"ring",
		"lenticular",
		"quasar",
		"dwarf",
		"nebula",
		"aurora",
		"cosmic",
		"stellar",
		"plasma",
		"crystal",
	];
	
	// Используем тот же алгоритм хеширования, что и на клиенте (+1 для смещения)
	const hash = seed.split("").reduce((a, b) => {
		a = (a << 5) - a + b.charCodeAt(0);
		return a & a;
	}, 0);
	
	return palettes[Math.abs(hash + 1) % palettes.length];
}

/**
 * Генерирует детерминированный фон галактики на основе seed
 * @param {string} seed - Seed галактики
 * @returns {string} Фон галактики
 */
function generateBackgroundFromSeed(seed) {
	if (!seed || typeof seed !== "string" || !seed.length) {
		return "stars";
	}
	
	const backgrounds = ["stars", "nebula", "cosmic", "aurora", "plasma"];
	
	// Используем тот же алгоритм хеширования, что и на клиенте (+2 для смещения)
	const hash = seed.split("").reduce((a, b) => {
		a = (a << 5) - a + b.charCodeAt(0);
		return a & a;
	}, 0);
	
	return backgrounds[Math.abs(hash + 2) % backgrounds.length];
}

module.exports = {
	getGalaxyNameFromSeed,
	generateMaxStars,
	generateStarCountForCapture,
	generateGalaxyTypeFromSeed,
	generateColorPaletteFromSeed,
	generateBackgroundFromSeed,
	generateBirthDate,
	parseClientGalaxyData,
};
