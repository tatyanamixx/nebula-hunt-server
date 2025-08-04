const express = require("express");
const router = express.Router();
const GAME_CONSTANTS = require("../config/game-constants");

/**
 * GET /api/game-constants
 * Returns all game constants for the client
 */
router.get("/", (req, res) => {
	try {
		res.json({
			success: true,
			data: GAME_CONSTANTS,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error fetching game constants:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch game constants",
			message: error.message,
		});
	}
});

/**
 * GET /api/game-constants/economy
 * Returns only economy constants
 */
router.get("/economy", (req, res) => {
	try {
		res.json({
			success: true,
			data: GAME_CONSTANTS.ECONOMY,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error fetching economy constants:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch economy constants",
			message: error.message,
		});
	}
});

/**
 * GET /api/game-constants/upgrades
 * Returns only upgrade constants
 */
router.get("/upgrades", (req, res) => {
	try {
		res.json({
			success: true,
			data: GAME_CONSTANTS.UPGRADES,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error fetching upgrade constants:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch upgrade constants",
			message: error.message,
		});
	}
});

/**
 * GET /api/game-constants/limits
 * Returns only limit constants
 */
router.get("/limits", (req, res) => {
	try {
		res.json({
			success: true,
			data: GAME_CONSTANTS.LIMITS,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error fetching limit constants:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch limit constants",
			message: error.message,
		});
	}
});

module.exports = router;
