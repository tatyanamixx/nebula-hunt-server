/**
 * created by Tatyana Mikhniukevich on 26.05.2025
 */
const eventService = require('../service/event-service');
const ApiError = require('../exceptions/api-error');

class EventController {
	async createEvents(req, res, next) {
		try {
			const events = req.body;
			if (!events || !Array.isArray(events)) {
				return next(
					ApiError.BadRequest(
						'Invalid request: events array required'
					)
				);
			}

			const result = await eventService.createEvents(events);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async updateEvent(req, res, next) {
		try {
			const { eventId } = req.params;
			const eventData = req.body;

			if (!eventId) {
				return next(ApiError.BadRequest('Event ID is required'));
			}

			if (!eventData) {
				return next(ApiError.BadRequest('Event data is required'));
			}

			// Обновляем существующее событие
			const event = await eventService.updateEvent(eventId, eventData);

			return res.json(event);
		} catch (err) {
			next(err);
		}
	}

	async getAllEvents(req, res, next) {
		try {
			const events = await eventService.getAllEvents();
			return res.json(events);
		} catch (err) {
			next(err);
		}
	}

	async triggerEvent(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { eventId } = req.body;

			if (!eventId) {
				return next(ApiError.BadRequest('Event ID is required'));
			}

			const result = await eventService.triggerEvent(userId, eventId);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async getUserEvents(req, res, next) {
		try {
			const userId = req.initdata.id;
			const events = await eventService.getUserEvents(userId);
			return res.json(events);
		} catch (err) {
			next(err);
		}
	}

	async getUserEvent(req, res, next) {
		try {
			const userId = req.initdata.id;
			const { eventId } = req.params;

			if (!eventId) {
				return next(ApiError.BadRequest('Event ID is required'));
			}

			const event = await eventService.getUserEvent(userId, eventId);
			return res.json(event);
		} catch (err) {
			next(err);
		}
	}

	async checkAndTriggerEvents(req, res, next) {
		try {
			const userId = req.initdata.id;
			const result = await eventService.checkAndTriggerEvents(userId);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async initializeUserEvents(req, res, next) {
		try {
			const userId = req.initdata.id;
			const result = await eventService.initializeUserEvents(userId);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async getUserEventSettings(req, res, next) {
		try {
			const userId = req.initdata.id;
			const settings = await eventService.getUserEventSettings(userId);
			return res.json(settings);
		} catch (err) {
			next(err);
		}
	}

	async updateUserEventSettings(req, res, next) {
		try {
			const userId = req.initdata.id;
			const settings = req.body;

			if (!settings) {
				return next(ApiError.BadRequest('Settings are required'));
			}

			const result = await eventService.updateUserEventSettings(
				userId,
				settings
			);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async getUserEventStats(req, res, next) {
		try {
			const userId = req.initdata.id;
			const stats = await eventService.getUserEventStats(userId);
			return res.json(stats);
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new EventController();
