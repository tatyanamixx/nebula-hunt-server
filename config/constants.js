/**
 * Системные константы
 */

/* created by Tatyana Mikhniukevich on 06.07.2025 */

// ID системного пользователя (большое число, чтобы не конфликтовать с обычными пользователями)
const SYSTEM_USER_ID = 99999999999;
const SYSTEM_USER_USERNAME = 'SYSTEM';

// Количество пользователей в таблице лидеров
const LEADERBOARD_LIMIT = 100;

// Количество галактик для пользователя
const GALAXY_LIMIT_FOR_USER = 10;

// Game Settings
const DAILY_BONUS_STARDUST = 50;
const DAILY_BONUS_DARK_MATTER = 5;
const DAYS_TO_CLAIM_DAILY_BONUS_DARK_MATTER = [3, 5, 7];
const GALAXY_BASE_PRICE = 100;
const ARTIFACT_DROP_RATE = 0.1;

module.exports = {
	SYSTEM_USER_ID,
	SYSTEM_USER_USERNAME,
	LEADERBOARD_LIMIT,
	DAILY_BONUS_STARDUST,
	DAILY_BONUS_DARK_MATTER,
	DAYS_TO_CLAIM_DAILY_BONUS_DARK_MATTER,
	GALAXY_BASE_PRICE,
	ARTIFACT_DROP_RATE,
	GALAXY_LIMIT_FOR_USER,
};
