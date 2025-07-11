/**
 * created by Claude on 15.07.2025
 */
const eventService = require('../service/event-service');
const ApiError = require('../exceptions/api-error');

class EventController {
	/**
	 * Get all active events for a user
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async getActiveEvents(req, res, next) {
		try {
			const userId = req.user.id;
			const events = await eventService.getActiveEvents(userId);
			return res.json(events);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Get all events for a user
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async getUserEvents(req, res, next) {
		try {
			const userId = req.user.id;
			const events = await eventService.getUserEvents(userId);
			return res.json(events);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Check and trigger events for a user
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async checkAndTriggerEvents(req, res, next) {
		try {
			const userId = req.user.id;
			const events = await eventService.checkAndTriggerEvents(userId);
			return res.json(events);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Trigger a specific event for a user
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async triggerEvent(req, res, next) {
		try {
			const userId = req.user.id;
			const { eventId } = req.params;

			if (!eventId) {
				return next(ApiError.BadRequest('Event ID is required'));
			}

			const event = await eventService.triggerEvent(userId, eventId);
			return res.json(event);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Complete an event for a user
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async completeEvent(req, res, next) {
		try {
			const userId = req.user.id;
			const { eventId } = req.params;

			if (!eventId) {
				return next(ApiError.BadRequest('Event ID is required'));
			}

			const event = await eventService.completeEvent(userId, eventId);
			return res.json(event);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Cancel an event for a user
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async cancelEvent(req, res, next) {
		try {
			const userId = req.user.id;
			const { eventId } = req.params;

			if (!eventId) {
				return next(ApiError.BadRequest('Event ID is required'));
			}

			const event = await eventService.cancelEvent(userId, eventId);
			return res.json(event);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Get a specific event for a user
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async getUserEvent(req, res, next) {
		try {
			const userId = req.user.id;
			const { eventId } = req.params;

			if (!eventId) {
				return next(ApiError.BadRequest('Event ID is required'));
			}

			const event = await eventService.getUserEvent(userId, eventId);
			return res.json(event);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Get event settings for a user
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async getUserEventSettings(req, res, next) {
		try {
			const userId = req.user.id;
			const settings = await eventService.getUserEventSettings(userId);
			return res.json(settings);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Update event settings for a user
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async updateUserEventSettings(req, res, next) {
		try {
			const userId = req.user.id;
			const settingsData = req.body;

			if (!settingsData) {
				return next(ApiError.BadRequest('Settings data is required'));
			}

			const settings = await eventService.updateUserEventSettings(
				userId,
				settingsData
			);
			return res.json(settings);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Get event statistics for a user
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async getUserEventStats(req, res, next) {
		try {
			const userId = req.user.id;
			const stats = await eventService.getUserEventStats(userId);
			return res.json(stats);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new EventController();
