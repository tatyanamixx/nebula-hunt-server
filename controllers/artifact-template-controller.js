/**
 * created by Tatyana Mikhniukevich on 09.06.2025
 * updated by Claude on 15.07.2025
 */
const artifactTemplateService = require('../service/artifact-template-service');
const ApiError = require('../exceptions/api-error');

class ArtifactTemplateController {
	/**
	 * Create a new task template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async createArtifactTemplates(req, res, next) {
		try {
			const artifactData = req.body;
			if (!artifactData) {
				return next(
					ApiError.BadRequest(
						'Invalid request: artifact data required'
					)
				);
			}

			const result =
				await artifactTemplateService.createArtifactTemplates(
					artifactData
				);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * Get all artifact templates
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async getAllArtifactTemplates(req, res, next) {
		try {
			const artifacts =
				await artifactTemplateService.getAllArtifactTemplates();
			return res.json(artifacts);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * Get artifact template by ID
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async getArtifactTemplateBySlug(req, res, next) {
		try {
			const { slug } = req.params;
			const artifact =
				await artifactTemplateService.getArtifactTemplateBySlug(slug);
			return res.json(artifact);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * Update artifact template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async updateArtifactTemplate(req, res, next) {
		try {
			const { slug } = req.params;
			const artifactData = req.body;

			// Ensure slug is included in the data
			artifactData.slug = slug;

			const result = await artifactTemplateService.updateArtifactTemplate(
				artifactData
			);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}

	/**
	 * Delete artifact template
	 * @param {Object} req - Request object
	 * @param {Object} res - Response object
	 * @param {Function} next - Next middleware function
	 */
	async deleteArtifactTemplate(req, res, next) {
		try {
			const { slug } = req.params;

			const result = await artifactTemplateService.deleteArtifactTemplate(
				slug
			);
			return res.json(result);
		} catch (err) {
			next(err);
		}
	}
}

module.exports = new ArtifactTemplateController();
