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
	playerParameters;
	lastBotNotification;
	tutorialCompleted;
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
		this.playerParameters = model.playerParameters || {
			stardustProduction: 0,
			starDiscount: 0,
			darkMatterChance: 0,
			stardustMultiplier: 0,
			galaxyExplorer: 0,
			darkMatterSynthesis: 0,
			bulkCreation: 0,
			stellarMarket: 0,
			cosmicHarmony: 0,
			overflowProtection: 0,
			quantumInstability: 0,
			voidResonance: 0,
			stellarForge: 0,
		};
		this.lastBotNotification = model.lastBotNotification || {
			lastBotNotificationTime: null,
			lastBotNotificationToday: {
				date: null,
				count: 0,
			},
		};
		this.tutorialCompleted = Boolean(model.tutorialCompleted);
		this.createdAt = model.createdAt;
		this.updatedAt = model.updatedAt;
	}
};
