/**
 * created by Claude on 15.07.2025
 */
const { UpgradeNodeTemplate, UserUpgrade, UserState } = require("../models/models");
const ApiError = require("../exceptions/api-error");
const sequelize = require("../db");
const { Op } = require("sequelize");
const logger = require("./logger-service");
class UpgradeService {
	/**
	 * Initialize the upgrade tree for a new user
	 * @param {number} userId - User ID
	 * @param {Object} t - Transaction
	 * @returns {Promise<Array>} Initialized user upgrades
	 */
	async initializeUserUpgradeTree(userId, t) {
		const transaction = t || (await sequelize.transaction());
		const shouldCommit = !transaction; // Коммитим только если транзакция не была передана
		try {
			const userUpgrades = [];
			logger.debug("initializeUserUpgradeTree", userId);
			// Get all root upgrade nodes (those without parent requirements)
			const rootNodes = await UpgradeNodeTemplate.findAll({
				where: {
					active: true,
					// [Op.or]: [
					// 	{ '$conditions.parents$': null },
					// 	{ '$conditions.parents$': [] },
					// 	{ $conditions$: {} },
					// ],
				},
				transaction: transaction,
			});
			logger.debug("rootNodes", rootNodes);
			// Create initial user upgrades for root nodes
			if (rootNodes.length > 0) {
				for (const node of rootNodes) {
					const userUpgrade = await UserUpgrade.create(
						{
							userId,
							upgradeTemplateSlug: node.slug,
							level: 0,
							progress: 0,
							targetProgress: 100,
							completed: false,
							stability: node.stability || 0,
							instability: node.instability || 0,
							progressHistory: [
								{
									timestamp: Date.now(),
									progress: 0,
									level: 0,
								},
							],
							lastProgressUpdate: new Date(),
						},
						{ transaction: transaction }
					);
					userUpgrades.push(userUpgrade);
				}
			}

			if (shouldCommit && !transaction.finished) {
				await transaction.commit();
			}
			return userUpgrades;
		} catch (err) {
			if (shouldCommit && !transaction.finished) {
				await transaction.rollback();
			}
			throw ApiError.Internal(
				`Failed to initialize user upgrade tree: ${err.message}`
			);
		}
	}

	/**
	 * Activate available upgrade nodes for a user
	 * @param {number} userId - User ID
	 * @param {Object} t - Transaction
	 * @returns {Promise<Array>} Newly activated user upgrades
	 */
	async activateUserUpgradeNodes(userId, t) {
		try {
			// Get all user upgrades
			const userUpgrades = await UserUpgrade.findAll({
				where: { userId },
				transaction: t,
			});

			// Create a map of user upgrades for quick lookup
			const userUpgradeMap = {};
			userUpgrades.forEach((upgrade) => {
				userUpgradeMap[upgrade.upgradeTemplateSlug] = upgrade;
			});

			// Get all active upgrade nodes
			const upgradeNodes = await UpgradeNodeTemplate.findAll({
				where: { active: true },
				transaction: t,
			});

			// Find nodes that should be activated
			const nodesToActivate = [];
			for (const node of upgradeNodes) {
				// Skip if user already has this node
				if (userUpgradeMap[node.slug]) {
					continue;
				}

				// Check if the node has parent requirements
				if (
					node.conditions &&
					node.conditions.parents &&
					Array.isArray(node.conditions.parents)
				) {
					let allParentsCompleted = true;
					// Check if all parent upgrades are completed
					for (const parentId of node.conditions.parents) {
						const parentUpgrade = userUpgradeMap[parentId];
						if (
							!parentUpgrade ||
							!parentUpgrade.completed ||
							(node.conditions.parentLevel &&
								parentUpgrade.level < node.conditions.parentLevel)
						) {
							allParentsCompleted = false;
							break;
						}
					}

					if (allParentsCompleted) {
						nodesToActivate.push(node);
					}
				}
			}

			// Create user upgrades for nodes to activate
			const newUserUpgrades = [];
			for (const node of nodesToActivate) {
				const userUpgrade = await UserUpgrade.create(
					{
						userId,
						upgradeTemplateSlug: node.slug,
						level: 0,
						progress: 0,
						targetProgress: 100,
						completed: false,
						stability: node.stability || 0,
						instability: node.instability || 0,
						progressHistory: [
							{
								timestamp: Date.now(),
								progress: 0,
								level: 0,
							},
						],
						lastProgressUpdate: new Date(),
					},
					{ transaction: t }
				);
				newUserUpgrades.push(userUpgrade);
			}

			return newUserUpgrades;
		} catch (err) {
			throw ApiError.Internal(
				`Failed to activate user upgrade nodes: ${err.message}`
			);
		}
	}

