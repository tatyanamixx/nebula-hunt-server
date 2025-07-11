/**
 * created by Claude on 15.07.2025
 */
const eventTemplateService = require('../service/event-template-service');
const ApiError = require('../exceptions/api-error');

class EventTemplateController {
	/**
	 * Create a new event template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async createEventTemplate(req, res, next) {
		try {
			const eventData = req.body;
			if (!eventData) {
				return next(
					ApiError.BadRequest('Invalid request: event data required')
				);
			}

			// Wrap the event data in an array for the createEvents method
			const result = await eventTemplateService.createEvents([eventData]);
			return res.json(result.events[0]);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Update an event template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async updateEventTemplate(req, res, next) {
		try {
			const { eventId } = req.params;
			const eventData = req.body;

			if (!eventId) {
				return next(ApiError.BadRequest('Event ID is required'));
			}

			const event = await eventTemplateService.updateEvent(
				eventId,
				eventData
			);
			return res.json(event);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Get all event templates
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async getAllEventTemplates(req, res, next) {
		try {
			const events = await eventTemplateService.getAllEvents();
			return res.json(events);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Get an event template by ID
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async getEventTemplate(req, res, next) {
		try {
			const { eventId } = req.params;

			if (!eventId) {
				return next(ApiError.BadRequest('Event ID is required'));
			}

			const event = await eventTemplateService.getEvent(eventId);
			return res.json(event);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Delete an event template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async deleteEventTemplate(req, res, next) {
		try {
			const { eventId } = req.params;

			if (!eventId) {
				return next(ApiError.BadRequest('Event ID is required'));
			}

			const result = await eventTemplateService.deleteEvent(eventId);
			return res.json(result);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Activate an event template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async activateEventTemplate(req, res, next) {
		try {
			const { eventId } = req.params;

			if (!eventId) {
				return next(ApiError.BadRequest('Event ID is required'));
			}

			// First get the current event to check its status
			const event = await eventTemplateService.getEvent(eventId);

			// Only toggle if it's not already active
			if (!event.active) {
				const updatedEvent =
					await eventTemplateService.toggleEventActive(eventId);
				return res.json(updatedEvent);
			}

			// If already active, just return the current event
			return res.json(event);
		} catch (e) {
			next(e);
		}
	}

	/**
	 * Deactivate an event template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 * @returns {Promise<void>}
	 */
	async deactivateEventTemplate(req, res, next) {
		try {
			const { eventId } = req.params;

			if (!eventId) {
				return next(ApiError.BadRequest('Event ID is required'));
			}

			// First get the current event to check its status
			const event = await eventTemplateService.getEvent(eventId);

			// Only toggle if it's currently active
			if (event.active) {
				const updatedEvent =
					await eventTemplateService.toggleEventActive(eventId);
				return res.json(updatedEvent);
			}

			// If already inactive, just return the current event
			return res.json(event);
		} catch (e) {
			next(e);
		}
	}
}

module.exports = new EventTemplateController();
