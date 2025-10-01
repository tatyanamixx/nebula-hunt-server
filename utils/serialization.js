/**
 * Утилиты для сериализации данных
 * Обработка BigInt и других типов данных для JSON ответов
 */

/**
 * Рекурсивно преобразует BigInt в строки для JSON сериализации
 * @param {any} obj - Объект для преобразования
 * @param {Set} visited - Множество уже посещенных объектов для предотвращения циклических ссылок
 * @returns {any} - Объект с преобразованными BigInt
 */
function serializeBigInt(obj, visited = new Set()) {
	if (obj === null || obj === undefined) {
		return obj;
	}

	if (typeof obj === "bigint") {
		return obj.toString();
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => serializeBigInt(item, visited));
	}

	if (typeof obj === "object") {
		// Проверяем, не посещали ли мы уже этот объект
		if (visited.has(obj)) {
			return "[Circular Reference]";
		}

		// Добавляем объект в множество посещенных
		visited.add(obj);

		const result = {};
		for (const [key, value] of Object.entries(obj)) {
			result[key] = serializeBigInt(value, visited);
		}

		// Удаляем объект из множества посещенных после обработки
		visited.delete(obj);

		return result;
	}

	return obj;
}

/**
 * Middleware для автоматической сериализации BigInt в ответах
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function bigIntSerializationMiddleware(req, res, next) {
	const originalJson = res.json;

	res.json = function (data) {
		const serializedData = serializeBigInt(data);
		return originalJson.call(this, serializedData);
	};

	next();
}

module.exports = {
	serializeBigInt,
	bigIntSerializationMiddleware,
};
