const eventService = require('../service/event-service');
const ApiError = require('../exceptions/api-error');

class EventController {
	async getUserEvents(req, res, next) {
		try {
			const userId = req.user.id;
			const events = await eventService.getUserEvents(userId);
			return res.json(events);
		} catch (e) {
			next(e);
		}
	}

	async checkEvents(req, res, next) {
		try {
			const userId = req.user.id;
			const events = await eventService.checkAndTriggerEvents(userId);
			return res.json(events);
		} catch (e) {
			next(e);
		}
	}

	async createGameEvent(req, res, next) {
		try {
			const eventData = req.body;
			const event = await eventService.createGameEvent(eventData);
			return res.json(event);
		} catch (e) {
			next(e);
		}
	}

	async updateGameEvent(req, res, next) {
		try {
			const { eventId } = req.params;
			const eventData = req.body;
			const event = await eventService.updateGameEvent(
				eventId,
				eventData
			);
			return res.json(event);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new EventController();
