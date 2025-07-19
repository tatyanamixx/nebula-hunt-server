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
		const t = await sequelize.transaction();

		try {
			const createdEvents = [];

			for (const eventData of events) {
				// Try to find existing event with the same slug 
				let event = await EventTemplate.findOne({
					where: {
						slug: eventData.slug,
					},
					transaction: t,
				});

				if (event) {
					// Update existing event
					await event.update(eventData, { transaction: t });
					createdEvents.push(event);
				} else {
					// Create new event
					event = await EventTemplate.create(eventData, { transaction: t });
					createdEvents.push(event);
				}
			}

			await t.commit();

			return { events: createdEvents };
		} catch (err) {
			throw ApiError.BadRequest(
				'Failed to create events: ' + err.message
			);
		} finally {
			await t.rollback();
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
			const event = await EventTemplate.findOne({
				where: { slug: eventData.slug },
				transaction: t,
			});
			if (!event) {
				throw ApiError.BadRequest('Event template not found');
			}

			await event.update(eventData, { transaction: t });
			await t.commit();
			return event;
		} catch (err) {
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.BadRequest('Failed to update event: ' + err.message);
		} finally {
			await t.rollback();
		}
	}

	/**
	 * Get all event templates
	 * @returns {Promise<Array>} All event templates
	 */
	async getAllEvents() {
		const t = await sequelize.transaction();

		try {
			const events = await EventTemplate.findAll({
				order: [['slug', 'ASC']],
				transaction: t,
			});
			await t.commit();
			return events;
		} catch (err) {
			throw ApiError.Internal('Failed to get events: ' + err.message);
		} finally {
			await t.rollback();
		}
	}

	/**
	 * Get an event template by ID
	 * @param {string} slug - Event template slug
	 * @returns {Promise<Object>} Event template
	 */
	async getEvent(slug) {
		const t = await sequelize.transaction();

		try {
			const event = await EventTemplate.findOne({
				where: { slug },
				transaction: t,
			});
			if (!event) {
				throw ApiError.BadRequest('Event template not found');
			}
			await t.commit();
			return event;
		} catch (err) {
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal('Failed to get event: ' + err.message);
		} finally {
			await t.rollback();
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
			const event = await EventTemplate.findOne({
				where: { slug },
				transaction: t,
			});
			if (!event) {
				throw ApiError.BadRequest('Event template not found');
			}

			await event.destroy();
			await t.commit();
			return {
				message: 'Event template deleted successfully',
				slug: slug,
			};
		} catch (err) {
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal('Failed to delete event: ' + err.message);
		} finally {
			await t.rollback();
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
			const event = await EventTemplate.findOne({
				where: { slug },
				transaction: t,
			});
			if (!event) {
				throw ApiError.BadRequest('Event template not found');
			}

			event.active = !event.active;
			await event.save({ transaction: t });
			await t.commit();
			return event;
		} catch (err) {
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(
				'Failed to toggle event status: ' + err.message
			);
		} finally {
			await t.rollback();
		}
	}
}

module.exports = new EventTemplateService();
