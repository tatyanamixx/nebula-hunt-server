/**
 * created by Claude on 15.07.2025
 */
const { EventTemplate } = require('../models/models');
const ApiError = require('../exceptions/api-error');

class EventTemplateService {
	/**
	 * Create or update multiple event templates
	 * @param {Array} events - Array of event template data
	 * @returns {Promise<Object>} Created or updated event templates
	 */
	async createEvents(events) {
		try {
			const createdEvents = [];

			for (const eventData of events) {
				// Try to find existing event with the same ID or name
				let event = await EventTemplate.findOne({
					where: {
						id: eventData.id || null,
					},
				});

				if (!event && eventData.name) {
					// If not found by ID, try to find by name
					event = await EventTemplate.findOne({
						where: { name: eventData.name },
					});
				}

				if (event) {
					// Update existing event
					await event.update(eventData);
					createdEvents.push(event);
				} else {
					// Create new event
					event = await EventTemplate.create(eventData);
					createdEvents.push(event);
				}
			}

			return { events: createdEvents };
		} catch (err) {
			throw ApiError.BadRequest(
				'Failed to create events: ' + err.message
			);
		}
	}

	/**
	 * Update an event template
	 * @param {string} eventId - Event template ID
	 * @param {Object} eventData - Event template data
	 * @returns {Promise<Object>} Updated event template
	 */
	async updateEvent(eventId, eventData) {
		try {
			const event = await EventTemplate.findByPk(eventId);
			if (!event) {
				throw ApiError.BadRequest('Event template not found');
			}

			await event.update(eventData);
			return event;
		} catch (err) {
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.BadRequest('Failed to update event: ' + err.message);
		}
	}

	/**
	 * Get all event templates
	 * @returns {Promise<Array>} All event templates
	 */
	async getAllEvents() {
		try {
			const events = await EventTemplate.findAll({
				order: [['id', 'ASC']],
			});
			return events;
		} catch (err) {
			throw ApiError.Internal('Failed to get events: ' + err.message);
		}
	}

	/**
	 * Get an event template by ID
	 * @param {string} eventId - Event template ID
	 * @returns {Promise<Object>} Event template
	 */
	async getEvent(eventId) {
		try {
			const event = await EventTemplate.findByPk(eventId);
			if (!event) {
				throw ApiError.BadRequest('Event template not found');
			}
			return event;
		} catch (err) {
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal('Failed to get event: ' + err.message);
		}
	}

	/**
	 * Delete an event template
	 * @param {string} eventId - Event template ID
	 * @returns {Promise<Object>} Result of deletion
	 */
	async deleteEvent(eventId) {
		try {
			const event = await EventTemplate.findByPk(eventId);
			if (!event) {
				throw ApiError.BadRequest('Event template not found');
			}

			await event.destroy();
			return {
				message: 'Event template deleted successfully',
				id: eventId,
			};
		} catch (err) {
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal('Failed to delete event: ' + err.message);
		}
	}

	/**
	 * Toggle event template active status
	 * @param {string} eventId - Event template ID
	 * @returns {Promise<Object>} Updated event template
	 */
	async toggleEventActive(eventId) {
		try {
			const event = await EventTemplate.findByPk(eventId);
			if (!event) {
				throw ApiError.BadRequest('Event template not found');
			}

			event.active = !event.active;
			await event.save();

			return event;
		} catch (err) {
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(
				'Failed to toggle event status: ' + err.message
			);
		}
	}
}

module.exports = new EventTemplateService();
