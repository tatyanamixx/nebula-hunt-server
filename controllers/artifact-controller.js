/**
 * created by Tatyana Mikhniukevich on 04.07.2025
 */
const artifactService = require('../service/artifact-service');

class ArtifactController {
	async addArtifactToUser(req, res) {
		try {
			const {
				seed,
				name,
				description,
				rarity,
				image,
				effects,
				tradable,
			} = req.body;
			const userId = req.initdata.id;
			const artifact = await artifactService.addArtifactToUser({
				userId,
				seed,
				name,
				description,
				rarity,
				image,
				effects,
				tradable,
			});
			res.json(artifact);
		} catch (e) {
			res.status(400).json({ error: e.message });
		}
	}

	async getUserArtifacts(req, res) {
		try {
			const userId = req.initdata.id;
			const artifacts = await artifactService.getUserArtifacts(userId);
			res.json(artifacts);
		} catch (e) {
			res.status(500).json({ error: e.message });
		}
	}

	async getArtifact(req, res) {
		try {
			const { artifactId } = req.params;
			const userId = req.initdata.id;

			// This method needs to be implemented in the service
			const artifact = await artifactService.getArtifactById(
				artifactId,
				userId
			);

			if (!artifact) {
				return res.status(404).json({ error: 'Artifact not found' });
			}

			res.json(artifact);
		} catch (e) {
			res.status(500).json({ error: e.message });
		}
	}

	async generateArtifact(req, res) {
		try {
			const userId = req.initdata.id;

			// This method needs to be implemented in the service
			const artifact = await artifactService.generateRandomArtifact(
				userId
			);

			res.status(201).json(artifact);
		} catch (e) {
			res.status(400).json({ error: e.message });
		}
	}

	async activateArtifact(req, res) {
		try {
			const { artifactId } = req.params;
			const userId = req.initdata.id;

			// This method needs to be implemented in the service
			const result = await artifactService.activateArtifact(
				artifactId,
				userId
			);

			res.json(result);
		} catch (e) {
			res.status(400).json({ error: e.message });
		}
	}

	async deactivateArtifact(req, res) {
		try {
			const { artifactId } = req.params;
			const userId = req.initdata.id;

			// This method needs to be implemented in the service
			const result = await artifactService.deactivateArtifact(
				artifactId,
				userId
			);

			res.json(result);
		} catch (e) {
			res.status(400).json({ error: e.message });
		}
	}

	async createSystemArtifactWithOffer(req, res) {
		try {
			const buyerId = req.initdata.id;
			const { artifactData, offerData } = req.body;

			// Валидация данных
			if (!artifactData || !offerData) {
				return res.status(400).json({
					error: 'Missing required data: artifactData and offerData',
				});
			}

			if (
				!artifactData.seed ||
				!artifactData.name ||
				!artifactData.rarity
			) {
				return res.status(400).json({
					error: 'Invalid artifact data: seed, name and rarity are required',
				});
			}

			if (!offerData.price || !offerData.currency) {
				return res.status(400).json({
					error: 'Invalid offer data: price and currency are required',
				});
			}

			const result = await artifactService.createSystemArtifactWithOffer(
				artifactData,
				buyerId,
				offerData
			);

			res.json(result);
		} catch (e) {
			res.status(400).json({ error: e.message });
		}
	}
}

module.exports = new ArtifactController();
