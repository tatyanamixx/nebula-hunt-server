const ApiError = require('../exceptions/api-error');
const eventService = require('../service/event-service');

class EventController {
	async createEvent(req, res, next) {
		try {
			const { events } = req.body;

			// Validate events array
			if (!Array.isArray(events)) {
				throw ApiError.BadRequest('Events must be an array');
			}

			// Validate each event in the array
			events.forEach((eventData) => {
				// Validate event data
				if (!eventData.name || !eventData.type || !eventData.effect) {
					throw ApiError.BadRequest('Missing required event fields');
				}

				// Validate event type
				if (
					!['RANDOM', 'PERIODIC', 'ONE_TIME'].includes(eventData.type)
				) {
					throw ApiError.BadRequest('Invalid event type');
				}

				// Validate frequency for RANDOM and PERIODIC events
				if (
					eventData.type === 'RANDOM' &&
					(!eventData.frequency ||
						!eventData.frequency.chancePerSecond)
				) {
					throw ApiError.BadRequest(
						'Random events must specify chancePerSecond'
					);
				}
				if (
					eventData.type === 'PERIODIC' &&
					(!eventData.frequency || !eventData.frequency.interval)
				) {
					throw ApiError.BadRequest(
						'Periodic events must specify interval'
					);
				}
			});

			const createdEvents = await eventService.createEvents(events);
			return res.json(createdEvents);
		} catch (err) {
			next(err);
		}
	}

	async checkEvents(req, res, next) {
		try {
			const userId = req.userToken.id;
			const eventState = await eventService.checkAndTriggerEvents(userId);
			return res.json(eventState);
		} catch (err) {
			next(err);
		}
	}

	async getActiveEvents(req, res, next) {
		try {
			const userId = req.userToken.id;
			const activeEvents = await eventService.getActiveEvents(userId);
			return res.json(activeEvents);
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new EventController();
