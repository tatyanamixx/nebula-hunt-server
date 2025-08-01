const UserService = require('./service/user-service');

async function testClientResponseStructure() {
	// Функция для обработки BigInt при сериализации
	const bigIntReplacer = (key, value) => {
		if (typeof value === 'bigint') {
			return value.toString();
		}
		return value;
	};

	try {
		console.log('🧪 Тестирование структуры ответа для клиента...\n');

		// Генерируем уникальный ID для теста
		const testUserId = Math.floor(Math.random() * 1000000000) + 100000000;

		// Данные для регистрации
		const userData = {
			id: testUserId,
			username: 'clientuser',
			referral: '1234567890',
		};

		const galaxyData = {
			seed: `client_galaxy_${Date.now()}`,
			starMin: 100,
			starCurrent: 150,
			price: 100,
			particleCount: 100,
			onParticleCountChange: true,
			galaxyProperties: {
				name: 'Client Galaxy',
				type: 'spiral',
				color: '#4A90E2',
				size: 'medium',
				complexity: 0.7,
				description: 'A galaxy for client testing',
			},
		};

		console.log('🚀 Регистрируем пользователя...');
		const registrationResult = await UserService.login(
			userData.id,
			userData.username,
			userData.referral,
			galaxyData
		);

		console.log('🚀 Логинимся как существующий пользователь...');
		const loginResult = await UserService.login(
			userData.id,
			userData.username,
			userData.referral,
			galaxyData
		);

		// Создаем структурированный ответ для клиента
		const clientResponse = {
			success: true,
			message: 'Login successful',
			data: {
				// Аутентификация
				auth: {
					accessToken: loginResult.accessToken,
					refreshToken: loginResult.refreshToken,
					expiresAt: loginResult.expiresAt,
					user: {
						id: loginResult.user.id,
						role: loginResult.user.role,
					},
				},

				// Состояние пользователя
				userState: {
					id: loginResult.userState.id,
					userId: loginResult.userState.userId,
					resources: {
						stardust: loginResult.userState.stardust,
						darkMatter: loginResult.userState.darkMatter,
						stars: loginResult.userState.stars,
						lastDailyBonus: loginResult.userState.lastDailyBonus,
					},
					lockedResources: {
						stardust: loginResult.userState.lockedStardust,
						darkMatter: loginResult.userState.lockedDarkMatter,
						stars: loginResult.userState.lockedStars,
					},
					createdAt: loginResult.userState.createdAt,
					updatedAt: loginResult.userState.updatedAt,
				},

				// Галактики пользователя
				galaxies: loginResult.galaxies.map((galaxy) => ({
					id: galaxy.id,
					userId: galaxy.userId,
					starMin: galaxy.starMin,
					starCurrent: galaxy.starCurrent,
					price: galaxy.price,
					seed: galaxy.seed,
					particleCount: galaxy.particleCount,
					onParticleCountChange: galaxy.onParticleCountChange,
					galaxyProperties: galaxy.galaxyProperties,
					active: galaxy.active,
					createdAt: galaxy.createdAt,
					updatedAt: galaxy.updatedAt,
				})),

				// Артефакты пользователя
				artifacts: loginResult.artifacts.map((artifact) => ({
					id: artifact.id,
					userId: artifact.userId,
					// Добавьте другие поля артефакта по необходимости
				})),

				// Игровые данные
				gameData: {
					// Дерево улучшений
					upgradeTree: {
						initialized:
							loginResult.data.upgradeTree.initialized.map(
								(upgrade) => ({
									id: upgrade.id,
									userId: upgrade.userId,
									upgradeNodeTemplateId:
										upgrade.upgradeNodeTemplateId,
									level: upgrade.level,
									progress: upgrade.progress,
									targetProgress: upgrade.targetProgress,
									completed: upgrade.completed,
									progressHistory: upgrade.progressHistory,
									lastProgressUpdate:
										upgrade.lastProgressUpdate,
									stability: upgrade.stability,
									instability: upgrade.instability,
									slug: upgrade.slug,
									template: {
										id: upgrade.template.id,
										slug: upgrade.template.slug,
										name: upgrade.template.name,
										description:
											upgrade.template.description,
										maxLevel: upgrade.template.maxLevel,
										basePrice: upgrade.template.basePrice,
										effectPerLevel:
											upgrade.template.effectPerLevel,
										priceMultiplier:
											upgrade.template.priceMultiplier,
										currency: upgrade.template.currency,
										category: upgrade.template.category,
										icon: upgrade.template.icon,
										stability: upgrade.template.stability,
										instability:
											upgrade.template.instability,
										modifiers: upgrade.template.modifiers,
										active: upgrade.template.active,
										conditions: upgrade.template.conditions,
										delayedUntil:
											upgrade.template.delayedUntil,
										children: upgrade.template.children,
										weight: upgrade.template.weight,
										createdAt: upgrade.template.createdAt,
										updatedAt: upgrade.template.updatedAt,
									},
									createdAt: upgrade.createdAt,
									updatedAt: upgrade.updatedAt,
								})
							),
						activated: loginResult.data.upgradeTree.activated.map(
							(upgrade) => ({
								id: upgrade.id,
								userId: upgrade.userId,
								upgradeNodeTemplateId:
									upgrade.upgradeNodeTemplateId,
								level: upgrade.level,
								progress: upgrade.progress,
								targetProgress: upgrade.targetProgress,
								completed: upgrade.completed,
								progressHistory: upgrade.progressHistory,
								lastProgressUpdate: upgrade.lastProgressUpdate,
								stability: upgrade.stability,
								instability: upgrade.instability,
								slug: upgrade.slug,
								template: upgrade.template,
								createdAt: upgrade.createdAt,
								updatedAt: upgrade.updatedAt,
							})
						),
						total: loginResult.data.upgradeTree.total,
					},

					// События пользователя
					userEvents: {
						id: loginResult.data.userEvents.id,
						userId: loginResult.data.userEvents.userId,
						eventMultipliers:
							loginResult.data.userEvents.eventMultipliers,
						lastEventCheck:
							loginResult.data.userEvents.lastEventCheck,
						eventCooldowns:
							loginResult.data.userEvents.eventCooldowns,
						enabledTypes: loginResult.data.userEvents.enabledTypes,
						disabledEvents:
							loginResult.data.userEvents.disabledEvents,
						priorityEvents:
							loginResult.data.userEvents.priorityEvents,
						createdAt: loginResult.data.userEvents.createdAt,
						updatedAt: loginResult.data.userEvents.updatedAt,
					},

					// Задачи пользователя
					userTasks: {
						tasks: loginResult.data.userTasks.tasks.map((task) => ({
							id: task.id,
							userId: task.userId,
							taskTemplateId: task.taskTemplateId,
							completed: task.completed,
							reward: task.reward,
							active: task.active,
							completedAt: task.completedAt,
							slug: task.slug,
							task: {
								id: task.task.id,
								slug: task.task.slug,
								title: task.task.title,
								description: task.task.description,
								reward: task.task.reward,
								condition: task.task.condition,
								icon: task.task.icon,
								active: task.task.active,
								sortOrder: task.task.sortOrder,
								createdAt: task.task.createdAt,
								updatedAt: task.task.updatedAt,
							},
							createdAt: task.createdAt,
							updatedAt: task.updatedAt,
						})),
						reward: loginResult.data.userTasks.reward,
					},

					// Пакеты в магазине
					packageOffers: loginResult.data.packageOffers.map(
						(package) => ({
							id: package.id,
							userId: package.userId,
							packageTemplateId: package.packageTemplateId,
							amount: package.amount,
							resource: package.resource,
							price: package.price,
							currency: package.currency,
							status: package.status,
							isUsed: package.isUsed,
							isLocked: package.isLocked,
							package: {
								id: package.package.id,
								slug: package.package.slug,
								name: package.package.name,
								description: package.package.description,
								amount: package.package.amount,
								resource: package.package.resource,
								price: package.package.price,
								currency: package.package.currency,
								status: package.package.status,
								icon: package.package.icon,
								sortOrder: package.package.sortOrder,
								labelKey: package.package.labelKey,
								isPromoted: package.package.isPromoted,
								validUntil: package.package.validUntil,
								createdAt: package.package.createdAt,
								updatedAt: package.package.updatedAt,
							},
							createdAt: package.createdAt,
							updatedAt: package.updatedAt,
						})
					),
				},

				// Метаданные
				metadata: {
					galaxyCreated: loginResult.galaxyCreated,
					timestamp: new Date().toISOString(),
					version: '1.0.0',
				},
			},
		};

		console.log('\n📊 СТРУКТУРА ОТВЕТА ДЛЯ КЛИЕНТА:');
		console.log('='.repeat(80));
		console.log(JSON.stringify(clientResponse, bigIntReplacer, 2));
		console.log('='.repeat(80));

		console.log('\n📋 КРАТКОЕ ОПИСАНИЕ СТРУКТУРЫ:');
		console.log('✅ auth - данные аутентификации (токены, пользователь)');
		console.log(
			'✅ userState - состояние пользователя (ресурсы, заблокированные ресурсы)'
		);
		console.log('✅ galaxies - массив галактик пользователя');
		console.log('✅ artifacts - массив артефактов пользователя');
		console.log('✅ gameData - игровые данные:');
		console.log('   ├── upgradeTree - дерево улучшений');
		console.log('   ├── userEvents - настройки событий');
		console.log('   ├── userTasks - задачи пользователя');
		console.log('   └── packageOffers - пакеты в магазине');
		console.log('✅ metadata - метаданные ответа');

		console.log('\n🎉 Структура ответа готова для передачи в клиент!');
	} catch (error) {
		console.error('\n❌ Ошибка при тестировании:', error.message);
		console.error('Stack:', error.stack);
	}
}

testClientResponseStructure();