	/**
	 * Get all upgrades for a user
	 * @param {number} userId - User ID
	 * @returns {Promise<Array>} User upgrades
	 */
	async getUserUpgrades(userId) {
		try {
			let userUpgrades = await UserUpgrade.findAll({
				where: { userId },
				include: [
					{
						model: UpgradeNodeTemplate,
						where: { active: true },
						attributes: [
							"id",
							"slug",
							"name",
							"description",
							"maxLevel",
							"basePrice",
							"effectPerLevel",
							"priceMultiplier",
							"currency",
							"category",
							"icon",
							"stability",
							"instability",
							"modifiers",
							"active",
							"conditions",
							"children",
							"weight",
						],
					},
				],
			});

			// Получаем все активные шаблоны улучшений
			const allTemplates = await UpgradeNodeTemplate.findAll({
				where: { active: true },
				attributes: ["slug"],
			});

			// Создаем Set из существующих slugs пользователя
			const existingSlugs = new Set(
				userUpgrades
					.map((u) => u.upgradeTemplateSlug)
					.filter((slug) => slug !== null)
			);

			// Находим шаблоны, которых нет у пользователя
			const missingSlugs = allTemplates
				.map((t) => t.slug)
				.filter((slug) => !existingSlugs.has(slug));

			// Если есть отсутствующие улучшения, создаем их
			if (missingSlugs.length > 0) {
				logger.debug("Creating missing upgrades for user", {
					userId,
					missingCount: missingSlugs.length,
					missingSlugs,
				});

				const transaction = await sequelize.transaction();
				try {
					// Создаем записи для отсутствующих улучшений
					const newUpgrades = missingSlugs.map((slug) => ({
						userId,
						upgradeTemplateSlug: slug,
						level: 0,
						progress: 0,
						targetProgress: 100,
						completed: false,
						stability: 0,
						instability: 0,
					}));

					await UserUpgrade.bulkCreate(newUpgrades, { transaction });

					// Обновляем playerParameters в userState
					const userState = await UserState.findOne({
						where: { userId },
						transaction,
					});

					if (userState) {
						const playerParams = {
							...(userState.playerParameters || {}),
						};

						// Добавляем новые slugs с level 0
						for (const slug of missingSlugs) {
							if (!(slug in playerParams)) {
								playerParams[slug] = 0;
							}
						}

						userState.playerParameters = playerParams;
						userState.changed("playerParameters", true);
						await userState.save({ transaction });

						logger.debug("Added new upgrades to playerParameters", {
							userId,
							newSlugs: missingSlugs,
							playerParameters: userState.playerParameters,
						});
					}

					await transaction.commit();

					// Перезагружаем улучшения после создания
					userUpgrades = await UserUpgrade.findAll({
						where: { userId },
						include: [
							{
								model: UpgradeNodeTemplate,
								where: { active: true },
								attributes: [
									"id",
									"slug",
									"name",
									"description",
									"maxLevel",
									"basePrice",
									"effectPerLevel",
									"priceMultiplier",
									"currency",
									"category",
									"icon",
									"stability",
									"instability",
									"modifiers",
									"active",
									"conditions",
									"children",
									"weight",
								],
							},
						],
					});
					logger.debug("Upgrades initialized successfully", {
						userId,
						count: userUpgrades.length,
					});
				} catch (error) {
					await transaction.rollback();
					throw error;
				}
			}

			// Синхронизируем playerParameters с реальными уровнями улучшений
			const userState = await UserState.findOne({ where: { userId } });
			if (userState && userUpgrades.length > 0) {
				const playerParams = { ...(userState.playerParameters || {}) };
				let needsUpdate = false;

				for (const upgrade of userUpgrades) {
					const slug = upgrade.upgradeTemplateSlug;
					const currentLevel = upgrade.level || 0;

					// Проверяем если level в playerParameters не совпадает с реальным
					if (playerParams[slug] !== currentLevel) {
						playerParams[slug] = currentLevel;
						needsUpdate = true;
					}
				}

				if (needsUpdate) {
					userState.playerParameters = playerParams;
					userState.changed("playerParameters", true);
					await userState.save();
					logger.debug("Synced playerParameters with upgrade levels", {
						userId,
						playerParameters: userState.playerParameters,
					});
				}
			}

			return userUpgrades;
		} catch (err) {
			throw ApiError.Internal(`Failed to get user upgrades: ${err.message}`);
		}
	}

