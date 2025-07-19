/**
 * created by Tatyana Mikhniukevich on 17.07.2025
 */
const { ArtifactTemplate } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const sequelize = require('../db');
const { Op } = require('sequelize');

class ArtifactTemplateService {
	/**
	 * Create or update multiple artifact templates
	 * @param {Array} artifacts - Array of artifact data
	 * @returns {Promise<Array>} Created or updated artifacts
	 */
	async createArtifactTemplates(artifacts) {
		const t = await sequelize.transaction();

		try {
			const createdArtifacts = [];
			for (const artifact of artifacts) {
				// Validate artifact data
				if (!artifact.slug || !artifact.name || !artifact.description) {
					throw ApiError.BadRequest(
						'Invalid artifact data structure'
					);
				}

				// Validate description structure
				if (!artifact.description.en || !artifact.description.ru) {
					throw ApiError.BadRequest(
						'Description must contain both "en" and "ru" translations'
					);
				}

				// Try to find existing artifact with the same ID
				let existingArtifact = await ArtifactTemplate.findOne({
					where: { slug: artifact.slug },
					transaction: t,
				});

				if (existingArtifact) {
					// Update existing artifact
					await existingArtifact.update(artifact, { transaction: t });
					createdArtifacts.push(existingArtifact);
				} else {
					// Create new artifact
					const newArtifact = await ArtifactTemplate.create(
						artifact,
						{
							transaction: t,
						}
					);
					createdArtifacts.push(newArtifact);
				}
			}

			await t.commit();
			return createdArtifacts;
		} catch (err) {
			await t.rollback();
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(
				`Failed to create artifacts: ${err.message}`
			);
		}
	}

	/**
	 * Update an artifact template
	 * @param {string} slug - Artifact ID
	 * @param {Object} artifactData - Artifact data
	 * @returns {Promise<Object>} Updated artifact
	 */
	async updateArtifactTemplate(artifactData) {
		const t = await sequelize.transaction();

		try {
			// Find the artifact by ID
			const artifact = await ArtifactTemplate.findOne({
				where: { slug: artifactData.slug },
				transaction: t,
			});

			if (!artifact) {
				await t.rollback();
				throw ApiError.NotFound('Artifact not found');
			}

			// Update artifact data
			await artifact.update(artifactData, { transaction: t });

			await t.commit();
			return artifact;
		} catch (err) {
			await t.rollback();
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.BadRequest(
				'Failed to update artifact: ' + err.message
			);
		}
	}

	/**
	 * Delete an artifact template
	 * @param {string} slug - Artifact ID
	 * @returns {Promise<Object>} Result of deletion
	 */
	async deleteArtifactTemplate(slug) {
		const t = await sequelize.transaction();

		try {
			const artifact = await ArtifactTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!artifact) {
				await t.rollback();
				throw ApiError.NotFound('Artifact not found');
			}

			await artifact.destroy({ transaction: t });

			await t.commit();
			return { message: 'Artifact deleted successfully', slug: slug };
		} catch (err) {
			await t.rollback();
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.BadRequest(
				'Failed to delete artifact: ' + err.message
			);
		}
	}

	/**
	 * Get all artifact templates
	 * @returns {Promise<Array>} All artifacts
	 */
	async getAllArtifactTemplates() {
		try {
			const artifacts = await ArtifactTemplate.findAll({
				order: [['slug', 'ASC']],
			});
			return artifacts;
		} catch (err) {
			throw ApiError.Internal(`Failed to get artifacts: ${err.message}`);
		}
	}

	/**
	 * Get a specific artifact template
	 * @param {string} slug - Artifact ID
	 * @returns {Promise<Object>} Artifact
	 */
	async getArtifactTemplateBySlug(slug) {
		try {
			const artifact = await ArtifactTemplate.findOne({
				where: { slug },
			});

			if (!artifact) {
				throw ApiError.NotFound('Artifact not found');
			}

			return artifact;
		} catch (err) {
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(`Failed to get artifact: ${err.message}`);
		}
	}
}

module.exports = new ArtifactTemplateService();
