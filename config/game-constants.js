/**
 * Game Constants - Centralized configuration for NebulaHunt game
 * These constants control game balance, economy, and progression
 */

const GAME_CONSTANTS = {
	// =============================================================================
	// ECONOMY CONSTANTS
	// =============================================================================
	ECONOMY: {
		// Base resource generation
		BASE_STARDUST_PER_HOUR: 500, // Base stardust generation per hour (when player has few stars)
		STARDUST_TO_STARS_RATIO: 100, // Base ratio - will be adjusted based on star count
		DARK_MATTER_DROP_CHANCE: 0.1, // 10% chance to get Dark Matter when collecting stardust
		BASE_DARK_MATTER_RATE: 5, // Base dark matter rate per hour

		// Initial resources for new players
		INITIAL_STARDUST: 50234234,
		INITIAL_DARK_MATTER: 123213,
		INITIAL_STARS: 1000,

		// Resource limits
		MAX_STARS: 100000, // Maximum stars limit
		MAX_STARS_RANGE: {
			MIN: 80000,
			MAX: 100000,
		},
	},

	// =============================================================================
	// UPGRADE BONUSES
	// =============================================================================
	UPGRADES: {
		// Stardust production upgrades
		STARDUST_PRODUCTION_BONUS: 0.1, // +10% per level
		STARDUST_MULTIPLIER_BONUS: 0.2, // +20% per level
		COSMIC_HARMONY_EFFECT: 0.15, // +15% per level

		// Star creation upgrades
		BULK_CREATION_DISCOUNT: 0.03, // 3% discount per level
		STELLAR_MARKET_CHANCE: 0.1, // 10% sale chance per level

		// Dark matter upgrades
		DARK_MATTER_CHANCE_BONUS: 0.5, // +50% per level
		QUANTUM_INSTABILITY_CHANCE: 0.02, // 2% chance per level
		VOID_RESONANCE_CHANCE: 0.05, // 5% chance per level

		// Auto collection
		AUTO_COLLECTOR_MAX_HOURS: 3, // Maximum collection hours with auto collector
	},

	// =============================================================================
	// TIME AND LIMITS
	// =============================================================================
	LIMITS: {
		// Bot notifications
		MAX_BOT_NOTIFICATIONS_PER_DAY: 5,
		MIN_BOT_NOTIFICATION_INTERVAL: 3 * 60 * 60 * 1000, // 3 hours in milliseconds

		// Collection intervals
		DARK_MATTER_INTERVALS_PER_HOUR: 6, // 6 intervals of 10 minutes per hour
		DEFAULT_COLLECTION_HOURS: 1, // Default max collection hours without auto collector
	},

	// =============================================================================
	// CALCULATION FACTORS
	// =============================================================================
	CALCULATIONS: {
		// Star effect on stardust generation
		STAR_EFFECT_MULTIPLIER: 60, // Multiplier for star count effect
		STAR_FACTOR_BASE: 1, // Base star factor

		// Cost scaling
		COST_MULTIPLIER_BASE: 1.1, // Base cost multiplier
		COST_MULTIPLIER_EXPONENT: 0.1, // Exponent for cost scaling

		// Galaxy multiplier
		GALAXY_MULTIPLIER_BASE: 1, // Base galaxy multiplier

		// Discount calculations
		DISCOUNT_MULTIPLIER_MIN: 0.5, // Minimum discount multiplier
		BULK_FACTOR_DIVISOR: 9, // Divisor for bulk factor calculation
	},
};

module.exports = GAME_CONSTANTS;
