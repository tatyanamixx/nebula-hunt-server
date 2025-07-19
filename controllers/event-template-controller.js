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
	async createEventTemplates(req, res, next) {
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
			const eventData = req.body;

			const event = await eventTemplateService.updateEvent(eventData);
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
			const { slug } = req.params;

			const event = await eventTemplateService.getEventBySlug(slug);
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
			const { slug } = req.params;

			const result = await eventTemplateService.deleteEvent(slug);
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
	async toggleEventTemplateStatus(req, res, next) {
		try {
			const { slug } = req.params;	

			const event = await eventTemplateService.toggleTemplateStatus(slug);
			return res.json(event);
		} catch (e) {
			next(e);
		}
	}

}

module.exports = new EventTemplateController();
