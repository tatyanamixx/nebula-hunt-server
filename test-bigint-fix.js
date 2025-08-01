const { sequelize } = require('./models/index.js');
const { UpgradeNodeTemplate } = require('./models/models.js');

async function testBigIntFix() {
	try {
		await sequelize.authenticate();
		console.log('Connected to database');

		// Get all templates like the API does
		const nodes = await UpgradeNodeTemplate.findAll({
			order: [['slug', 'ASC']],
		});

		console.log('Original nodes length:', nodes.length);
		console.log('First node ID type:', typeof nodes[0]?.id);
		console.log('First node ID value:', nodes[0]?.id);

		// Apply our fix
		const serializedNodes = nodes.map((node) => {
			const nodeData = node.toJSON();
			if (nodeData.id && typeof nodeData.id === 'bigint') {
				nodeData.id = Number(nodeData.id);
			}
			return nodeData;
		});

		console.log('\nAfter serialization:');
		console.log('Serialized nodes length:', serializedNodes.length);
		console.log('First node ID type:', typeof serializedNodes[0]?.id);
		console.log('First node ID value:', serializedNodes[0]?.id);

		// Test JSON serialization
		console.log('\nTesting JSON serialization:');
		try {
			const jsonString = JSON.stringify(serializedNodes);
			console.log('JSON serialization successful!');
			console.log('JSON length:', jsonString.length);
			console.log('First 200 chars:', jsonString.substring(0, 200));
		} catch (error) {
			console.error('JSON serialization failed:', error.message);
		}
	} catch (error) {
		console.error('Error testing BigInt fix:', error);
	} finally {
		await sequelize.close();
	}
}

testBigIntFix();