	/**
	 * Get a specific upgrade for a user
	 * @param {number} userId - User ID
	 * @param {string} slug - Upgrade node ID
	 * @returns {Promise<Object>} User upgrade
	 */
	async getUserUpgrade(userId, slug) {
		try {
			const upgradeNode = await UpgradeNodeTemplate.findOne({
				where: { slug, active: true },
			});
			if (!upgradeNode) {
				throw ApiError.NotFound("Upgrade node not found");
			}
			const userUpgrade = await UserUpgrade.findOne({
				where: {
					userId,
					upgradeTemplateSlug: upgradeNode.slug,
				},
				include: [
					{
						model: UpgradeNodeTemplate,
						where: { active: true },
						attributes: [
							"id",
							"slug",
							"name",
							"description",
							"maxLevel",
							"basePrice",
							"effectPerLevel",
							"priceMultiplier",
							"category",
							"icon",
							"stability",
							"instability",
							"modifiers",
							"active",
							"conditions",
							"children",
							"weight",
						],
					},
				],
			});

			if (!userUpgrade) {
				throw ApiError.NotFound("User upgrade not found");
			}

			return userUpgrade;
		} catch (err) {
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(`Failed to get user upgrade: ${err.message}`);
		}
	}

	/**
	 * Get all upgrades for a user (existing, new, and available)
	 * This method initializes and activates upgrades as needed
	 * @param {number} userId - User ID
	 * @returns {Promise<Array>} All user upgrades with template data
	 */
	async getAvailableUpgrades(userId) {
		const transaction = await sequelize.transaction();
		try {
			logger.debug("getAvailableUpgrades: starting for user", { userId });

			// Check if user has any upgrades
			const existingUpgrades = await UserUpgrade.findAll({
				where: { userId },
				transaction,
			});

			logger.debug("getAvailableUpgrades: existing upgrades count", {
				userId,
				count: existingUpgrades.length,
			});

			// If user has no upgrades, initialize the upgrade tree
			if (existingUpgrades.length === 0) {
				logger.debug(
					"getAvailableUpgrades: no existing upgrades, initializing tree",
					{ userId }
				);
				await this.initializeUserUpgradeTree(userId, transaction);
			}

			// Activate any new upgrade nodes that should be available
			logger.debug("getAvailableUpgrades: activating new nodes", {
				userId,
			});
			await this.activateUserUpgradeNodes(userId, transaction);

			// Get all user upgrades
			const userUpgrades = await UserUpgrade.findAll({
				where: { userId },
				transaction,
			});

			// Manually load templates for each upgrade (include with targetKey doesn't work reliably)
			// ✅ Фильтруем только активные шаблоны
			const upgradeTemplateSlugs = userUpgrades
				.map((u) => u.upgradeTemplateSlug)
				.filter(Boolean);
			const templates = await UpgradeNodeTemplate.findAll({
				where: {
					slug: upgradeTemplateSlugs,
					active: true, // ✅ Только активные шаблоны
				},
				attributes: [
					"id",
					"slug",
					"name",
					"description",
					"maxLevel",
					"basePrice",
					"effectPerLevel",
					"priceMultiplier",
					"category",
					"icon",
					"stability",
					"instability",
					"modifiers",
					"active",
					"conditions",
					"children",
					"weight",
					"currency",
				],
				transaction,
			});

			// Create a map of templates by slug
			const templateMap = {};
			templates.forEach((template) => {
				templateMap[template.slug] = template;
			});

			// Attach templates to user upgrades
			// ✅ Фильтруем только улучшения с активными шаблонами
			userUpgrades.forEach((userUpgrade) => {
				const template = templateMap[userUpgrade.upgradeTemplateSlug];
				if (template && template.active === true) {
					userUpgrade.UpgradeNodeTemplate = template;
					userUpgrade.upgradeNodeTemplate = template;
				}
			});

			// ✅ Отфильтровываем улучшения без активных шаблонов
			const activeUserUpgrades = userUpgrades.filter((upgrade) => {
				return upgrade.UpgradeNodeTemplate || upgrade.upgradeNodeTemplate;
			});

			console.log("🔍 [UPGRADE-SERVICE] userUpgrades after findAll:");
			console.log("  userId:", userId);
			console.log("  count:", userUpgrades.length);
			if (userUpgrades.length > 0) {
				console.log("  firstUpgrade.id:", userUpgrades[0].id);
				console.log(
					"  firstUpgrade.upgradeTemplateSlug:",
					userUpgrades[0].upgradeTemplateSlug
				);
				console.log(
					"  firstUpgrade.hasUpgradeNodeTemplate:",
					!!userUpgrades[0].UpgradeNodeTemplate
				);
				console.log(
					"  firstUpgrade.hasUpgradeNodeTemplateLower:",
					!!userUpgrades[0].upgradeNodeTemplate
				);
				console.log("  firstUpgrade.allKeys:", Object.keys(userUpgrades[0]));
				if (userUpgrades[0].UpgradeNodeTemplate) {
					console.log(
						"  firstUpgrade.UpgradeNodeTemplate.slug:",
						userUpgrades[0].UpgradeNodeTemplate.slug
					);
				}
				if (userUpgrades[0].upgradeNodeTemplate) {
					console.log(
						"  firstUpgrade.upgradeNodeTemplate.slug:",
						userUpgrades[0].upgradeNodeTemplate.slug
					);
				}
			} else {
				console.log("  ⚠️ No userUpgrades found!");
			}
			logger.debug("getAvailableUpgrades: userUpgrades with include", {
				userId,
				count: userUpgrades.length,
				firstUpgrade: userUpgrades[0]
					? {
							id: userUpgrades[0].id,
							upgradeTemplateSlug: userUpgrades[0].upgradeTemplateSlug,
							hasTemplate: !!(
								userUpgrades[0].UpgradeNodeTemplate ||
								userUpgrades[0].upgradeNodeTemplate
							),
							templateSlug:
								userUpgrades[0].UpgradeNodeTemplate?.slug ||
								userUpgrades[0].upgradeNodeTemplate?.slug,
					  }
					: null,
			});

			// Get all active upgrade nodes to check for available upgrades
			const allActiveNodes = await UpgradeNodeTemplate.findAll({
				where: { active: true },
				transaction,
			});

			console.log("🔍 [UPGRADE-SERVICE] active nodes count:");
			console.log("  userId:", userId);
			console.log("  count:", allActiveNodes.length);
			if (allActiveNodes.length > 0) {
				console.log("  firstNode.id:", allActiveNodes[0].id);
				console.log("  firstNode.slug:", allActiveNodes[0].slug);
			} else {
				console.log("  ⚠️ No active nodes found!");
			}
			logger.debug("getAvailableUpgrades: active nodes count", {
				userId,
				count: allActiveNodes.length,
			});

			logger.debug("getAvailableUpgrades: user upgrades with templates", {
				userId,
				count: activeUserUpgrades.length,
				upgradesWithTemplates: activeUserUpgrades.filter(
					(u) => u.UpgradeNodeTemplate || u.upgradeNodeTemplate
				).length,
				upgradeTemplateSlugs: activeUserUpgrades.map(
					(u) => u.upgradeTemplateSlug
				),
				firstUpgradeDetails: activeUserUpgrades[0]
					? {
							id: activeUserUpgrades[0].id,
							upgradeTemplateSlug:
								activeUserUpgrades[0].upgradeTemplateSlug,
							hasUpgradeNodeTemplate:
								!!activeUserUpgrades[0].UpgradeNodeTemplate,
							hasUpgradeNodeTemplateLower:
								!!activeUserUpgrades[0].upgradeNodeTemplate,
							templateSlug:
								activeUserUpgrades[0].UpgradeNodeTemplate?.slug ||
								activeUserUpgrades[0].upgradeNodeTemplate?.slug,
					  }
					: null,
			});

			// Create a map of user upgrades for quick lookup (только активные)
			const userUpgradeMap = {};
			activeUserUpgrades.forEach((upgrade) => {
				userUpgradeMap[upgrade.upgradeTemplateSlug] = upgrade;
			});

			// Filter upgrade nodes based on availability
			const availableUpgrades = allActiveNodes.filter((node) => {
				// If the user already has this upgrade, it's available
				if (userUpgradeMap[node.slug]) {
					return true;
				}

				// Check if the upgrade has any conditions
				if (node.conditions && Object.keys(node.conditions).length > 0) {
					// Check if the upgrade requires parent upgrades
					if (
						node.conditions.parents &&
						Array.isArray(node.conditions.parents)
					) {
						// Check if all parent upgrades are completed
						for (const parentId of node.conditions.parents) {
							const parentUpgrade = userUpgradeMap[parentId];
							if (
								!parentUpgrade ||
								!parentUpgrade.completed ||
								parentUpgrade.level <
									(node.conditions.parentLevel || 1)
							) {
								return false;
							}
						}
					}
				}

				// If no conditions or all conditions are met, the upgrade is available
				return true;
			});

			// Combine existing user upgrades with available upgrades that don't exist yet
			const result = [];

			// Add existing user upgrades (только с активными шаблонами)
			console.log(
				"🔄 [UPGRADE-SERVICE] Processing activeUserUpgrades, count:",
				activeUserUpgrades.length
			);
			activeUserUpgrades.forEach((userUpgrade, index) => {
				const template =
					userUpgrade.UpgradeNodeTemplate ||
					userUpgrade.upgradeNodeTemplate;

				console.log(`  Processing upgrade ${index}:`);
				console.log("    id:", userUpgrade.id);
				console.log(
					"    upgradeTemplateSlug:",
					userUpgrade.upgradeTemplateSlug
				);
				console.log(
					"    hasUpgradeNodeTemplate:",
					!!userUpgrade.UpgradeNodeTemplate
				);
				console.log(
					"    hasUpgradeNodeTemplateLower:",
					!!userUpgrade.upgradeNodeTemplate
				);
				console.log("    hasTemplate:", !!template);

				logger.debug(
					`getAvailableUpgrades: processing userUpgrade ${index}`,
					{
						userId,
						upgradeId: userUpgrade.id,
						upgradeTemplateSlug: userUpgrade.upgradeTemplateSlug,
						hasUpgradeNodeTemplate: !!userUpgrade.UpgradeNodeTemplate,
						hasUpgradeNodeTemplateLower:
							!!userUpgrade.upgradeNodeTemplate,
						hasTemplate: !!template,
						templateSlug: template?.slug || template?.dataValues?.slug,
						allKeys: Object.keys(userUpgrade),
					}
				);

				if (template) {
					console.log(`    ✅ Template found, adding to result`);
					// Return structure expected by client: { UpgradeNodeTemplate: {...}, level: ..., ... }
					result.push({
						id: userUpgrade.id,
						level: userUpgrade.level,
						progress: userUpgrade.progress,
						targetProgress: userUpgrade.targetProgress,
						completed: userUpgrade.completed,
						stability: userUpgrade.stability,
						instability: userUpgrade.instability,
						progressHistory: userUpgrade.progressHistory,
						lastProgressUpdate: userUpgrade.lastProgressUpdate,
						upgradeTemplateSlug: userUpgrade.upgradeTemplateSlug,
						UpgradeNodeTemplate: template.toJSON(),
						upgradenodetemplate: template.toJSON(), // Also include lowercase for compatibility
					});
					logger.debug(
						`getAvailableUpgrades: added upgrade ${index} to result`,
						{
							userId,
							upgradeId: userUpgrade.id,
							templateSlug: template.slug || template.dataValues?.slug,
						}
					);
				} else {
					console.log(
						`    ⚠️ Template NOT found, skipping upgrade ${index}`
					);
					logger.warn(
						`getAvailableUpgrades: template not found for upgrade ${index}`,
						{
							userId,
							upgradeId: userUpgrade.id,
							upgradeTemplateSlug: userUpgrade.upgradeTemplateSlug,
							hasUpgradeNodeTemplate:
								!!userUpgrade.UpgradeNodeTemplate,
							hasUpgradeNodeTemplateLower:
								!!userUpgrade.upgradeNodeTemplate,
						}
					);
				}
			});

			// Add available upgrades that don't exist yet
			console.log(
				"🔄 [UPGRADE-SERVICE] Processing availableUpgrades, count:",
				availableUpgrades.length
			);
			availableUpgrades.forEach((node) => {
				if (!userUpgradeMap[node.slug]) {
					console.log(`  Adding new upgrade: ${node.slug}`);
					// Return structure expected by client for new upgrades
					result.push({
						id: null,
						level: 0,
						progress: 0,
						targetProgress: 100,
						completed: false,
						stability: node.stability || 0,
						instability: node.instability || 0,
						progressHistory: [],
						lastProgressUpdate: null,
						upgradeTemplateSlug: node.slug,
						UpgradeNodeTemplate: node.toJSON(),
						upgradenodetemplate: node.toJSON(), // Also include lowercase for compatibility
					});
				}
			});

			await transaction.commit();
			console.log("✅ [UPGRADE-SERVICE] getAvailableUpgrades completed:");
			console.log("  userId:", userId);
			console.log("  totalUpgrades (result.length):", result.length);
			console.log(
				"  existingUpgrades (userUpgrades.length):",
				userUpgrades.length
			);
			console.log(
				"  availableUpgrades (allActiveNodes.length):",
				availableUpgrades.length
			);
			const upgradesWithTemplates = userUpgrades.filter(
				(u) => u.UpgradeNodeTemplate || u.upgradeNodeTemplate
			).length;
			console.log("  upgradesWithTemplates:", upgradesWithTemplates);
			console.log(
				"  upgradesWithoutTemplates:",
				userUpgrades.length - upgradesWithTemplates
			);
			if (result.length > 0) {
				console.log("  result[0].id:", result[0].id);
				console.log(
					"  result[0].upgradeTemplateSlug:",
					result[0].upgradeTemplateSlug
				);
				console.log(
					"  result[0].hasUpgradeNodeTemplate:",
					!!(
						result[0].UpgradeNodeTemplate ||
						result[0].upgradenodetemplate
					)
				);
				console.log("  result[0].keys:", Object.keys(result[0]));
			} else {
				console.log("  ⚠️ Result is empty!");
				console.log("  Why? Let's check:");
				console.log("    - userUpgrades.length:", userUpgrades.length);
				console.log(
					"    - availableUpgrades.length:",
					availableUpgrades.length
				);
				console.log("    - upgradesWithTemplates:", upgradesWithTemplates);
				console.log(
					"    - upgradesWithoutTemplates:",
					userUpgrades.length - upgradesWithTemplates
				);
				if (userUpgrades.length > 0) {
					console.log(
						"    - First userUpgrade keys:",
						Object.keys(userUpgrades[0])
					);
					console.log(
						"    - First userUpgrade.upgradeTemplateSlug:",
						userUpgrades[0].upgradeTemplateSlug
					);
					console.log(
						"    - First userUpgrade.hasUpgradeNodeTemplate:",
						!!userUpgrades[0].UpgradeNodeTemplate
					);
					console.log(
						"    - First userUpgrade.hasUpgradeNodeTemplateLower:",
						!!userUpgrades[0].upgradeNodeTemplate
					);
				}
				if (availableUpgrades.length > 0) {
					console.log(
						"    - First availableUpgrade.slug:",
						availableUpgrades[0].slug
					);
					console.log(
						"    - First availableUpgrade in userUpgradeMap:",
						!!userUpgradeMap[availableUpgrades[0].slug]
					);
				}
			}
			logger.debug("getAvailableUpgrades: completed successfully", {
				userId,
				totalUpgrades: result.length,
				existingUpgrades: userUpgrades.length,
				availableUpgrades: availableUpgrades.length,
				resultFirstItem: result[0]
					? {
							id: result[0].id,
							upgradeTemplateSlug: result[0].upgradeTemplateSlug,
							hasUpgradeNodeTemplate: !!(
								result[0].UpgradeNodeTemplate ||
								result[0].upgradenodetemplate
							),
							templateSlug:
								result[0].UpgradeNodeTemplate?.slug ||
								result[0].upgradenodetemplate?.slug,
							keys: Object.keys(result[0]),
					  }
					: null,
			});

			return result;
		} catch (err) {
			await transaction.rollback();
			logger.error("getAvailableUpgrades: failed", {
				userId,
				error: err.message,
			});
			throw ApiError.Internal(
				`Failed to get available upgrades: ${err.message}`
			);
		}
	}

