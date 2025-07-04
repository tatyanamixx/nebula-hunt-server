const artifactService = require('../service/artifact-service');

class ArtifactController {
	async addArtifactToUser(req, res) {
		try {
			const {
				userId,
				seed,
				name,
				description,
				rarity,
				image,
				effects,
				tradable,
			} = req.body;
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
			const { userId } = req.params;
			const artifacts = await artifactService.getUserArtifacts(userId);
			res.json(artifacts);
		} catch (e) {
			res.status(500).json({ error: e.message });
		}
	}
}

module.exports = new ArtifactController();
