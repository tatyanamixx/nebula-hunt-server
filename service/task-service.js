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
	 * Initialize user tasks
	 * @param {number} userId - User ID
	 * @param {Object} transaction - Optional transaction
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
				const existingTask = existingTasksMap.get(taskTemplate.slug);
				const isDailyLogin = taskTemplate.slug === "daily_login";
				const now = new Date();

				if (taskTemplate.active) {
					// Шаблон активен - создаем или активируем задачу
					if (!existingTask) {
						// Создаем новую задачу
						await UserTask.create(
							{
								userId,
								taskTemplateId: taskTemplate.slug,
								// Для daily_login делаем доступной сразу на первый день
								status: isDailyLogin ? "available" : "locked",
								reward: taskTemplate.reward || {
									type: "stardust",
									amount: 0,
								},
								active: true,
								// Для daily_login не ставим completedAt, чтобы можно было забрать сразу
								...(isDailyLogin ? { completedAt: null } : {}),
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

					// Для daily_login задач: если completedAt пустой, оставляем пустым
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
			// ✅ Фильтруем только задачи с активными шаблонами
			const userTasks = await UserTask.findAll({
				where: { userId },
				include: [
					{
						model: TaskTemplate,
						where: {
							active: true, // ✅ Только активные шаблоны заданий
						},
						required: true, // ✅ INNER JOIN - только задачи с активными шаблонами
						attributes: [
							"slug",
							"title",
							"description",
							"reward",
							"condition",
							"icon",
							"active",
							"isDaily",
							"category",
							"sortOrder",
						],
					},
				],
				transaction: t,
			});

			// Получаем только активные задачи для оценки (фильтруем по userTask.active)
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

				// Получаем TaskTemplate данные (может быть под разными именами)
				const taskTemplate = userTask.TaskTemplate || userTask.tasktemplate;

				return {
					id: userTask.id,
					slug: taskTemplate?.slug,
					userId: userTask.userId,
					taskId: userTask.taskId,
					status: evaluatedTask ? evaluatedTask.status : userTask.status,
					reward: evaluatedTask
						? evaluatedTask.reward
						: taskTemplate?.reward,
					active: userTask.active,
					completedAt: evaluatedTask?.completedAt
						? evaluatedTask.completedAt.toISOString()
						: userTask.completedAt
						? userTask.completedAt.toISOString()
						: null,
					nextReward: evaluatedTask ? evaluatedTask.nextReward : undefined,
					task: taskTemplate,
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

		// Рассчитываем, сколько полных циклов пройдено
		const completedCycles = Math.floor(currentStreak / maxDay);

		// Проверяем, есть ли эффективный streak в разрешенных днях
		if (condition.days.includes(effectiveStreak)) {
			// Определяем тип награды: дни 3, 5, 7 дают Dark Matter
			const rewardType = [3, 5, 7].includes(effectiveStreak)
				? "darkMatter"
				: "stardust";

			// Параметры для расчета
			const power = 1.5; // Степень для роста награды
			const baseAmount = 1000; // Базовая награда для первого дня

			// Рассчитываем количество награды
			let rewardAmount;
			if (effectiveStreak === 7) {
				// День 7: большая награда Dark Matter с усилением от циклов
				const baseDay7 = 50;
				const cycleBonus = completedCycles * 25;
				rewardAmount = Math.floor(baseDay7 + cycleBonus);
			} else if (effectiveStreak === 5) {
				// День 5: средняя награда Dark Matter
				const baseDay5 = 15;
				const cycleBonus = completedCycles * 10;
				rewardAmount = Math.floor(baseDay5 + cycleBonus);
			} else if (effectiveStreak === 3) {
				// День 3: малая награда Dark Matter
				const baseDay3 = 5;
				const cycleBonus = completedCycles * 5;
				rewardAmount = Math.floor(baseDay3 + cycleBonus);
			} else {
				// Обычные дни (1, 2, 4, 6): награда растет степенно
				// Формула: baseAmount * (day ^ power) * (1 + cycleMultiplier)
				// Округляем до 1000: 1000, 3000, 5000, 8000, и т.д.
				const cycleMultiplier = completedCycles * 0.5; // +50% за каждый цикл
				const rawAmount =
					baseAmount *
					Math.pow(effectiveStreak, power) *
					(1 + cycleMultiplier);

				// Округляем до ближайшей 1000
				rewardAmount = Math.round(rawAmount / 1000) * 1000;
			}

			return {
				type: rewardType,
				amount: rewardAmount,
			};
		}

		// Если streak не входит в разрешенные дни, возвращаем базовую награду
		return baseReward;
	}

	/**
	 * Get the next reward day based on current streak and available days
	 * @param {number} currentStreak - Current streak
	 * @param {Array} availableDays - Array of available reward days
	 * @returns {number} - Next reward day
	 */
	getNextRewardDay(currentStreak, availableDays) {
		const maxDay = Math.max(...availableDays);

		// Calculate effective streak for next reward
		let nextDay = currentStreak + 1;
		if (nextDay > maxDay) {
			nextDay = 1; // Reset to day 1 after completing the cycle
		}

		return nextDay;
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
					const galaxiesResult = await galaxyService.getUserGalaxies(
						userId
					);
					userGalaxies = galaxiesResult.galaxies || [];
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
					const lastCompleted = userTask.completedAt;

					// Проверяем, можно ли забрать награду (через 24 часа после последнего выполнения)
					let canClaimToday = true;
					let shouldResetStreak = false;

					if (lastCompleted) {
						const timeDiff = now.getTime() - lastCompleted.getTime();
						const hoursDiff = timeDiff / (1000 * 60 * 60);

						// Интервал между наградами в минутах (по умолчанию 1440 = 24 часа)
						const intervalMinutes = parseInt(
							process.env.DAILY_TASK_INTERVAL_MINUTES || "1440",
							10
						);
						const intervalHours = intervalMinutes / 60;
						const resetHours = intervalHours * 2; // Удвоенный интервал для сброса streak

						// Можно забрать награду через указанный интервал
						canClaimToday = hoursDiff >= intervalHours;

						// Если прошло больше удвоенного интервала, сбрасываем streak
						shouldResetStreak = hoursDiff >= resetHours;

						logger.debug("Daily task time calculation", {
							userId,
							taskSlug: taskTemplate.slug,
							now: now.toISOString(),
							lastCompleted: lastCompleted.toISOString(),
							timeDiff,
							hoursDiff,
							intervalMinutes,
							intervalHours,
							resetHours,
							canClaimToday,
							shouldResetStreak,
						});
					}

					// Получаем currentStreak из userState
					let currentStreak = userState?.currentStreak || 0;

					// Если нужно сбросить streak (прошло больше 48 часов)
					if (shouldResetStreak) {
						currentStreak = 0;
						// Обновляем streak в userState
						if (userState) {
							await userState.update(
								{ currentStreak: 0 },
								{ transaction: t }
							);
						}
						logger.debug("Streak reset due to inactivity", {
							userId,
							taskSlug: taskTemplate.slug,
							previousStreak: userState?.currentStreak,
							newStreak: 0,
						});
					}

					// Определяем день для расчета награды:
					// - Если задание можно забрать (canClaimToday = true): показываем награду за следующий день (currentStreak + 1)
					// - Если задание уже выполнено (canClaimToday = false): показываем информацию о текущем выполненном дне (currentStreak)
					const dayForReward = canClaimToday
						? currentStreak + 1
						: currentStreak;
					const calculatedReward = this.calculateDailyReward(
						taskTemplate,
						dayForReward
					);

					// Обновляем статус задачи
					if (canClaimToday) {
						// Пользователь может забрать награду
						if (
							userTask.status === "completed" ||
							userTask.status === "locked"
						) {
							await userTask.update(
								{
									status: "available",
									completedAt: null,
								},
								{ transaction: t }
							);
							updatedTask.status = "available";
							updatedTask.completedAt = null;
						}
					} else {
						// Пользователь еще не может забрать награду
						if (userTask.status === "available") {
							await userTask.update(
								{ status: "completed" },
								{ transaction: t }
							);
							updatedTask.status = "completed";
						}
					}

					// Обновляем награду с рассчитанным значением
					updatedTask.reward = calculatedReward;

					// Добавляем информацию о следующей награде для ежедневных заданий
					if (taskTemplate.slug === "daily_login") {
						const condition = taskTemplate.condition;

						// Ensure condition.days exists and is an array
						if (
							condition &&
							condition.days &&
							Array.isArray(condition.days)
						) {
							// dayForReward показывает:
							// - Если можно забрать (canClaimToday = true): день награды, которую можно забрать сейчас
							// - Если нельзя забрать (canClaimToday = false): день награды, которую уже забрали
							updatedTask.nextReward = {
								day: dayForReward,
								reward: calculatedReward,
								canClaimToday: canClaimToday,
								currentStreak: currentStreak,
							};
						}
					}

					logger.debug("Daily task evaluation", {
						userId,
						taskSlug: taskTemplate.slug,
						currentStreak,
						dayForReward,
						canClaimToday,
						calculatedReward,
						lastCompleted: lastCompleted?.toISOString(),
						userStateCurrentStreak: userState?.currentStreak,
						userTaskStatus: userTask.status,
						userTaskCompletedAt: userTask.completedAt?.toISOString(),
						shouldResetStreak,
					});
				} else {
					// Для не-ежедневных задач - проверяем условия разблокировки
					if (userTask.status === "locked") {
						// Проверяем задачи создания звезд
						if (taskTemplate.slug.startsWith("create_stars_")) {
							// Получаем количество звезд пользователя из userState
							const userStars = userState?.stars || 0;

							// Извлекаем требуемое количество звезд из slug
							const requiredStars = parseInt(
								taskTemplate.slug.split("_")[2]
							);

							if (userStars >= requiredStars) {
								// Разблокируем задачу
								await userTask.update(
									{ status: "available" },
									{ transaction: t }
								);
								updatedTask.status = "available";

								logger.debug("Stars creation task unlocked", {
									userId,
									taskSlug: taskTemplate.slug,
									requiredStars,
									userStars,
								});
							}
						} else if (taskTemplate.slug.startsWith("own_galaxies_")) {
							// Проверяем задачи владения галактиками
							const galaxiesResult =
								await galaxyService.getUserGalaxies(userId);
							const userGalaxiesCount = galaxiesResult.galaxies
								? galaxiesResult.galaxies.length
								: 0;
							const requiredGalaxies = parseInt(
								taskTemplate.slug.split("_")[2]
							);

							if (userGalaxiesCount >= requiredGalaxies) {
								await userTask.update(
									{ status: "available" },
									{ transaction: t }
								);
								updatedTask.status = "available";

								logger.debug("Galaxy ownership task unlocked", {
									userId,
									taskSlug: taskTemplate.slug,
									requiredGalaxies,
									userGalaxiesCount,
								});
							}
						} else if (
							taskTemplate.slug.startsWith("collect_dark_matter_")
						) {
							// Проверяем задачи сбора темной материи
							const requiredDarkMatter = parseInt(
								taskTemplate.slug.split("_")[3]
							);

							// Для задач сбора темной материи всегда разблокируем
							// (пользователь может собирать темную материю в любое время)
							await userTask.update(
								{ status: "available" },
								{ transaction: t }
							);
							updatedTask.status = "available";

							logger.debug("Dark matter collection task unlocked", {
								userId,
								taskSlug: taskTemplate.slug,
								requiredDarkMatter,
							});
						} else if (
							taskTemplate.slug.startsWith("collect_stardust_")
						) {
							// Проверяем задачи сбора звездной пыли
							const requiredStardust = parseInt(
								taskTemplate.slug.split("_")[2]
							);

							// Для задач сбора звездной пыли всегда разблокируем
							// (пользователь может собирать звездную пыль в любое время)
							await userTask.update(
								{ status: "available" },
								{ transaction: t }
							);
							updatedTask.status = "available";

							logger.debug("Stardust collection task unlocked", {
								userId,
								taskSlug: taskTemplate.slug,
								requiredStardust,
							});
						} else if (taskTemplate.slug === "weekly_login") {
							// Проверяем еженедельную задачу входа
							const currentStreak = userState?.currentStreak || 0;

							if (currentStreak >= 7) {
								await userTask.update(
									{ status: "available" },
									{ transaction: t }
								);
								updatedTask.status = "available";

								logger.debug("Weekly login task unlocked", {
									userId,
									taskSlug: taskTemplate.slug,
									currentStreak,
								});
							}
						} else if (taskTemplate.slug === "upgrade_galaxy") {
							// Проверяем задачу улучшения галактики
							// Пока что всегда разблокируем (можно добавить проверку на наличие улучшений)
							await userTask.update(
								{ status: "available" },
								{ transaction: t }
							);
							updatedTask.status = "available";

							logger.debug("Galaxy upgrade task unlocked", {
								userId,
								taskSlug: taskTemplate.slug,
							});
						} else if (taskTemplate.slug === "share_galaxy") {
							// Проверяем задачу поделиться галактикой
							// Пока что всегда разблокируем (можно добавить проверку на факт шаринга)
							await userTask.update(
								{ status: "available" },
								{ transaction: t }
							);
							updatedTask.status = "available";

							logger.debug("Galaxy share task unlocked", {
								userId,
								taskSlug: taskTemplate.slug,
							});
						} else if (taskTemplate.slug.startsWith("scan_galaxy_")) {
							// Проверяем задачи сканирования галактики
							const requiredScans = parseInt(
								taskTemplate.slug.split("_")[2]
							);

							// Получаем количество сканирований из userState
							const scanCount = userState?.galaxyScans || 0;

							if (scanCount >= requiredScans) {
								await userTask.update(
									{ status: "available" },
									{ transaction: t }
								);
								updatedTask.status = "available";

								logger.debug("Galaxy scan task unlocked", {
									userId,
									taskSlug: taskTemplate.slug,
									requiredScans,
									scanCount,
								});
							}
						} else {
							// Для других не-ежедневных задач - разблокируем все
							await userTask.update(
								{ status: "available" },
								{ transaction: t }
							);
							updatedTask.status = "available";
						}
					} else if (userTask.status === "available") {
						// Проверяем, не нужно ли заблокировать задачу обратно
						if (taskTemplate.slug.startsWith("create_stars_")) {
							const userStars = userState?.stars || 0;
							const requiredStars = parseInt(
								taskTemplate.slug.split("_")[2]
							);

							if (userStars < requiredStars) {
								// Блокируем задачу обратно
								await userTask.update(
									{ status: "locked" },
									{ transaction: t }
								);
								updatedTask.status = "locked";

								logger.debug("Stars creation task locked", {
									userId,
									taskSlug: taskTemplate.slug,
									requiredStars,
									userStars,
								});
							}
						} else if (taskTemplate.slug.startsWith("own_galaxies_")) {
							const galaxiesResult =
								await galaxyService.getUserGalaxies(userId);
							const userGalaxiesCount = galaxiesResult.galaxies
								? galaxiesResult.galaxies.length
								: 0;
							const requiredGalaxies = parseInt(
								taskTemplate.slug.split("_")[2]
							);

							if (userGalaxiesCount < requiredGalaxies) {
								await userTask.update(
									{ status: "locked" },
									{ transaction: t }
								);
								updatedTask.status = "locked";

								logger.debug("Galaxy ownership task locked", {
									userId,
									taskSlug: taskTemplate.slug,
									requiredGalaxies,
									userGalaxiesCount,
								});
							}
						} else if (taskTemplate.slug === "weekly_login") {
							const currentStreak = userState?.currentStreak || 0;

							if (currentStreak < 7) {
								await userTask.update(
									{ status: "locked" },
									{ transaction: t }
								);
								updatedTask.status = "locked";

								logger.debug("Weekly login task locked", {
									userId,
									taskSlug: taskTemplate.slug,
									currentStreak,
								});
							}
						} else if (taskTemplate.slug.startsWith("scan_galaxy_")) {
							const requiredScans = parseInt(
								taskTemplate.slug.split("_")[2]
							);
							const scanCount = userState?.galaxyScans || 0;

							if (scanCount < requiredScans) {
								await userTask.update(
									{ status: "locked" },
									{ transaction: t }
								);
								updatedTask.status = "locked";

								logger.debug("Galaxy scan task locked", {
									userId,
									taskSlug: taskTemplate.slug,
									requiredScans,
									scanCount,
								});
							}
						}
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
					taskTemplateId: taskTemplate.slug,
					active: true,
					status: {
						[Op.in]: ["locked", "available"],
					},
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
					taskTemplateId: taskTemplate.slug,
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

			// Проверяем, что задача доступна для выполнения
			if (userTask.status === "locked") {
				logger.debug("completeTask - task is locked", {
					userId,
					slug,
				});
				throw ApiError.BadRequest(
					`Task is locked and not available for completion: ${slug}`,
					ERROR_CODES.TASK.TASK_LOCKED
				);
			}

			// Проверяем условия выполнения задачи
			const canComplete = await this.checkTaskCompletionConditions(
				userId,
				userTask,
				taskTemplate,
				t
			);

			if (!canComplete) {
				logger.debug("completeTask - task conditions not met", {
					userId,
					slug,
				});
				throw ApiError.BadRequest(
					`Task conditions not met for completion: ${slug}`,
					ERROR_CODES.TASK.TASK_CONDITIONS_NOT_MET
				);
			}

			// Помечаем задачу как завершенную
			const now = new Date();
			userTask.status = "completed";
			userTask.completedAt = now;
			await userTask.save({ transaction: t });

			// Для ежедневных заданий увеличиваем streak
			if (taskTemplate.isDaily) {
				const userState = await UserState.findOne({
					where: { userId },
					transaction: t,
				});

				if (userState) {
					const newStreak = (userState.currentStreak || 0) + 1;
					const currentMaxStreak = userState.maxStreak || 0;

					// Обновляем maxStreak если новый streak больше
					const updateData = { currentStreak: newStreak };
					if (newStreak > currentMaxStreak) {
						updateData.maxStreak = newStreak;
					}

					await userState.update(updateData, { transaction: t });

					logger.debug("Daily task completed - streak increased", {
						userId,
						slug,
						previousStreak: userState.currentStreak,
						newStreak,
						maxStreak:
							newStreak > currentMaxStreak
								? newStreak
								: currentMaxStreak,
						maxStreakUpdated: newStreak > currentMaxStreak,
					});
				}
			}

			// Определяем тип транзакции в зависимости от типа задания
			let txType = "TASK_REWARD";
			let metadata = {};
			let reward = taskTemplate.reward;

			if (taskTemplate.isDaily || taskTemplate.slug === "daily_login") {
				txType = "DAILY_TASK_REWARD";

				// Получаем актуальный streak после обновления
				const userStateUpdated = await UserState.findOne({
					where: { userId },
					transaction: t,
				});

				// Для ежедневных заданий пересчитываем награду на основе НОВОГО streak
				if (userStateUpdated) {
					const newStreak = userStateUpdated.currentStreak;

					// Пересчитываем награду для текущего дня (который только что выполнили)
					reward = this.calculateDailyReward(taskTemplate, newStreak);

					// Добавляем информацию о дне стрика в метаданные
					metadata = {
						streakDay: newStreak,
						taskSlug: taskTemplate.slug,
					};

					logger.debug(
						"Daily task reward recalculated after streak update",
						{
							userId,
							slug: taskTemplate.slug,
							newStreak,
							calculatedReward: reward,
						}
					);
				}
			}

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
				txType: txType,
				metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
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
				txType: txType,
				metadata: metadata,
				marketResult: result,
			});

			return {
				success: true,
				userTask,
				userState: userState,
				marketResult: result,
				rewards: reward, // Добавляем награды для клиента
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
					taskTemplateId: taskTemplate.slug,
					active: true,
				},
			});

			if (!userTask) {
				logger.debug("getTaskStatus - user task not found", {
					userId,
					slug,
					taskTemplateId: taskTemplate.slug,
				});
				throw ApiError.BadRequest(
					`User task not found for template: ${slug}`,
					ERROR_CODES.TASK.TASK_NOT_FOUND
				);
			}

			const result = {
				taskId: taskTemplate.slug,
				slug: taskTemplate.slug,
				status: userTask.status,
				active: userTask.active,
				completedAt: userTask.completedAt,
				sortOrder: userTask.tasktemplate.sortOrder,
				reward: userTask.tasktemplate.reward,
				condition: userTask.tasktemplate.condition,
				icon: userTask.tasktemplate.icon,
				active: userTask.tasktemplate.active,
				sortOrder: userTask.tasktemplate.sortOrder,
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
	/**
	 * Проверяет условия выполнения задачи
	 * @param {number} userId - User ID
	 * @param {Object} userTask - User task instance
	 * @param {Object} taskTemplate - Task template
	 * @param {Transaction} transaction - Database transaction
	 * @returns {Promise<boolean>} - True if task can be completed
	 */
	async checkTaskCompletionConditions(
		userId,
		userTask,
		taskTemplate,
		transaction
	) {
		const t = transaction || (await sequelize.transaction());
		const shouldCommit = !transaction;

		try {
			const slug = taskTemplate.slug;

			// Проверяем задачи создания звезд
			if (slug.startsWith("create_stars_")) {
				// Получаем userState для проверки количества звезд
				const userState = await UserState.findOne({
					where: { userId },
					transaction: t,
				});

				const userStars = userState?.stars || 0;
				const requiredStars = parseInt(slug.split("_")[2]);

				logger.debug("Checking stars creation task conditions", {
					userId,
					slug,
					userStars,
					requiredStars,
					canComplete: userStars >= requiredStars,
				});

				return userStars >= requiredStars;
			}

			// Проверяем ежедневные задачи
			if (taskTemplate.isDaily || slug === "daily_login") {
				// Для ежедневных задач проверяем, что прошло достаточно времени
				const lastCompleted = userTask.completedAt;
				const now = new Date();

				if (lastCompleted) {
					const timeDiff = now.getTime() - lastCompleted.getTime();
					const hoursDiff = timeDiff / (1000 * 60 * 60);

					// Можно выполнять ежедневную задачу раз в 24 часа
					const canComplete = hoursDiff >= 24;

					logger.debug("Checking daily task conditions", {
						userId,
						slug,
						lastCompleted: lastCompleted?.toISOString(),
						hoursDiff,
						canComplete,
					});

					return canComplete;
				}

				// Если задача никогда не выполнялась, можно выполнить
				return true;
			}

			// Проверяем задачи улучшения галактики
			if (slug === "upgrade_galaxy") {
				// Пока что всегда разрешаем выполнение (можно добавить проверку на факт улучшения)
				logger.debug("Checking galaxy upgrade task conditions", {
					userId,
					slug,
					canComplete: true,
				});
				return true;
			}

			// Проверяем задачи поделиться галактикой
			if (slug === "share_galaxy") {
				// Пока что всегда разрешаем выполнение (можно добавить проверку на факт шаринга)
				logger.debug("Checking galaxy share task conditions", {
					userId,
					slug,
					canComplete: true,
				});
				return true;
			}

			// Проверяем задачи сканирования галактики
			if (slug.startsWith("scan_galaxy_")) {
				// Получаем userState для проверки количества сканирований
				const userState = await UserState.findOne({
					where: { userId },
					transaction: t,
				});

				const scanCount = userState?.galaxyScans || 0;
				const requiredScans = parseInt(slug.split("_")[2]);

				logger.debug("Checking galaxy scan task conditions", {
					userId,
					slug,
					scanCount,
					requiredScans,
					canComplete: scanCount >= requiredScans,
				});

				return scanCount >= requiredScans;
			}

			// Для других задач пока что разрешаем выполнение
			// Здесь можно добавить дополнительные проверки
			return true;
		} catch (err) {
			if (shouldCommit && !t.finished) {
				await t.rollback();
			}

			logger.error("Failed to check task completion conditions", {
				userId,
				slug: taskTemplate.slug,
				error: err.message,
				stack: err.stack,
			});

			throw err;
		} finally {
			if (shouldCommit && !t.finished) {
				await t.commit();
			}
		}
	}

	/**
	 * Проверяет условия разблокировки задачи на основе checkType
	 * @param {number} userId - User ID
	 * @param {Object} taskTemplate - Task template
	 * @param {Object} userState - User state
	 * @param {Transaction} transaction - Database transaction
	 * @returns {Promise<boolean>} - True if task can be unlocked
	 */
	async checkTaskUnlockCondition(userId, taskTemplate, userState, transaction) {
		const checkType = taskTemplate.checkType || "stardust_count";
		const slug = taskTemplate.slug;

		try {
			switch (checkType) {
				case "stars_count":
					// Проверка количества звезд пользователя
					const userStars = userState?.stars || 0;
					const requiredStars = parseInt(slug.split("_")[2]);
					return userStars >= requiredStars;

				case "stardust_count":
					// Проверка количества звездной пыли
					const userStardust = userState?.stardustCount || 0;
					const requiredStardust = parseInt(slug.split("_")[2]);
					return userStardust >= requiredStardust;

				case "dark_matter_count":
					// Проверка количества темной материи
					const userDarkMatter = userState?.darkMatterCount || 0;
					const requiredDarkMatter = parseInt(slug.split("_")[3]);
					return userDarkMatter >= requiredDarkMatter;

				case "galaxies_count":
					// Проверка количества галактик
					const galaxiesResult = await galaxyService.getUserGalaxies(
						userId
					);
					const userGalaxiesCount = galaxiesResult.galaxies
						? galaxiesResult.galaxies.length
						: 0;
					const requiredGalaxies = parseInt(slug.split("_")[2]);

					logger.debug("Checking galaxies count", {
						userId,
						slug,
						userGalaxiesCount,
						requiredGalaxies,
						canUnlock: userGalaxiesCount >= requiredGalaxies,
					});

					return userGalaxiesCount >= requiredGalaxies;

				case "scans_count":
					// Проверка количества сканирований галактики
					const scanCount = userState?.galaxyScans || 0;
					const requiredScans = parseInt(slug.split("_")[2]);
					return scanCount >= requiredScans;

				case "streak_count":
					// Проверка streak входа
					const currentStreak = userState?.currentStreak || 0;
					const requiredStreak = parseInt(slug.split("_")[2]) || 7;
					return currentStreak >= requiredStreak;

				case "daily_reset":
					// Для ежедневных задач проверяем время последнего выполнения
					return true; // Логика ежедневных задач обрабатывается отдельно

				case "galaxy_upgraded":
					// Проверка улучшения галактики (пока что всегда true)
					return true;

				case "galaxy_shared":
					// Проверка поделиться галактикой (пока что всегда true)
					return true;

				default:
					logger.warn("Unknown checkType", {
						userId,
						taskSlug: slug,
						checkType,
					});
					return false; // По умолчанию блокируем
			}
		} catch (error) {
			logger.error("Error checking task unlock condition", {
				userId,
				taskSlug: slug,
				checkType,
				error: error.message,
			});
			return false;
		}
	}
}

module.exports = new TaskService();