	/**
	 * Purchase an upgrade for a user
	 * @param {number} userId - User ID
	 * @param {string} slug - Upgrade node ID
	 * @returns {Promise<Object>} Updated user upgrade
	 */
	async purchaseUpgrade(userId, slug) {
		const t = await sequelize.transaction();

		try {
			// Get the upgrade node
			const upgradeNode = await UpgradeNodeTemplate.findOne({
				where: { slug, active: true },
				transaction: t,
			});

			if (!upgradeNode) {
				await t.rollback();
				throw ApiError.NotFound("Upgrade not found or not active");
			}

			// Check if the user already has this upgrade
			let userUpgrade = await UserUpgrade.findOne({
				where: {
					userId,
					upgradeTemplateSlug: upgradeNode.slug,
				},
				transaction: t,
			});

			// Get user state for resource check
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (!userState) {
				await t.rollback();
				throw ApiError.NotFound("User state not found");
			}

			// Calculate the price based on the current level
			const currentLevel = userUpgrade ? userUpgrade.level : 0;

			// Check if the upgrade is already at max level
			if (currentLevel >= upgradeNode.maxLevel) {
				await t.rollback();
				throw ApiError.BadRequest("Upgrade already at max level");
			}

			const price = this.calculateUpgradePrice(
				upgradeNode.basePrice,
				currentLevel,
				upgradeNode.priceMultiplier
			);

			// Check if the user has enough resources
			// В модели поле называется currency, а не resource
			const currency = upgradeNode.currency;

			// Преобразуем "darkmatter" из модели в "darkMatter" для UserState
			const resourceField =
				currency === "darkmatter" ? "darkMatter" : currency;

			// Handle BigInt resources (stardust, darkMatter, stars, tgStars)
			const isBigIntResource = [
				"stardust",
				"darkMatter",
				"stars",
				"tgStars",
			].includes(resourceField);

			if (isBigIntResource) {
				// Check with BigInt comparison
				if (BigInt(userState[resourceField]) < BigInt(price)) {
					await t.rollback();
					throw ApiError.BadRequest(
						`Not enough ${resourceField} to purchase upgrade`
					);
				}

				// Deduct the resources using BigInt
				const newResourceValue =
					BigInt(userState[resourceField]) - BigInt(price);
				await userState.update(
					{
						[resourceField]: newResourceValue,
					},
					{ transaction: t }
				);
				// Сохраняем изменения в базу данных
				await userState.save({ transaction: t });
			} else {
				// Handle non-BigInt resources (tonToken, etc.)
				if (userState[resourceField] < price) {
					await t.rollback();
					throw ApiError.BadRequest(
						`Not enough ${resourceField} to purchase upgrade`
					);
				}

				// Deduct the resources
				const newResourceValue =
					parseFloat(userState[resourceField]) - parseFloat(price);
				await userState.update(
					{
						[resourceField]: newResourceValue,
					},
					{ transaction: t }
				);
				// Сохраняем изменения в базу данных
				await userState.save({ transaction: t });
			}

			// Reload userState to get updated values
			await userState.reload({ transaction: t });

			// Create or update the user upgrade
			if (!userUpgrade) {
				userUpgrade = await UserUpgrade.create(
					{
						userId,
						upgradeTemplateSlug: upgradeNode.slug,
						level: 1,
						progress: 0,
						targetProgress: 100,
						completed: false,
						stability: upgradeNode.stability || 0,
						instability: upgradeNode.instability || 0,
						progressHistory: [
							{
								timestamp: Date.now(),
								progress: 0,
								level: 1,
							},
						],
						lastProgressUpdate: new Date(),
					},
					{ transaction: t }
				);
			} else {
				// Increment the level
				userUpgrade.level += 1;

				// Reset progress if not at max level
				if (userUpgrade.level < upgradeNode.maxLevel) {
					userUpgrade.progress = 0;
					userUpgrade.completed = false;
				} else {
					userUpgrade.progress = userUpgrade.targetProgress;
					userUpgrade.completed = true;
				}

				// Update progress history
				userUpgrade.progressHistory = [
					...(userUpgrade.progressHistory || []),
					{
						timestamp: Date.now(),
						progress: userUpgrade.progress,
						level: userUpgrade.level,
					},
				];

				userUpgrade.lastProgressUpdate = new Date();

				await userUpgrade.save({ transaction: t });
			}

			// Update playerParameters with the new upgrade level
			// Важно: создаем новый объект для JSONB поля
			const playerParams = { ...(userState.playerParameters || {}) };
			playerParams[upgradeNode.slug] = userUpgrade.level;
			userState.playerParameters = playerParams;
			userState.changed("playerParameters", true); // Помечаем как измененное
			await userState.save({ transaction: t });

			logger.debug("Updated playerParameters", {
				userId,
				slug: upgradeNode.slug,
				newLevel: userUpgrade.level,
				playerParameters: userState.playerParameters,
			});

			// Unlock child upgrades if this upgrade is completed
			if (
				userUpgrade.completed &&
				upgradeNode.children &&
				upgradeNode.children.length > 0
			) {
				// This could involve marking child upgrades as available
				// or creating entries for them in the user_upgrades table
				// Implementation depends on how availability is tracked
			}

			await t.commit();

			// Reload userState to get updated playerParameters and resources
			const updatedUserState = await UserState.findOne({
				where: { userId },
			});

			// Return the updated user upgrade with the upgrade node and updated state
			return {
				...userUpgrade.toJSON(),
				upgradeNode: upgradeNode.toJSON(),
				resourcesSpent: price,
				playerParameters: updatedUserState.playerParameters,
				// Return updated resources to sync client state
				userState: {
					stardust: updatedUserState.stardust,
					darkMatter: updatedUserState.darkMatter,
					stars: updatedUserState.stars,
				},
			};
		} catch (err) {
			await t.rollback();
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(`Failed to purchase upgrade: ${err.message}`);
		}
	}

