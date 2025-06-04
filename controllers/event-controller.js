const eventService = require('../service/event-service');
const ApiError = require('../exceptions/api-error');

class EventController {
	async getUserEvents(req, res, next) {
		try {
			const id = req.tmaInitdata.id;
			const events = await eventService.getUserEvents(id);
			return res.json(events);
		} catch (e) {
			next(e);
		}
	}

	async checkEvents(req, res, next) {
		try {
			const id = req.tmaInitdata.id;
			const events = await eventService.checkAndTriggerEvents(id);
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
