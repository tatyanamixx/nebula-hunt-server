/**
 * created by Claude on 15.07.2025
 */
const { EventTemplate, sequelize } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const { ERROR_CODES } = require('../config/error-codes');
const logger = require('./logger-service');

class EventTemplateService {
	/**
	 * Create or update multiple event templates
	 * @param {Array} events - Array of event template data
	 * @returns {Promise<Object>} Created or updated event templates
	 */
	async createEvents(events) {
		const t = await sequelize.transaction();

		try {
			logger.debug('createEvents on start', {
				eventsCount: events.length,
			});
			const createdEvents = [];

			for (const eventData of events) {
				// Remove id from eventData to avoid conflicts with auto-increment
				const { id, ...eventDataWithoutId } = eventData;

				// Use findOrCreate to handle both creation and updates
				const [event, created] = await EventTemplate.findOrCreate({
					where: {
						slug: eventDataWithoutId.slug,
					},
					defaults: eventDataWithoutId,
					transaction: t,
				});

				if (!created) {
					// Update existing event
					await event.update(eventDataWithoutId, { transaction: t });
				}

				createdEvents.push(event.toJSON());
			}

			await t.commit();

			logger.debug('createEvents completed successfully', {
				createdCount: createdEvents.length,
			});

			return { events: createdEvents };
		} catch (err) {
			await t.rollback();

			logger.error('Failed to create event templates', {
				eventsCount: events.length,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.BadRequest(
				`Failed to create events: ${err.message}`,
				ERROR_CODES.EVENT.EVENT_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Update an event template
	 * @param {string} slug - Event template slug
	 * @param {Object} eventData - Event template data
	 * @returns {Promise<Object>} Updated event template
	 */
	async updateEvent(eventData) {
		const t = await sequelize.transaction();

		try {
			logger.debug('updateEvent on start', { slug: eventData.slug });

			const event = await EventTemplate.findOne({
				where: { slug: eventData.slug },
				transaction: t,
			});
			if (!event) {
				logger.debug('Event template not found for update', {
					slug: eventData.slug,
				});
				throw ApiError.NotFound(
					`Event template not found: ${eventData.slug}`,
					ERROR_CODES.EVENT.EVENT_TEMPLATE_NOT_FOUND
				);
			}

			// Remove id from eventData to avoid conflicts with auto-increment
			const { id, ...eventDataWithoutId } = eventData;
			await event.update(eventDataWithoutId, { transaction: t });
			await t.commit();

			logger.debug('updateEvent completed successfully', {
				slug: eventData.slug,
			});
			return event.toJSON();
		} catch (err) {
			await t.rollback();

			logger.error('Failed to update event template', {
				slug: eventData.slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.BadRequest(
				`Failed to update event: ${err.message}`,
				ERROR_CODES.EVENT.EVENT_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Get all event templates
	 * @returns {Promise<Array>} All event templates
	 */
	async getAllEvents() {
		try {
			logger.debug('getAllEvents on start');
			const events = await EventTemplate.findAll({
				order: [['slug', 'ASC']],
			});
			const result = events.map((event) => event.toJSON());

			logger.debug('getAllEvents completed successfully', {
				count: result.length,
			});
			return result;
		} catch (err) {
			logger.error('Failed to get all event templates', {
				error: err.message,
				stack: err.stack,
			});

			throw ApiError.Internal(
				`Failed to get events: ${err.message}`,
				ERROR_CODES.EVENT.EVENT_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Get an event template by ID
	 * @param {string} slug - Event template slug
	 * @returns {Promise<Object>} Event template
	 */
	async getEvent(slug) {
		try {
			logger.debug('getEvent on start', { slug });

			const event = await EventTemplate.findOne({
				where: { slug },
			});
			if (!event) {
				logger.debug('Event template not found', { slug });
				throw ApiError.NotFound(
					`Event template not found: ${slug}`,
					ERROR_CODES.EVENT.EVENT_TEMPLATE_NOT_FOUND
				);
			}
			logger.debug('getEvent completed successfully', { slug });
			return event.toJSON();
		} catch (err) {
			logger.error('Failed to get event template', {
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get event: ${err.message}`,
				ERROR_CODES.EVENT.EVENT_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Delete an event template
	 * @param {string} slug - Event template slug
	 * @returns {Promise<Object>} Result of deletion
	 */
	async deleteEvent(slug) {
		const t = await sequelize.transaction();

		try {
			logger.debug('deleteEvent on start', { slug });

			const event = await EventTemplate.findOne({
				where: { slug },
				transaction: t,
			});
			if (!event) {
				logger.debug('Event template not found for deletion', { slug });
				throw ApiError.NotFound(
					`Event template not found: ${slug}`,
					ERROR_CODES.EVENT.EVENT_TEMPLATE_NOT_FOUND
				);
			}

			await event.destroy({ transaction: t });
			await t.commit();

			logger.debug('deleteEvent completed successfully', { slug });
			return {
				message: 'Event template deleted successfully',
				slug: slug,
			};
		} catch (err) {
			await t.rollback();

			logger.error('Failed to delete event template', {
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to delete event: ${err.message}`,
				ERROR_CODES.EVENT.EVENT_TEMPLATE_NOT_FOUND
			);
		}
	}

	/**
	 * Toggle event template active status
	 * @param {string} slug - Event template slug
	 * @returns {Promise<Object>} Updated event template
	 */
	async toggleEventActive(slug) {
		const t = await sequelize.transaction();

		try {
			logger.debug('toggleEventActive on start', { slug });

			const event = await EventTemplate.findOne({
				where: { slug },
				transaction: t,
			});
			if (!event) {
				logger.debug('Event template not found for status toggle', {
					slug,
				});
				throw ApiError.NotFound(
					`Event template not found: ${slug}`,
					ERROR_CODES.EVENT.EVENT_TEMPLATE_NOT_FOUND
				);
			}

			event.active = !event.active;
			await event.save({ transaction: t });
			await t.commit();

			logger.debug('toggleEventActive completed successfully', {
				slug,
				newActiveStatus: event.active,
			});
			return event.toJSON();
		} catch (err) {
			await t.rollback();

			logger.error('Failed to toggle event template status', {
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to toggle event status: ${err.message}`,
				ERROR_CODES.EVENT.EVENT_TEMPLATE_NOT_FOUND
			);
		}
	}
}

module.exports = new EventTemplateService();
