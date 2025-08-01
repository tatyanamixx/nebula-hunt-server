/**
 * DTO для UserState
 * Преобразует BigInt поля в строки для JSON сериализации
 */
module.exports = class UserStateDto {
	id;
	userId;
	stars;
	tonToken;
	stardust;
	darkMatter;
	lockedStars;
	lockedTonToken;
	lockedStardust;
	lockedDarkMatter;
	chaosLevel;
	stabilityLevel;
	entropyVelocity;
	currentStreak;
	maxStreak;
	lastDailyBonus;
	lastLoginDate;
	streakUpdatedAt;
	stateHistory;
	createdAt;
	updatedAt;

	constructor(model) {
		this.id = model.id;
		this.userId = String(model.userId); // Преобразуем BigInt в строку
		this.stars = Number(model.stars) || 0;
		this.tonToken = Number(model.tonToken) || 0;
		this.stardust = Number(model.stardust) || 0;
		this.darkMatter = Number(model.darkMatter) || 0;
		this.lockedStars = Number(model.lockedStars) || 0;
		this.lockedTonToken = Number(model.lockedTonToken) || 0;
		this.lockedStardust = Number(model.lockedStardust) || 0;
		this.lockedDarkMatter = Number(model.lockedDarkMatter) || 0;
		this.chaosLevel = Number(model.chaosLevel) || 0;
		this.stabilityLevel = Number(model.stabilityLevel) || 0;
		this.entropyVelocity = Number(model.entropyVelocity) || 0;
		this.currentStreak = Number(model.currentStreak) || 0;
		this.maxStreak = Number(model.maxStreak) || 0;
		this.lastDailyBonus = model.lastDailyBonus;
		this.lastLoginDate = model.lastLoginDate;
		this.streakUpdatedAt = model.streakUpdatedAt;
		this.stateHistory = model.stateHistory || [];
		this.createdAt = model.createdAt;
		this.updatedAt = model.updatedAt;
	}
};