	/**
	 * Update progress for a user upgrade
	 * @param {number} userId - User ID
	 * @param {string} slug - Upgrade node ID
	 * @param {number} progress - New progress value
	 * @returns {Promise<Object>} Updated user upgrade
	 */
	async updateUpgradeProgress(userId, slug, progress) {
		const t = await sequelize.transaction();

		try {
			const upgradeNode = await UpgradeNodeTemplate.findOne({
				where: { slug },
			});
			if (!upgradeNode) {
				throw ApiError.NotFound("Upgrade node not found");
			}
			// Get the user upgrade
			const userUpgrade = await UserUpgrade.findOne({
				where: {
					userId,
					upgradeTemplateSlug: upgradeNode.slug,
				},
				include: [
					{
						model: UpgradeNodeTemplate,
					},
				],
				transaction: t,
			});

			if (!userUpgrade) {
				await t.rollback();
				throw ApiError.NotFound("User upgrade not found");
			}

			// If the upgrade is already completed, don't update progress
			if (userUpgrade.completed) {
				await t.rollback();
				return userUpgrade;
			}

			// Update progress
			userUpgrade.progress = Math.min(progress, userUpgrade.targetProgress);

			// Check if the upgrade is now completed
			if (userUpgrade.progress >= userUpgrade.targetProgress) {
				userUpgrade.completed = true;

				// If at max level, mark as completed
				if (userUpgrade.level >= userUpgrade.upgradenode.maxLevel) {
					userUpgrade.completed = true;
				} else {
					// Otherwise, prepare for next level
					userUpgrade.progress = 0;
					userUpgrade.level += 1;
					userUpgrade.completed = false;
				}
			}

			// Update progress history
			userUpgrade.progressHistory = [
				...(userUpgrade.progressHistory || []),
				{
					timestamp: Date.now(),
					progress: userUpgrade.progress,
					level: userUpgrade.level,
				},
			];

			userUpgrade.lastProgressUpdate = new Date();

			await userUpgrade.save({ transaction: t });
			await t.commit();

			return userUpgrade;
		} catch (err) {
			await t.rollback();
			if (err instanceof ApiError) {
				throw err;
			}
			throw ApiError.Internal(
				`Failed to update upgrade progress: ${err.message}`
			);
		}
	}

