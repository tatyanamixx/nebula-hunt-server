# Игровая механика

## Обзор

Nebulahunt - это космическая стратегия с элементами idle-геймплея, где игроки управляют галактиками, развивают экономику, выполняют задачи и участвуют в событиях. Документация описывает все игровые системы и механики.

## Основные игровые системы

### 1. Экономика

#### Ресурсы

**Звезды (Stars)**

-   Основной ресурс игры
-   Производятся галактиками автоматически
-   Используются для покупки галактик и апгрейдов
-   Формула производства: `базовая_производительность * множители * время`

**Звездная пыль (Stardust)**

-   Вторичный ресурс
-   Получается при выполнении задач и событий
-   Используется для покупки апгрейдов
-   Формула получения: `базовая_награда * множители * бонусы`

**Темная материя (Dark Matter)**

-   Премиум ресурс
-   Редкий ресурс для особых апгрейдов
-   Получается при выполнении сложных задач
-   Формула получения: `сложность_задачи * случайный_множитель`

#### Производство

```javascript
// Формула производства звезд
function calculateStarProduction(galaxies, multipliers) {
	let totalProduction = 0;

	galaxies.forEach((galaxy) => {
		const baseProduction = galaxy.starCurrent * 0.1; // 10% от текущих звезд
		const productionMultiplier = multipliers.production || 1.0;
		const galaxyEfficiency = galaxy.galaxyProperties.efficiency || 1.0;

		totalProduction +=
			baseProduction * productionMultiplier * galaxyEfficiency;
	});

	return totalProduction;
}

// Обновление производства каждую секунду
setInterval(() => {
	const production = calculateStarProduction(userGalaxies, userMultipliers);
	userState.state.totalStars += production;
}, 1000);
```

### 2. Галактики

#### Типы галактик

**Спиральная (Spiral)**

-   Базовая производительность: 100 звезд/сек
-   Эффективность: 1.0
-   Особенности: стабильное производство

**Эллиптическая (Elliptical)**

-   Базовая производительность: 150 звезд/сек
-   Эффективность: 0.8
-   Особенности: высокая производительность, низкая стабильность

**Неправильная (Irregular)**

-   Базовая производительность: 80 звезд/сек
-   Эффективность: 1.2
-   Особенности: высокая стабильность, низкая производительность

#### Свойства галактик

```javascript
const galaxyProperties = {
	type: 'spiral', // spiral, elliptical, irregular
	color: 'blue', // blue, red, green, yellow, purple
	size: 'medium', // small, medium, large
	features: {
		blackHole: true, // увеличивает производство на 50%
		nebula: false, // увеличивает стабильность на 30%
		asteroidBelt: true, // увеличивает эффективность на 20%
	},
	coordinates: {
		x: 100,
		y: 200,
		z: 50,
	},
	efficiency: 1.0, // множитель эффективности
	stability: 0.8, // уровень стабильности
};
```

#### Создание галактики

```javascript
function createGalaxy(userId, galaxyData) {
	const galaxy = {
		userId: userId,
		starMin: galaxyData.starMin || 100,
		starCurrent: galaxyData.starCurrent || 100,
		price: calculateGalaxyPrice(galaxyData),
		seed: generateUniqueSeed(),
		particleCount: galaxyData.particleCount || 100,
		galaxyProperties: generateGalaxyProperties(galaxyData.seed),
		active: true,
	};

	return galaxy;
}

function calculateGalaxyPrice(galaxyData) {
	const basePrice = 100;
	const sizeMultiplier = {
		small: 0.5,
		medium: 1.0,
		large: 2.0,
	};

	return basePrice * sizeMultiplier[galaxyData.size || 'medium'];
}
```

### 3. Система апгрейдов

#### Дерево апгрейдов

```javascript
const upgradeTree = {
	nodes: {
		star_production_1: {
			id: 'star_production_1',
			name: 'Star Production I',
			description: {
				en: 'Increase star production by 10%',
				ru: 'Увеличивает производство звезд на 10%',
			},
			maxLevel: 10,
			basePrice: 100,
			effectPerLevel: 0.1,
			category: 'production',
			children: ['star_production_2', 'efficiency_1'],
			requirements: { minStars: 100 },
		},
		efficiency_1: {
			id: 'efficiency_1',
			name: 'Efficiency I',
			description: {
				en: 'Increase galaxy efficiency by 5%',
				ru: 'Увеличивает эффективность галактик на 5%',
			},
			maxLevel: 5,
			basePrice: 150,
			effectPerLevel: 0.05,
			category: 'economy',
			children: ['efficiency_2'],
			requirements: {
				minStars: 200,
				requiredUpgrades: ['star_production_1'],
			},
		},
	},
	connections: [
		{ from: 'star_production_1', to: 'star_production_2' },
		{ from: 'star_production_1', to: 'efficiency_1' },
		{ from: 'efficiency_1', to: 'efficiency_2' },
	],
};
```

