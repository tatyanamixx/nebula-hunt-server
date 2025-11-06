/**
 * Script to check upgrades data in database
 * Run: docker exec -it nebulahunt-api node check-upgrades-db.js
 */
const { sequelize } = require("./models");
const { UserUpgrade, UpgradeNodeTemplate, User } = require("./models");

(async () => {
	try {
		await sequelize.authenticate();
		console.log("✅ Connected to database\n");

		// Get a test user
		const testUser = await User.findOne({ limit: 1 });
		if (!testUser) {
			console.log("❌ No users found in database");
			await sequelize.close();
			return;
		}

		const userId = testUser.id;
		console.log(`📋 Using test user: ${userId}\n`);

		// Get user upgrades
		const userUpgrades = await UserUpgrade.findAll({
			where: { userId },
			limit: 5,
		});
		console.log(`📦 UserUpgrades count: ${userUpgrades.length}`);
		userUpgrades.forEach((u, i) => {
			console.log(
				`  ${i + 1}. id: ${u.id}, upgradeTemplateSlug: ${u.upgradeTemplateSlug}`
			);
		});

		// Get templates
		const templates = await UpgradeNodeTemplate.findAll({ limit: 5 });
		console.log(`\n📋 Templates count: ${templates.length}`);
		templates.forEach((t, i) => {
			console.log(`  ${i + 1}. id: ${t.id}, slug: ${t.slug}`);
		});

		// Check relationship with include
		if (userUpgrades.length > 0) {
			console.log("\n🔍 Checking relationship with include:");
			const firstUpgrade = userUpgrades[0];
			console.log(
				`  UserUpgrade.upgradeTemplateSlug: ${firstUpgrade.upgradeTemplateSlug}`
			);

			// Check if template exists
			const matchingTemplate = await UpgradeNodeTemplate.findOne({
				where: { slug: firstUpgrade.upgradeTemplateSlug },
			});
			console.log(
				`  Matching template: ${matchingTemplate ? matchingTemplate.slug : "NOT FOUND"}`
			);

			// Check with include
			const userUpgradeWithInclude = await UserUpgrade.findOne({
				where: { id: firstUpgrade.id },
				include: [
					{
						model: UpgradeNodeTemplate,
						required: false,
					},
				],
			});

			console.log(
				`  Has UpgradeNodeTemplate: ${!!userUpgradeWithInclude?.UpgradeNodeTemplate}`
			);
			console.log(
				`  Has upgradenodetemplate: ${!!userUpgradeWithInclude?.upgradeNodeTemplate}`
			);

			if (userUpgradeWithInclude?.UpgradeNodeTemplate) {
				console.log(
					`  Template slug: ${userUpgradeWithInclude.UpgradeNodeTemplate.slug}`
				);
			} else if (userUpgradeWithInclude?.upgradeNodeTemplate) {
				console.log(
					`  Template slug: ${userUpgradeWithInclude.upgradeNodeTemplate.slug}`
				);
			} else {
				console.log("  ⚠️ Template not found via include!");
			}
		}

		await sequelize.close();
		console.log("\n✅ Done");
	} catch (error) {
		console.error("❌ Error:", error.message);
		console.error(error.stack);
		process.exit(1);
	}
})();