	/**
	 * Calculate the price of an upgrade based on level
	 * @param {number} basePrice - Base price of the upgrade
	 * @param {number} currentLevel - Current level of the upgrade
	 * @param {number} priceMultiplier - Price multiplier for each level
	 * @returns {number} Calculated price
	 */
	calculateUpgradePrice(basePrice, currentLevel, priceMultiplier) {
		return Math.floor(basePrice * Math.pow(priceMultiplier, currentLevel));
	}

	/**
	 * Get upgrade statistics for a user
	 * @param {number} userId - User ID
	 * @returns {Promise<Object>} Upgrade statistics
	 */
	async getUpgradeStats(userId) {
		try {
			// Get all user upgrades
			const userUpgrades = await UserUpgrade.findAll({
				where: { userId },
				include: [
					{
						model: UpgradeNode,
						attributes: ["category", "resource"],
					},
				],
			});

			// Get all upgrade nodes to calculate total available
			const allUpgradeNodes = await UpgradeNode.findAll({
				where: { active: true },
			});

			// Calculate statistics
			const stats = {
				total: userUpgrades.length,
				completed: userUpgrades.filter((u) => u.completed).length,
				inProgress: userUpgrades.filter((u) => !u.completed).length,
				totalAvailable: allUpgradeNodes.length,
				byCategory: {},
				byResource: {},
				totalLevels: 0,
				totalMaxLevels: 0,
			};

			// Calculate by category and resource
			userUpgrades.forEach((upgrade) => {
				const category = upgrade.upgradenode?.category || "unknown";
				const resource = upgrade.upgradenode?.resource || "unknown";

				// Count by category
				if (!stats.byCategory[category]) {
					stats.byCategory[category] = {
						total: 0,
						completed: 0,
						inProgress: 0,
					};
				}
				stats.byCategory[category].total++;
				if (upgrade.completed) {
					stats.byCategory[category].completed++;
				} else {
					stats.byCategory[category].inProgress++;
				}

				// Count by resource
				if (!stats.byResource[resource]) {
					stats.byResource[resource] = {
						total: 0,
						completed: 0,
						inProgress: 0,
					};
				}
				stats.byResource[resource].total++;
				if (upgrade.completed) {
					stats.byResource[resource].completed++;
				} else {
					stats.byResource[resource].inProgress++;
				}

				// Count levels
				stats.totalLevels += upgrade.level;
				stats.totalMaxLevels += upgrade.upgradenode?.maxLevel || 0;
			});

			// Calculate completion percentage
			stats.completionPercentage =
				stats.total > 0
					? Math.floor((stats.completed / stats.total) * 100)
					: 0;

			// Calculate level completion percentage
			stats.levelCompletionPercentage =
				stats.totalMaxLevels > 0
					? Math.floor((stats.totalLevels / stats.totalMaxLevels) * 100)
					: 0;

			return stats;
		} catch (err) {
			throw ApiError.Internal(`Failed to get upgrade stats: ${err.message}`);
		}
	}

	/**
	 * Reset all upgrades for a user
	 * @param {number} userId - User ID
	 * @returns {Promise<Object>} Result of the reset operation
	 */
	async resetUpgrades(userId) {
		const t = await sequelize.transaction();

		try {
			// Delete all user upgrades
			await UserUpgrade.destroy({
				where: { userId },
				transaction: t,
			});

			// Optionally, refund resources
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (userState) {
				// You could implement resource refund logic here
				await userState.save({ transaction: t });
			}

			await t.commit();
			return {
				success: true,
				message: "All upgrades reset successfully",
			};
		} catch (err) {
			await t.rollback();
			throw ApiError.Internal(`Failed to reset upgrades: ${err.message}`);
		}
	}
}

module.exports = new UpgradeService();