#### Покупка апгрейда

```javascript
function purchaseUpgrade(userId, upgradeId, level) {
	const upgrade = upgradeTree.nodes[upgradeId];
	const userState = getUserState(userId);

	// Проверка доступности
	if (!isUpgradeAvailable(userId, upgradeId)) {
		throw new Error('Upgrade not available');
	}

	// Расчет стоимости
	const cost = calculateUpgradeCost(upgrade, level);

	// Проверка ресурсов
	if (userState.state.stardustCount < cost) {
		throw new Error('Insufficient resources');
	}

	// Применение эффектов
	applyUpgradeEffects(userId, upgradeId, level);

	// Обновление прогресса
	updateUpgradeProgress(userId, upgradeId, level);

	// Активация новых узлов
	activateNewNodes(userId);

	return {
		success: true,
		cost,
		effects: getUpgradeEffects(upgradeId, level),
	};
}

function calculateUpgradeCost(upgrade, level) {
	return upgrade.basePrice * Math.pow(upgrade.priceMultiplier, level - 1);
}

function applyUpgradeEffects(userId, upgradeId, level) {
	const upgrade = upgradeTree.nodes[upgradeId];
	const effect = upgrade.effectPerLevel * level;

	switch (upgrade.category) {
		case 'production':
			userState.upgradeMultipliers.production += effect;
			break;
		case 'economy':
			userState.upgradeMultipliers.efficiency += effect;
			break;
		case 'special':
			applySpecialEffect(userId, upgradeId, effect);
			break;
	}
}
```

### 4. Система событий

#### Типы событий

**Случайные (RANDOM)**

-   Запускаются случайно с заданной вероятностью
-   Конфигурация: `{ chancePerHour: 0.1 }` - 10% в час

**Периодические (PERIODIC)**

-   Запускаются через определенные интервалы
-   Конфигурация: `{ interval: '1h' }` - каждый час

**Условные (CONDITIONAL)**

-   Запускаются при выполнении условий
-   Конфигурация: `{ condition: { metric: 'chaosLevel', op: '>', value: 50 } }`

**Цепочные (CHAINED)**

-   Запускаются после других событий
-   Конфигурация: `{ after: 'eventId' }`

#### Структура события

```javascript
const gameEvent = {
	id: 'star_storm',
	name: 'Star Storm',
	description: {
		en: 'Increased star production for 1 hour',
		ru: 'Увеличенное производство звезд на 1 час',
	},
	type: 'RANDOM',
	triggerConfig: {
		chancePerHour: 0.1,
		minInterval: 1800000, // 30 минут между событиями
	},
	effect: {
		type: 'multiplier',
		target: 'production',
		value: 2.0,
		duration: 3600000, // 1 час
		stackable: false,
	},
	conditions: {
		minStars: 100,
		maxActiveEvents: 3,
	},
};
```

#### Обработка событий

```javascript
function checkAndTriggerEvents(userId) {
	const userState = getUserState(userId);
	const activeEvents = userState.activeEvents;
	const availableEvents = getAvailableEvents();

	availableEvents.forEach((event) => {
		if (shouldTriggerEvent(event, userState)) {
			triggerEvent(event, userId);
		}
	});

	// Обновление активных событий
	updateActiveEvents(userId);

	// Расчет множителей
	calculateEventMultipliers(userId);
}

function shouldTriggerEvent(event, userState) {
	switch (event.type) {
		case 'RANDOM':
			return Math.random() < event.triggerConfig.chancePerHour / 3600;

		case 'PERIODIC':
			const lastTrigger = userState.eventCooldowns[event.id] || 0;
			return (
				Date.now() - lastTrigger >
				parseInterval(event.triggerConfig.interval)
			);

		case 'CONDITIONAL':
			return checkCondition(event.triggerConfig.condition, userState);

		default:
			return false;
	}
}

function triggerEvent(event, userId) {
	const userState = getUserState(userId);

	// Добавление события в активные
	userState.activeEvents.push({
		id: event.id,
		startTime: Date.now(),
		endTime: Date.now() + event.effect.duration,
		effect: event.effect,
	});

	// Установка кулдауна
	userState.eventCooldowns[event.id] = Date.now();

	// Применение эффектов
	applyEventEffects(userId, event.effect);

	// Логирование
	loggerService.info('Event triggered', { userId, eventId: event.id });
}
```

