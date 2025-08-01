/**
 * created by Tatyana Mikhniukevich on 17.07.2025
 */
const { ArtifactTemplate } = require('../models/models');
const ApiError = require('../exceptions/api-error');
const { ERROR_CODES } = require('../config/error-codes');
const sequelize = require('../db');
const { Op } = require('sequelize');
const logger = require('./logger-service');

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
					logger.debug('Invalid artifact data structure', {
						artifact,
					});
					throw ApiError.BadRequest(
						'Invalid artifact data structure',
						ERROR_CODES.ARTIFACT.INVALID_ARTIFACT_TEMPLATE
					);
				}

				// Validate description structure
				if (!artifact.description.en || !artifact.description.ru) {
					logger.debug('Missing required description translations', {
						artifact,
					});
					throw ApiError.BadRequest(
						'Description must contain both "en" and "ru" translations',
						ERROR_CODES.ARTIFACT.INVALID_ARTIFACT_TEMPLATE
					);
				}

				// Use findOrCreate to handle both creation and updates
				const [artifactInstance, created] =
					await ArtifactTemplate.findOrCreate({
						where: { slug: artifact.slug },
						defaults: artifact,
						transaction: t,
					});

				if (!created) {
					// Update existing artifact
					await artifactInstance.update(artifact, { transaction: t });
				}

				createdArtifacts.push(artifactInstance);
			}

			await t.commit();

			// Parse description JSON strings to objects for response
			const processedArtifacts = createdArtifacts.map((artifact) => {
				const artifactData = artifact.toJSON();
				if (
					artifactData.description &&
					typeof artifactData.description === 'string'
				) {
					try {
						artifactData.description = JSON.parse(
							artifactData.description
						);
					} catch (parseError) {
						console.warn(
							`Failed to parse description for created artifact ${artifactData.slug}:`,
							parseError
						);
					}
				}
				return artifactData;
			});

			return processedArtifacts;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to create artifact templates', {
				artifacts: artifacts.length,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to create artifacts: ${err.message}`,
				ERROR_CODES.ARTIFACT.INVALID_ARTIFACT_TEMPLATE
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
			logger.debug('updateArtifactTemplate on start', {
				slug: artifactData.slug,
			});

			// Find the artifact by ID
			const artifact = await ArtifactTemplate.findOne({
				where: { slug: artifactData.slug },
				transaction: t,
			});

			if (!artifact) {
				await t.rollback();
				logger.debug('Artifact template not found', {
					slug: artifactData.slug,
				});
				throw ApiError.NotFound(
					`Artifact template not found: ${artifactData.slug}`,
					ERROR_CODES.ARTIFACT.INVALID_ARTIFACT_TEMPLATE
				);
			}

			// Update artifact data
			await artifact.update(artifactData, { transaction: t });

			await t.commit();

			// Parse description JSON string to object for response
			const updatedArtifact = artifact.toJSON();
			if (
				updatedArtifact.description &&
				typeof updatedArtifact.description === 'string'
			) {
				try {
					updatedArtifact.description = JSON.parse(
						updatedArtifact.description
					);
				} catch (parseError) {
					console.warn(
						`Failed to parse description for updated artifact ${artifactData.slug}:`,
						parseError
					);
				}
			}

			return updatedArtifact;
		} catch (err) {
			await t.rollback();

			logger.error('Failed to update artifact template', {
				slug: artifactData.slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.BadRequest(
				`Failed to update artifact: ${err.message}`,
				ERROR_CODES.ARTIFACT.INVALID_ARTIFACT_TEMPLATE
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
			logger.debug('deleteArtifactTemplate on start', { slug });

			const artifact = await ArtifactTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!artifact) {
				await t.rollback();
				logger.debug('Artifact template not found for deletion', {
					slug,
				});
				throw ApiError.NotFound(
					`Artifact template not found: ${slug}`,
					ERROR_CODES.ARTIFACT.INVALID_ARTIFACT_TEMPLATE
				);
			}

			await artifact.destroy({ transaction: t });

			await t.commit();
			return { message: 'Artifact deleted successfully', slug: slug };
		} catch (err) {
			await t.rollback();

			logger.error('Failed to delete artifact template', {
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.BadRequest(
				`Failed to delete artifact: ${err.message}`,
				ERROR_CODES.ARTIFACT.INVALID_ARTIFACT_TEMPLATE
			);
		}
	}

	/**
	 * Get all artifact templates
	 * @returns {Promise<Array>} All artifacts
	 */
	async getAllArtifactTemplates() {
		try {
			logger.debug('getAllArtifactTemplates on start');
			const artifacts = await ArtifactTemplate.findAll({
				order: [
					['baseChance', 'ASC'],
					['slug', 'ASC'],
				],
			});

			// Parse description JSON strings to objects
			const processedArtifacts = artifacts.map((artifact) => {
				const artifactData = artifact.toJSON();
				if (
					artifactData.description &&
					typeof artifactData.description === 'string'
				) {
					try {
						artifactData.description = JSON.parse(
							artifactData.description
						);
					} catch (parseError) {
						console.warn(
							`Failed to parse description for artifact ${artifactData.slug}:`,
							parseError
						);
						// Keep as string if parsing fails
					}
				}
				return artifactData;
			});

			logger.debug('getAllArtifactTemplates completed successfully', {
				count: processedArtifacts.length,
			});
			return processedArtifacts;
		} catch (err) {
			logger.error('Failed to get all artifact templates', {
				error: err.message,
				stack: err.stack,
			});

			throw ApiError.Internal(
				`Failed to get artifacts: ${err.message}`,
				ERROR_CODES.ARTIFACT.INVALID_ARTIFACT_TEMPLATE
			);
		}
	}

	/**
	 * Get a specific artifact template
	 * @param {string} slug - Artifact ID
	 * @returns {Promise<Object>} Artifact
	 */
	async getArtifactTemplateBySlug(slug) {
		try {
			logger.debug('getArtifactTemplateBySlug on start', { slug });

			const artifact = await ArtifactTemplate.findOne({
				where: { slug },
			});

			if (!artifact) {
				logger.debug('Artifact template not found', { slug });
				throw ApiError.NotFound(
					`Artifact template not found: ${slug}`,
					ERROR_CODES.ARTIFACT.INVALID_ARTIFACT_TEMPLATE
				);
			}

			// Parse description JSON string to object
			const artifactData = artifact.toJSON();
			if (
				artifactData.description &&
				typeof artifactData.description === 'string'
			) {
				try {
					artifactData.description = JSON.parse(
						artifactData.description
					);
				} catch (parseError) {
					console.warn(
						`Failed to parse description for artifact ${slug}:`,
						parseError
					);
					// Keep as string if parsing fails
				}
			}

			logger.debug('getArtifactTemplateBySlug completed successfully', {
				slug,
			});
			return artifactData;
		} catch (err) {
			logger.error('Failed to get artifact template by slug', {
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get artifact: ${err.message}`,
				ERROR_CODES.ARTIFACT.INVALID_ARTIFACT_TEMPLATE
			);
		}
	}
}

module.exports = new ArtifactTemplateService();
