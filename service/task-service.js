/**
 * created by Tatyana Mikhniukevich on 09.06.2025
 */
const {
	TaskTemplate,
	UserState,
	UserTask,
	PaymentTransaction,
} = require("../models/models");
const ApiError = require("../exceptions/api-error");
const { ERROR_CODES } = require("../config/error-codes");
const { SYSTEM_USER_ID } = require("../config/constants");
const sequelize = require("../db");
const { Op } = require("sequelize");
const marketService = require("./market-service");
const galaxyService = require("./galaxy-service");
const artifactService = require("./artifact-service");
const logger = require("./logger-service");

class TaskService {
	/**
	 * Initialize tasks for a new user using findOrCreate
	 * @param {number} userId - User ID
	 * @param {Transaction} transaction - Optional transaction object
	 * @returns {Promise<Object>} - Initialized tasks
	 */
	async initializeUserTasks(userId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		logger.debug("initializeUserTasks on start", { userId });

		try {
			// Просто вызываем getUserTasks, который теперь сам управляет задачами
			const tasks = await this.getUserTasks(userId, t);

			if (shouldCommit && !t.finished) {
				await t.commit();
			}

			logger.debug("User tasks initialized successfully", {
				userId,
				tasksCount: tasks.length,
			});

			return { tasks };
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}

			logger.error("Failed to initialize user tasks", {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to initialize user tasks: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}

	async getUserTasks(userId, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			logger.debug("getUserTasks on start", { userId });

			// Получаем все шаблоны задач (активные и неактивные)
			const allTaskTemplates = await TaskTemplate.findAll({
				transaction: t,
			});

			// Получаем существующие задачи пользователя
			const existingUserTasks = await UserTask.findAll({
				where: { userId },
				transaction: t,
			});

			// Создаем карту существующих задач по templateId
			const existingTasksMap = new Map();
			existingUserTasks.forEach((userTask) => {
				existingTasksMap.set(userTask.taskTemplateId, userTask);
			});

			// Обрабатываем каждый шаблон задач
			for (const taskTemplate of allTaskTemplates) {
				const existingTask = existingTasksMap.get(taskTemplate.id);
				const isDailyLogin = taskTemplate.slug === "daily_login";
				const now = new Date();

				if (taskTemplate.active) {
					// Шаблон активен - создаем или активируем задачу
					if (!existingTask) {
						// Создаем новую задачу
						await UserTask.create(
							{
								userId,
								taskTemplateId: taskTemplate.id,
								status: "locked",
								reward: taskTemplate.reward || {
									type: "stardust",
									amount: 0,
								},
								active: true,
								// Для daily_login устанавливаем completedAt в текущую дату
								...(isDailyLogin && { completedAt: now }),
							},
							{ transaction: t }
						);
					} else if (!existingTask.active) {
						// Активируем существующую задачу
						await existingTask.update(
							{ active: true },
							{ transaction: t }
						);
					}

					// Для daily_login задач проверяем completedAt
					if (existingTask && isDailyLogin && !existingTask.completedAt) {
						await existingTask.update(
							{ completedAt: now },
							{ transaction: t }
						);
					}
				} else {
					// Шаблон неактивен - деактивируем задачу если она существует
					if (existingTask && existingTask.active) {
						await existingTask.update(
							{ active: false },
							{ transaction: t }
						);
					}
				}
			}

			// Получаем все задачи пользователя с информацией о задачах
			const userTasks = await UserTask.findAll({
				where: { userId },
				include: [
					{
						model: TaskTemplate,
						attributes: [
							"id",
							"slug",
							"name",
							"labelKey",
							"description",
							"reward",
							"condition",
							"icon",
							"active",
							"isDaily",
						],
					},
				],
				transaction: t,
			});

			// Получаем только активные задачи для оценки
			const activeTasks = userTasks.filter((task) => task.active);

			// Оцениваем доступность задач и обновляем их статусы
			const evaluatedTasks = await this.evaluateAvailableTasks(
				userId,
				activeTasks,
				t
			);

			// Создаем карту обновленных задач для быстрого поиска
			const evaluatedTasksMap = new Map();
			evaluatedTasks.forEach((task) => {
				evaluatedTasksMap.set(task.id, task);
			});

			// Формируем результат с обновленными данными
			const result = userTasks.map((userTask) => {
				const evaluatedTask = evaluatedTasksMap.get(userTask.id);

				return {
					id: userTask.id,
					slug: userTask.tasktemplate.slug,
					userId: userTask.userId,
					taskId: userTask.taskId,
					status: evaluatedTask ? evaluatedTask.status : userTask.status,
					reward: evaluatedTask
						? evaluatedTask.reward
						: userTask.tasktemplate.reward,
					active: userTask.active,
					completedAt: evaluatedTask
						? evaluatedTask.completedAt
						: userTask.completedAt,
					task: userTask.tasktemplate,
				};
			});

			if (shouldCommit && !t.finished) {
				await t.commit();
			}

			logger.debug("getUserTasks completed successfully", {
				userId,
				tasksCount: result.length,
			});

			return result;
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}

			logger.error("Failed to get user tasks", {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get user tasks: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}

	/**
	 * Calculate daily reward based on current streak and task conditions
	 * @param {Object} taskTemplate - Task template with reward and condition
	 * @param {number} currentStreak - Current streak from userState
	 * @returns {Object} - Calculated reward with updated amount
	 */
	calculateDailyReward(taskTemplate, currentStreak) {
		const baseReward = taskTemplate.reward || {
			type: "stardust",
			amount: 0,
		};
		const condition = taskTemplate.condition;

		// Если нет условий или дней, возвращаем базовую награду
		if (!condition || !condition.days || condition.days.length === 0) {
			return baseReward;
		}

		// Находим максимальный день в массиве days
		const maxDay = Math.max(...condition.days);

		// Рассчитываем эффективный streak для расчета награды
		let effectiveStreak = currentStreak;
		if (currentStreak > maxDay) {
			// Вычисляем позицию в цикле
			const cyclePosition = ((currentStreak - 1) % maxDay) + 1;
			effectiveStreak = cyclePosition;
		}

		// Проверяем, есть ли эффективный streak в разрешенных днях
		if (condition.days.includes(effectiveStreak)) {
			const rewardAmount = Math.floor(
				baseReward.amount * (baseReward.multiplier || 1) * effectiveStreak
			);

			return {
				...baseReward,
				amount: rewardAmount,
			};
		}

		// Если streak не входит в разрешенные дни, возвращаем базовую награду
		return baseReward;
	}

	/**
	 * Evaluate available tasks - check if tasks can be moved from locked to available
	 * and initialize data for daily tasks
	 * @param {number} userId - User ID
	 * @param {Array} activeTasks - Array of active user tasks
	 * @param {Transaction} transaction - Optional transaction object
	 * @returns {Promise<Array>} - Updated tasks with current status and rewards
	 */
	async evaluateAvailableTasks(userId, activeTasks, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			logger.debug("evaluateAvailableTasks on start", {
				userId,
				tasksCount: activeTasks.length,
			});

			// Получаем userState для проверки currentStreak
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			// Определяем задачи, которые требуют проверки галактик
			const galaxyRelatedTasks = activeTasks.filter((userTask) => {
				const taskTemplate = userTask.tasktemplate;
				const slug = taskTemplate.slug;

				// Задачи, связанные с галактиками
				return (
					slug.includes("galaxy") ||
					slug.includes("capture") ||
					slug.includes("explore") ||
					slug.includes("conquer")
				);
			});

			// Определяем задачи, которые требуют проверки артефактов
			const artifactRelatedTasks = activeTasks.filter((userTask) => {
				const taskTemplate = userTask.tasktemplate;
				const slug = taskTemplate.slug;

				// Задачи, связанные с артефактами
				return (
					slug.includes("artifact") ||
					slug.includes("collect") ||
					slug.includes("gather") ||
					slug.includes("find") ||
					slug.includes("discover")
				);
			});

			// Определяем задачи, которые требуют проверки платежных транзакций
			const paymentRelatedTasks = activeTasks.filter((userTask) => {
				const taskTemplate = userTask.tasktemplate;
				const slug = taskTemplate.slug;

				// Задачи, связанные с платежами
				return (
					slug.includes("payment") ||
					slug.includes("transaction") ||
					slug.includes("spend") ||
					slug.includes("earn") ||
					slug.includes("purchase") ||
					slug.includes("buy") ||
					slug.includes("sell") ||
					slug.includes("reward")
				);
			});

			// Получаем список галактик пользователя только если есть задачи, требующие проверки
			let userGalaxies = [];
			if (galaxyRelatedTasks.length > 0) {
				try {
					userGalaxies = await galaxyService.getUserGalaxies(userId);
					logger.debug("Retrieved user galaxies for task evaluation", {
						userId,
						galaxiesCount: userGalaxies.length,
						galaxyRelatedTasksCount: galaxyRelatedTasks.length,
					});
				} catch (galaxyError) {
					logger.error("Failed to get user galaxies for task evaluation", {
						userId,
						error: galaxyError.message,
					});
					// Продолжаем выполнение без галактик
				}
			}

			// Получаем список артефактов пользователя только если есть задачи, требующие проверки
			let userArtifacts = [];
			if (artifactRelatedTasks.length > 0) {
				try {
					userArtifacts = await artifactService.getUserArtifacts(userId);
					logger.debug("Retrieved user artifacts for task evaluation", {
						userId,
						artifactsCount: userArtifacts.length,
						artifactRelatedTasksCount: artifactRelatedTasks.length,
					});
				} catch (artifactError) {
					logger.error(
						"Failed to get user artifacts for task evaluation",
						{
							userId,
							error: artifactError.message,
						}
					);
					// Продолжаем выполнение без артефактов
				}
			}

			// Получаем все завершенные платежные транзакции пользователя только если есть задачи, требующие проверки
			let userPayments = [];
			if (paymentRelatedTasks.length > 0) {
				try {
					userPayments = await PaymentTransaction.findAll({
						where: {
							status: "CONFIRMED",
							[Op.or]: [
								{ fromAccount: userId },
								{ toAccount: userId },
							],
						},
						transaction: t,
					});
					logger.debug(
						"Retrieved user payment transactions for task evaluation",
						{
							userId,
							paymentsCount: userPayments.length,
							paymentRelatedTasksCount: paymentRelatedTasks.length,
						}
					);
				} catch (paymentError) {
					logger.error(
						"Failed to get user payment transactions for task evaluation",
						{
							userId,
							error: paymentError.message,
						}
					);
					// Продолжаем выполнение без платежных транзакций
				}
			}

			const updatedTasks = [];

			for (const userTask of activeTasks) {
				const taskTemplate = userTask.tasktemplate;
				const isDailyTask =
					taskTemplate.isDaily || taskTemplate.slug === "daily_login";
				const isGalaxyRelated = galaxyRelatedTasks.includes(userTask);
				const isArtifactRelated = artifactRelatedTasks.includes(userTask);
				const isPaymentRelated = paymentRelatedTasks.includes(userTask);
				let updatedTask = {
					...userTask.toJSON(),
					reward: taskTemplate.reward,
				};

				// Проверяем задачи, связанные с галактиками
				if (isGalaxyRelated && userGalaxies.length > 0) {
					const slug = taskTemplate.slug;
					let canComplete = false;

					// Проверяем условия выполнения в зависимости от типа задачи
					if (
						slug.includes("capture") ||
						slug.includes("galaxy_capture")
					) {
						// Задача на захват галактик - проверяем количество захваченных галактик
						const capturedGalaxies = userGalaxies.filter(
							(galaxy) => galaxy.isOwned
						);
						const requiredCount = taskTemplate.condition?.count || 1;
						canComplete = capturedGalaxies.length >= requiredCount;

						logger.debug("Galaxy capture task evaluation", {
							userId,
							taskSlug: slug,
							capturedCount: capturedGalaxies.length,
							requiredCount,
							canComplete,
						});
					} else if (
						slug.includes("explore") ||
						slug.includes("galaxy_explore")
					) {
						// Задача на исследование галактик
						const exploredGalaxies = userGalaxies.filter(
							(galaxy) => galaxy.isExplored
						);
						const requiredCount = taskTemplate.condition?.count || 1;
						canComplete = exploredGalaxies.length >= requiredCount;

						logger.debug("Galaxy explore task evaluation", {
							userId,
							taskSlug: slug,
							exploredCount: exploredGalaxies.length,
							requiredCount,
							canComplete,
						});
					} else if (
						slug.includes("conquer") ||
						slug.includes("galaxy_conquer")
					) {
						// Задача на завоевание галактик
						const conqueredGalaxies = userGalaxies.filter(
							(galaxy) => galaxy.isConquered
						);
						const requiredCount = taskTemplate.condition?.count || 1;
						canComplete = conqueredGalaxies.length >= requiredCount;

						logger.debug("Galaxy conquer task evaluation", {
							userId,
							taskSlug: slug,
							conqueredCount: conqueredGalaxies.length,
							requiredCount,
							canComplete,
						});
					}

					// Обновляем статус задачи на основе проверки галактик
					if (canComplete && userTask.status === "locked") {
						await userTask.update(
							{ status: "available" },
							{ transaction: t }
						);
						updatedTask.status = "available";
					} else if (!canComplete && userTask.status === "available") {
						await userTask.update(
							{ status: "locked" },
							{ transaction: t }
						);
						updatedTask.status = "locked";
					}
				}

				// Проверяем задачи, связанные с артефактами
				if (isArtifactRelated && userArtifacts.length > 0) {
					const slug = taskTemplate.slug;
					let canComplete = false;

					// Проверяем условия выполнения в зависимости от типа задачи
					if (
						slug.includes("collect") ||
						slug.includes("artifact_collect")
					) {
						// Задача на сбор артефактов - проверяем количество собранных артефактов
						const collectedArtifacts = userArtifacts.filter(
							(artifact) => artifact.active && artifact.completed
						);
						const requiredCount = taskTemplate.condition?.count || 1;
						canComplete = collectedArtifacts.length >= requiredCount;

						logger.debug("Artifact collect task evaluation", {
							userId,
							taskSlug: slug,
							collectedCount: collectedArtifacts.length,
							requiredCount,
							canComplete,
						});
					} else if (
						slug.includes("gather") ||
						slug.includes("artifact_gather")
					) {
						// Задача на сбор артефактов определенного типа
						const artifactType =
							taskTemplate.condition?.type || "common";
						const gatheredArtifacts = userArtifacts.filter(
							(artifact) =>
								artifact.active &&
								artifact.completed &&
								artifact.rarity === artifactType
						);
						const requiredCount = taskTemplate.condition?.count || 1;
						canComplete = gatheredArtifacts.length >= requiredCount;

						logger.debug("Artifact gather task evaluation", {
							userId,
							taskSlug: slug,
							artifactType,
							gatheredCount: gatheredArtifacts.length,
							requiredCount,
							canComplete,
						});
					} else if (
						slug.includes("find") ||
						slug.includes("artifact_find")
					) {
						// Задача на поиск артефактов
						const foundArtifacts = userArtifacts.filter(
							(artifact) => artifact.active
						);
						const requiredCount = taskTemplate.condition?.count || 1;
						canComplete = foundArtifacts.length >= requiredCount;

						logger.debug("Artifact find task evaluation", {
							userId,
							taskSlug: slug,
							foundCount: foundArtifacts.length,
							requiredCount,
							canComplete,
						});
					} else if (
						slug.includes("discover") ||
						slug.includes("artifact_discover")
					) {
						// Задача на открытие новых артефактов
						const discoveredArtifacts = userArtifacts.filter(
							(artifact) => artifact.active && artifact.completed
						);
						const requiredCount = taskTemplate.condition?.count || 1;
						canComplete = discoveredArtifacts.length >= requiredCount;

						logger.debug("Artifact discover task evaluation", {
							userId,
							taskSlug: slug,
							discoveredCount: discoveredArtifacts.length,
							requiredCount,
							canComplete,
						});
					}

					// Обновляем статус задачи на основе проверки артефактов
					if (canComplete && userTask.status === "locked") {
						await userTask.update(
							{ status: "available" },
							{ transaction: t }
						);
						updatedTask.status = "available";
					} else if (!canComplete && userTask.status === "available") {
						await userTask.update(
							{ status: "locked" },
							{ transaction: t }
						);
						updatedTask.status = "locked";
					}
				}

				// Проверяем задачи, связанные с платежными транзакциями
				if (isPaymentRelated && userPayments.length > 0) {
					const slug = taskTemplate.slug;
					const condition = taskTemplate.condition || {};
					let canComplete = false;

					// Парсим платежные транзакции и формируем счетчики
					const paymentStats = {
						totalTransactions: userPayments.length,
						totalSpent: 0,
						totalEarned: 0,
						byCurrency: {},
						byTxType: {},
						byDirection: { sent: 0, received: 0 },
					};

					// Обрабатываем каждую транзакцию
					for (const payment of userPayments) {
						const amount = parseFloat(payment.priceOrAmount);
						const currency = payment.currencyOrResource;
						const txType = payment.txType;

						// Определяем направление транзакции
						if (payment.fromAccount === userId) {
							paymentStats.totalSpent += amount;
							paymentStats.byDirection.sent++;
						} else if (payment.toAccount === userId) {
							paymentStats.totalEarned += amount;
							paymentStats.byDirection.received++;
						}

						// Счетчики по валютам
						if (!paymentStats.byCurrency[currency]) {
							paymentStats.byCurrency[currency] = {
								spent: 0,
								earned: 0,
								count: 0,
							};
						}
						if (payment.fromAccount === userId) {
							paymentStats.byCurrency[currency].spent += amount;
						} else {
							paymentStats.byCurrency[currency].earned += amount;
						}
						paymentStats.byCurrency[currency].count++;

						// Счетчики по типам транзакций
						if (!paymentStats.byTxType[txType]) {
							paymentStats.byTxType[txType] = 0;
						}
						paymentStats.byTxType[txType]++;
					}

					// Проверяем условия выполнения в зависимости от типа задачи
					if (slug.includes("spend") || slug.includes("payment_spend")) {
						// Задача на траты - проверяем общую сумму потраченных средств
						const requiredAmount = condition.amount || 0;
						const currency = condition.currency || "stardust";
						const spentAmount =
							paymentStats.byCurrency[currency]?.spent || 0;
						canComplete = spentAmount >= requiredAmount;

						logger.debug("Payment spend task evaluation", {
							userId,
							taskSlug: slug,
							spentAmount,
							requiredAmount,
							currency,
							canComplete,
						});
					} else if (
						slug.includes("earn") ||
						slug.includes("payment_earn")
					) {
						// Задача на заработок - проверяем общую сумму заработанных средств
						const requiredAmount = condition.amount || 0;
						const currency = condition.currency || "stardust";
						const earnedAmount =
							paymentStats.byCurrency[currency]?.earned || 0;
						canComplete = earnedAmount >= requiredAmount;

						logger.debug("Payment earn task evaluation", {
							userId,
							taskSlug: slug,
							earnedAmount,
							requiredAmount,
							currency,
							canComplete,
						});
					} else if (
						slug.includes("purchase") ||
						slug.includes("payment_purchase")
					) {
						// Задача на покупки - проверяем количество покупок
						const requiredCount = condition.count || 1;
						const purchaseCount =
							paymentStats.byTxType["BUYER_TO_CONTRACT"] || 0;
						canComplete = purchaseCount >= requiredCount;

						logger.debug("Payment purchase task evaluation", {
							userId,
							taskSlug: slug,
							purchaseCount,
							requiredCount,
							canComplete,
						});
					} else if (
						slug.includes("transaction") ||
						slug.includes("payment_transaction")
					) {
						// Задача на общее количество транзакций
						const requiredCount = condition.count || 1;
						canComplete =
							paymentStats.totalTransactions >= requiredCount;

						logger.debug("Payment transaction task evaluation", {
							userId,
							taskSlug: slug,
							totalTransactions: paymentStats.totalTransactions,
							requiredCount,
							canComplete,
						});
					} else if (
						slug.includes("reward") ||
						slug.includes("payment_reward")
					) {
						// Задача на получение наград
						const requiredCount = condition.count || 1;
						const rewardCount =
							(paymentStats.byTxType["TASK_REWARD"] || 0) +
							(paymentStats.byTxType["EVENT_REWARD"] || 0) +
							(paymentStats.byTxType["DAILY_REWARD"] || 0);
						canComplete = rewardCount >= requiredCount;

						logger.debug("Payment reward task evaluation", {
							userId,
							taskSlug: slug,
							rewardCount,
							requiredCount,
							canComplete,
						});
					}

					// Обновляем статус задачи на основе проверки платежных транзакций
					if (canComplete && userTask.status === "locked") {
						await userTask.update(
							{ status: "available" },
							{ transaction: t }
						);
						updatedTask.status = "available";
					} else if (!canComplete && userTask.status === "available") {
						await userTask.update(
							{ status: "locked" },
							{ transaction: t }
						);
						updatedTask.status = "locked";
					}
				}

				if (isDailyTask) {
					// Для ежедневных задач - проверяем доступность и рассчитываем награду
					const now = new Date();
					const today = new Date(
						now.getFullYear(),
						now.getMonth(),
						now.getDate()
					);
					const lastCompleted = userTask.completedAt;

					// Проверяем, забирал ли пользователь награду сегодня
					let canClaimToday = true;
					if (lastCompleted) {
						const lastClaimDate = new Date(
							lastCompleted.getFullYear(),
							lastCompleted.getMonth(),
							lastCompleted.getDate()
						);
						canClaimToday = lastClaimDate.getTime() !== today.getTime();
					}

					// Получаем currentStreak из userState
					const currentStreak = userState?.currentStreak || 1;

					// Рассчитываем награду используя отдельный метод
					const calculatedReward = this.calculateDailyReward(
						taskTemplate,
						currentStreak
					);

					// Обновляем статус задачи
					if (canClaimToday && userTask.status === "completed") {
						// Сбрасываем статус для нового дня
						await userTask.update(
							{
								status: "available",
								completedAt: null,
							},
							{ transaction: t }
						);
						updatedTask.status = "available";
						updatedTask.completedAt = null;
					} else if (userTask.status === "locked" && canClaimToday) {
						// Разблокируем ежедневную задачу
						await userTask.update(
							{ status: "available" },
							{ transaction: t }
						);
						updatedTask.status = "available";
					}

					// Обновляем награду с рассчитанным значением
					updatedTask.reward = calculatedReward;

					logger.debug("Daily task evaluation", {
						userId,
						taskSlug: taskTemplate.slug,
						currentStreak,
						canClaimToday,
						calculatedReward,
						lastCompleted: lastCompleted?.toISOString(),
					});
				} else {
					// Для не-ежедневных задач - проверяем условия разблокировки
					if (userTask.status === "locked") {
						// Здесь можно добавить логику проверки условий разблокировки
						// Например, проверка уровня пользователя, количества выполненных задач и т.д.

						// Пока что просто разблокируем все не-ежедневные задачи
						await userTask.update(
							{ status: "available" },
							{ transaction: t }
						);
						updatedTask.status = "available";
					}
				}

				updatedTasks.push({
					...updatedTask,
					slug: taskTemplate.slug,
					task: taskTemplate.toJSON(),
				});
			}

			if (shouldCommit && !t.finished) {
				await t.commit();
			}

			logger.debug("evaluateAvailableTasks completed successfully", {
				userId,
				updatedTasksCount: updatedTasks.length,
			});

			return updatedTasks;
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}

			logger.error("Failed to evaluate available tasks", {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to evaluate available tasks: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}

	/**
	 * Complete a task for a user
	 * @param {number} userId - User ID
	 * @param {string} slug - Task slug
	 * @param {Transaction} transaction - Optional transaction object
	 * @returns {Promise<Object>} - Completed task
	 */
	async completeTask(userId, slug, transaction) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			logger.debug("completeTask on start", { userId, slug });

			// Находим шаблон задачи
			const taskTemplate = await TaskTemplate.findOne({
				where: { slug },
				transaction: t,
			});

			if (!taskTemplate) {
				logger.debug("completeTask - task template not found", {
					userId,
					slug,
				});
				throw ApiError.NotFound(
					`Task template not found: ${slug}`,
					ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND
				);
			}

			// Находим задачу пользователя
			const userTask = await UserTask.findOne({
				where: {
					userId,
					taskTemplateId: taskTemplate.id,
					active: true,
					status: "locked",
				},
				include: [
					{
						model: TaskTemplate,
						attributes: ["reward"],
					},
				],
				transaction: t,
			});

			if (!userTask) {
				logger.debug("completeTask - user task not found", {
					userId,
					slug,
					taskTemplateId: taskTemplate.id,
				});
				throw ApiError.BadRequest(
					`User task not found for template: ${slug}`,
					ERROR_CODES.TASK.TASK_NOT_FOUND
				);
			}

			// Если задача уже завершена, возвращаем информацию
			if (userTask.status === "completed") {
				logger.debug("completeTask - task already completed", {
					userId,
					slug,
				});
				return { success: false, userTask };
			}

			// Помечаем задачу как завершенную
			const now = new Date();
			userTask.status = "completed";
			userTask.completedAt = now;
			await userTask.save({ transaction: t });

			// Создаем offer для регистрации изменений в состоянии через registerOffer
			const reward = taskTemplate.reward;
			const offerData = {
				sellerId: SYSTEM_USER_ID, // Системный аккаунт
				buyerId: userId,
				price: 0, // Задачи не имеют цены
				currency: reward.type, // Используем тип награды как валюту
				resource: reward.type, // Используем тип награды как ресурс
				amount: reward.amount,
				itemType: "task",
				itemId: userTask.id, // userTaskId
				offerType: "SYSTEM",
				txType: "TASK_REWARD",
			};

			// Используем registerOffer для регистрации изменений в состоянии
			const result = await marketService.registerOffer(offerData, t);

			// Получаем обновленное состояние пользователя
			const userState = await UserState.findOne({
				where: { userId },
				transaction: t,
			});

			if (shouldCommit && !t.finished) {
				await t.commit();
			}

			logger.debug("completeTask completed successfully", {
				userId,
				slug,
				taskId: userTask.id,
				reward: reward,
				marketResult: result,
			});

			return {
				success: true,
				userTask,
				userState: userState,
				marketResult: result,
			};
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}

			logger.error("Failed to complete task", {
				userId,
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to complete task: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}

	async getTotalTaskReward(userId) {
		const t = await sequelize.transaction();

		try {
			logger.debug("getTotalTaskReward on start", { userId });

			// Получаем все завершенные задачи пользователя с шаблонами
			const completedTasks = await UserTask.findAll({
				where: {
					userId,
					status: "completed",
				},
				include: [
					{
						model: TaskTemplate,
						attributes: ["reward"],
					},
				],
				transaction: t,
			});

			// Вычисляем общую награду
			let totalReward = 0;
			for (const task of completedTasks) {
				const reward = task.tasktemplate?.reward || { amount: 0 };
				totalReward += reward.amount || 0;
			}

			await t.commit();

			logger.debug("getTotalTaskReward completed successfully", {
				userId,
				totalReward,
				completedTasksCount: completedTasks.length,
			});

			return { totalReward };
		} catch (err) {
			await t.rollback();

			logger.error("Failed to get total task reward", {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get total task reward: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}

	async getTaskStatus(userId, slug) {
		try {
			logger.debug("getTaskStatus on start", { userId, slug });

			// Находим шаблон задачи
			const taskTemplate = await TaskTemplate.findOne({
				where: { slug },
			});

			if (!taskTemplate) {
				logger.debug("getTaskStatus - task template not found", {
					userId,
					slug,
				});
				throw ApiError.NotFound(
					`Task template not found: ${slug}`,
					ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND
				);
			}

			// Находим задачу пользователя
			const userTask = await UserTask.findOne({
				where: {
					userId,
					taskTemplateId: taskTemplate.id,
					active: true,
				},
			});

			if (!userTask) {
				logger.debug("getTaskStatus - user task not found", {
					userId,
					slug,
					taskTemplateId: taskTemplate.id,
				});
				throw ApiError.BadRequest(
					`User task not found for template: ${slug}`,
					ERROR_CODES.TASK.TASK_NOT_FOUND
				);
			}

			const result = {
				taskId: taskTemplate.id,
				slug: taskTemplate.slug,
				status: userTask.status,
				active: userTask.active,
				completedAt: userTask.completedAt,
			};

			logger.debug("getTaskStatus completed successfully", {
				userId,
				slug,
				status: userTask.status,
				active: userTask.active,
			});

			return result;
		} catch (err) {
			logger.error("Failed to get task status", {
				userId,
				slug,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get task status: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}

	async getUserTaskStats(userId) {
		const t = await sequelize.transaction();

		try {
			logger.debug("getUserTaskStats on start", { userId });

			// Get all user tasks
			const userTasks = await UserTask.findAll({
				where: { userId },
				transaction: t,
			});

			// Calculate statistics
			const totalTasks = userTasks.length;
			const completedTasks = userTasks.filter(
				(task) => task.status === "completed"
			).length;
			const activeTasks = userTasks.filter(
				(task) => task.active && task.status !== "completed"
			).length;

			// Calculate completion percentage
			const completionPercentage =
				totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

			await t.commit();

			const result = {
				total: totalTasks,
				completed: completedTasks,
				active: activeTasks,
				completionPercentage,
				lastUpdate: new Date(),
			};

			logger.debug("getUserTaskStats completed successfully", {
				userId,
				totalTasks,
				completedTasks,
				activeTasks,
				completionPercentage,
			});

			return result;
		} catch (err) {
			await t.rollback();

			logger.error("Failed to get user task stats", {
				userId,
				error: err.message,
				stack: err.stack,
			});

			if (err instanceof ApiError) {
				throw err;
			}

			throw ApiError.Internal(
				`Failed to get user task stats: ${err.message}`,
				ERROR_CODES.SYSTEM.DATABASE_ERROR
			);
		}
	}
}

module.exports = new TaskService();