### 5. Система задач

#### Структура задачи

```javascript
const task = {
	id: 'first_steps',
	title: {
		en: 'First Steps',
		ru: 'Первые шаги',
	},
	description: {
		en: 'Produce 100 stars',
		ru: 'Произведите 100 звезд',
	},
	reward: {
		stardust: 50,
		experience: 10,
	},
	condition: {
		type: 'production',
		target: 'totalStars',
		operator: '>=',
		value: 100,
		timeLimit: 86400000, // 24 часа
	},
	icon: '⭐',
	category: 'tutorial',
	weight: 1,
};
```

#### Проверка выполнения задач

```javascript
function checkTaskProgress(userId) {
	const userState = getUserState(userId);
	const availableTasks = getAvailableTasks();

	availableTasks.forEach((task) => {
		if (isTaskCompleted(task, userState)) {
			completeTask(userId, task.id);
		} else {
			updateTaskProgress(userId, task.id);
		}
	});
}

function isTaskCompleted(task, userState) {
	const condition = task.condition;
	const currentValue = getCurrentValue(condition.target, userState);

	switch (condition.operator) {
		case '>=':
			return currentValue >= condition.value;
		case '>':
			return currentValue > condition.value;
		case '==':
			return currentValue === condition.value;
		case '<':
			return currentValue < condition.value;
		case '<=':
			return currentValue <= condition.value;
		default:
			return false;
	}
}

function getCurrentValue(target, userState) {
	switch (target) {
		case 'totalStars':
			return userState.state.totalStars;
		case 'stardustCount':
			return userState.state.stardustCount;
		case 'ownedGalaxiesCount':
			return userState.state.ownedGalaxiesCount;
		case 'chaosLevel':
			return userState.chaosLevel;
		case 'stabilityLevel':
			return userState.stabilityLevel;
		default:
			return 0;
	}
}

function completeTask(userId, taskId) {
	const task = getTask(taskId);
	const userState = getUserState(userId);

	// Выдача наград
	userState.state.stardustCount += task.reward.stardust;

	// Добавление в завершенные
	userState.completedTasks.push({
		id: taskId,
		completedAt: Date.now(),
	});

	// Удаление из активных
	userState.activeTasks = userState.activeTasks.filter((id) => id !== taskId);

	// Активация новых задач
	activateNewTasks(userId);

	// Логирование
	loggerService.info('Task completed', {
		userId,
		taskId,
		rewards: task.reward,
	});
}
```

### 6. Система стабильности и хаоса

#### Механика стабильности

```javascript
function calculateStability(userState) {
	let stability = 0.5; // базовая стабильность

	// Влияние апгрейдов
	const upgradeStability = calculateUpgradeStability(userState);
	stability += upgradeStability;

	// Влияние событий
	const eventStability = calculateEventStability(userState);
	stability += eventStability;

	// Влияние галактик
	const galaxyStability = calculateGalaxyStability(userState);
	stability += galaxyStability;

	// Ограничение значений
	return Math.max(0, Math.min(1, stability));
}

function calculateUpgradeStability(userState) {
	let stability = 0;

	Object.values(userState.userUpgrades).forEach((upgrade) => {
		if (upgrade.stability) {
			stability += upgrade.stability * upgrade.level;
		}
	});

	return stability;
}
```

#### Механика хаоса

```javascript
function calculateChaos(userState) {
	let chaos = 0.1; // базовая нестабильность

	// Влияние нестабильных апгрейдов
	const upgradeChaos = calculateUpgradeChaos(userState);
	chaos += upgradeChaos;

	// Влияние событий
	const eventChaos = calculateEventChaos(userState);
	chaos += eventChaos;

	// Случайные факторы
	const randomChaos = Math.random() * 0.05;
	chaos += randomChaos;

	// Ограничение значений
	return Math.max(0, Math.min(1, chaos));
}
```

### 7. Система достижений

#### Типы достижений

```javascript
const achievements = {
	first_galaxy: {
		id: 'first_galaxy',
		title: { en: 'First Galaxy', ru: 'Первая галактика' },
		description: {
			en: 'Own your first galaxy',
			ru: 'Владейте своей первой галактикой',
		},
		condition: { type: 'count', target: 'ownedGalaxiesCount', value: 1 },
		reward: { stardust: 100, icon: '🌌' },
	},
	star_collector: {
		id: 'star_collector',
		title: { en: 'Star Collector', ru: 'Собиратель звезд' },
		description: { en: 'Collect 1000 stars', ru: 'Соберите 1000 звезд' },
		condition: { type: 'production', target: 'totalStars', value: 1000 },
		reward: { stardust: 500, icon: '⭐' },
	},
	upgrade_master: {
		id: 'upgrade_master',
		title: { en: 'Upgrade Master', ru: 'Мастер апгрейдов' },
		description: {
			en: 'Complete 10 upgrades',
			ru: 'Завершите 10 апгрейдов',
		},
		condition: { type: 'count', target: 'completedUpgrades', value: 10 },
		reward: { stardust: 1000, icon: '⚡' },
	},
};
```

### 8. Формулы и расчеты

#### Производство ресурсов

```javascript
// Производство звезд
function calculateStarProduction(galaxies, multipliers, timeDelta) {
	let totalProduction = 0;

	galaxies.forEach((galaxy) => {
		if (!galaxy.active) return;

		const baseProduction = galaxy.starCurrent * 0.1; // 10% от текущих звезд
		const productionMultiplier = multipliers.production || 1.0;
		const efficiencyMultiplier = multipliers.efficiency || 1.0;
		const galaxyEfficiency = galaxy.galaxyProperties.efficiency || 1.0;

		const production =
			baseProduction *
			productionMultiplier *
			efficiencyMultiplier *
			galaxyEfficiency;
		totalProduction += production * (timeDelta / 1000); // конвертация в секунды
	});

	return totalProduction;
}

// Получение звездной пыли
function calculateStardustGain(baseReward, multipliers, bonuses) {
	const rewardMultiplier = multipliers.rewards || 1.0;
	const bonusMultiplier = bonuses.stardust || 1.0;

	return Math.floor(baseReward * rewardMultiplier * bonusMultiplier);
}
```

#### Стоимость апгрейдов

```javascript
function calculateUpgradeCost(upgrade, currentLevel, userMultipliers) {
	const baseCost = upgrade.basePrice;
	const levelMultiplier = Math.pow(upgrade.priceMultiplier, currentLevel);
	const costMultiplier = userMultipliers.cost || 1.0;

	return Math.floor(baseCost * levelMultiplier * costMultiplier);
}

function calculateGalaxyPrice(basePrice, size, features) {
	const sizeMultiplier = {
		small: 0.5,
		medium: 1.0,
		large: 2.0,
	};

	const featureMultiplier =
		Object.values(features).filter(Boolean).length * 0.2 + 1;

	return Math.floor(basePrice * sizeMultiplier[size] * featureMultiplier);
}
```

#### Время и интервалы

```javascript
function parseInterval(interval) {
	const units = {
		s: 1000,
		m: 60 * 1000,
		h: 60 * 60 * 1000,
		d: 24 * 60 * 60 * 1000,
	};

	const match = interval.match(/^(\d+)([smhd])$/);
	if (!match) return 0;

	const value = parseInt(match[1]);
	const unit = match[2];

	return value * units[unit];
}

function formatTime(ms) {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days}d ${hours % 24}h`;
	if (hours > 0) return `${hours}h ${minutes % 60}m`;
	if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
	return `${seconds}s`;
}
```

### 9. Баланс игры

#### Прогрессия

```javascript
const progressionCurve = {
	// Стоимость галактик растет экспоненциально
	galaxyPrice: (count) => Math.floor(100 * Math.pow(1.5, count)),

	// Производство звезд растет линейно
	starProduction: (galaxies) =>
		galaxies.reduce((sum, g) => sum + g.starCurrent * 0.1, 0),

	// Стоимость апгрейдов растет степенно
	upgradePrice: (basePrice, level) =>
		Math.floor(basePrice * Math.pow(1.3, level - 1)),

	// Награды за задачи растут логарифмически
	taskReward: (difficulty) => Math.floor(50 * Math.log(difficulty + 1)),
};
```

#### Множители

```javascript
const multiplierCaps = {
	production: 10.0, // максимальный множитель производства
	efficiency: 5.0, // максимальный множитель эффективности
	rewards: 3.0, // максимальный множитель наград
	cost: 0.5, // минимальный множитель стоимости
};

function applyMultiplierCap(multiplier, cap) {
	return Math.min(multiplier, cap);
}
```

---

Эта документация описывает все основные игровые механики Nebulahunt, обеспечивая понимание того, как работают различные системы игры и как они взаимодействуют друг с другом.
