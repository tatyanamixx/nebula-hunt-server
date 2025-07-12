# API Документация

## Общая информация

### Базовый URL

```
https://your-server.com/api
```

### Автоматическая инициализация

При запуске сервера автоматически выполняются следующие операции:

1. **Инициализация комиссий маркета**

    - Комиссии загружаются из `config/market.config.js`
    - Создаются записи в таблице `marketcommission`
    - Текущие комиссии:
        - stardust: 5%
        - darkMatter: 7%
        - tgStars: 3%
        - tonToken: 10%

2. **Создание системного пользователя**

    - ID: -1 (или из переменной окружения SYSTEM_USER_ID)
    - Username: 'SYSTEM'
    - Role: 'SYSTEM'
    - Создается UserState с нулевыми балансами для всех валют

3. **Синхронизация базы данных**
    - Создание всех необходимых таблиц
    - Применение миграций

**Примечание:** Все операции выполняются автоматически при каждом запуске сервера. Ручная инициализация не требуется.

### Конфигурация

#### Комиссии маркета (`config/market.config.js`)

```javascript
module.exports = {
	commission: {
		stardust: 0.05, // 5%
		darkMatter: 0.07, // 7%
		tgStars: 0.03, // 3%
		tonToken: 0.1, // 10%
	},
};
```

#### Системный пользователь и игровые настройки (`config/constants.js`)

```javascript
// Системный пользователь
const SYSTEM_USER_ID = -1;

// Игровые настройки
const DAILY_BONUS_STARDUST = 50;
const DAILY_BONUS_DARK_MATTER = 5;
const GALAXY_BASE_PRICE = 100;
const ARTIFACT_DROP_RATE = 0.1;

// Другие константы
const LEADERBOARD_LIMIT = 100;
```

**Переменные окружения:**

-   `SYSTEM_USER_ID` - ID системного пользователя (по умолчанию: -1)

**Игровые настройки (теперь в constants.js):**

-   `DAILY_BONUS_STARDUST` - Базовая награда звездной пыли за ежедневный бонус (50)
-   `DAILY_BONUS_DARK_MATTER` - Базовая награда темной материи за ежедневный бонус (5)
-   `GALAXY_BASE_PRICE` - Базовая цена галактики (100)
-   `ARTIFACT_DROP_RATE` - Шанс выпадения артефакта (0.1 = 10%)

**Внешние сервисы (переменные окружения):**

-   `TON_NETWORK` - Сеть TON (testnet/mainnet)
-   `TON_API_KEY` - API ключ для доступа к TON API
-   `TON_WALLET_ADDRESS` - Адрес кошелька для транзакций

**Настройка по окружениям:**

-   **Разработка/Тесты**: testnet с тестовыми ключами
-   **Продакшен**: mainnet с реальными ключами

### Аутентификация

Все запросы (кроме регистрации) требуют аутентификации через Telegram Mini Apps и JWT токен. Токен передается в заголовке `Authorization: Bearer <token>`.

**Порядок middleware для защищенных роутов:**

1. `tmaMiddleware` - проверка Telegram Mini Apps
2. `authMiddleware` - JWT авторизация
3. `rateLimitMiddleware` - ограничение частоты запросов
4. `adminMiddleware` - проверка админ прав (только для админ роутов)

### Формат ответов

Все ответы возвращаются в формате JSON с следующей структурой:

**Успешный ответ:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Операция выполнена успешно"
}
```

**Ошибка:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Описание ошибки",
    "details": { ... }
  }
}
```

### Коды ошибок

-   `400` - Bad Request (неверные данные)
-   `401` - Unauthorized (не авторизован)
-   `403` - Forbidden (нет прав)
-   `404` - Not Found (не найдено)
-   `429` - Too Many Requests (превышен лимит запросов)
-   `500` - Internal Server Error (внутренняя ошибка сервера)

## Аутентификация

### Регистрация пользователя

**POST** `/auth/registration`

Создает нового пользователя в системе.

**Тело запроса:**

```json
{
	"referral": 123456,
	"userState": {
		"state": {
			"totalStars": 100,
			"stardustCount": 0,
			"darkMatterCount": 0,
			"ownedGalaxiesCount": 1,
			"ownedNodesCount": 0
		}
	},
	"galaxies": [
		{
			"starMin": 100,
			"starCurrent": 100,
			"seed": "galaxy_seed_1",
			"particleCount": 100
		}
	]
}
```

**Ответ:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123456,
    "username": "player1",
    "referral": 0,
    "role": "USER",
    "blocked": false,
    "tonWallet": null
  },
  "userState": {
    "id": 1,
    "userId": 123456,
    "state": { ... },
    "chaosLevel": 0.0,
    "stabilityLevel": 0.0
  },
  "userGalaxies": [
    {
      "id": 1,
      "userId": 123456,
      "starMin": 100,
      "starCurrent": 100,
      "price": 100,
      "seed": "galaxy_seed_1",
      "particleCount": 100
    }
  ],
  "upgradeNodes": []
}
```

### Вход в систему

**POST** `/auth/login`

Вход существующего пользователя. Требует TMA, JWT авторизации и rate limiting (30 запросов в минуту).

**Тело запроса:**

```json
{}
```

**Ответ:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123456,
    "username": "player1",
    "role": "USER"
  },
  "userState": { ... },
  "userGalaxies": [ ... ],
  "eventState": { ... },
  "upgradeNodes": [ ... ]
}
```

### Выход из системы

**POST** `/auth/logout`

Выход пользователя из системы. Требует TMA, JWT авторизации и rate limiting (20 запросов в минуту).

**Ответ:**

```json
{
	"message": "Successfully logged out"
}
```

### Обновление токенов

**GET** `/auth/refresh`

Обновляет access token используя refresh token. Требует TMA, JWT авторизации и rate limiting (30 запросов в минуту).

**Ответ:**

```json
{
	"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	"user": {
		"id": 123456,
		"username": "player1",
		"role": "USER"
	}
}
```

### Получение списка друзей

**GET** `/auth/friends`

Получает список пользователей, которые зарегистрировались по реферальной ссылке текущего пользователя. Требует TMA, JWT авторизации и rate limiting (60 запросов в минуту).

**Ответ:**

```json
[
	{
		"id": 789012,
		"username": "friend1",
		"referral": 123456,
		"userstate": {
			"state": {
				"totalStars": 150,
				"stardustCount": 25
			}
		}
	}
]
```

### Получение таблицы лидеров

**GET** `/state/leaderboard`

Получает таблицу лидеров с топ-N пользователями (где N = LEADERBOARD_LIMIT из конфигурации, по умолчанию 100) и позицией текущего пользователя. Если текущий пользователь не входит в топ, его данные добавляются в конец списка. Требует TMA, JWT авторизации и rate limiting (60 запросов в минуту).

**Ответ:**

```json
{
	"leaderboard": [
		{
			"userId": 123,
			"state": {
				"totalStars": 1000,
				"stardustCount": 500,
				"darkMatterCount": 100
			},
			"currentStreak": 5,
			"maxStreak": 10,
			"updatedAt": "2025-07-10T12:55:41.000Z",
			"User": {
				"username": "user1"
			},
			"rating": 1
		},
		// ... другие пользователи из топа (всего LEADERBOARD_LIMIT записей)

		// Если запрашивающий пользователь не входит в топ,
		// его данные будут добавлены в конец списка:
		{
			"userId": 456,
			"state": {
				"totalStars": 50,
				"stardustCount": 20,
				"darkMatterCount": 5
			},
			"currentStreak": 2,
			"maxStreak": 3,
			"updatedAt": "2025-07-09T10:30:00.000Z",
			"User": {
				"username": "currentUser"
			},
			"rating": 120
		}
	],
	"userRating": 120
}
```

### Получение системного пользователя

**GET** `/auth/system-user`

Получает информацию о системном пользователе.

**Ответ:**

```json
{
	"id": -1,
	"username": "SYSTEM",
	"referral": 0,
	"role": "SYSTEM",
	"blocked": false
}
```

## Административные функции

### Список пользователей

**GET** `/admin/users`

Получает список всех пользователей (только для администраторов). Требует JWT авторизации, админ прав и rate limiting (30 запросов в минуту).

**Параметры запроса:**

-   `page` (number) - номер страницы (по умолчанию: 1)
-   `limit` (number) - количество записей на странице (по умолчанию: 20)
-   `search` (string) - поиск по имени пользователя

**Ответ:**

```json
{
	"users": [
		{
			"id": 123456,
			"username": "player1",
			"referral": 0,
			"role": "USER",
			"blocked": false,
			"createdAt": "2024-01-01T00:00:00.000Z"
		}
	],
	"pagination": {
		"page": 1,
		"limit": 20,
		"total": 100,
		"pages": 5
	}
}
```

### Блокировка пользователя

**POST** `/admin/block-user`

Блокирует пользователя (только для администраторов). Требует JWT авторизации, админ прав и rate limiting (20 запросов в минуту).

**Тело запроса:**

```json
{
	"userId": 123456,
	"reason": "Нарушение правил"
}
```

**Ответ:**

```json
{
	"message": "User blocked successfully",
	"user": {
		"id": 123456,
		"username": "player1",
		"blocked": true
	}
}
```

### Разблокировка пользователя

**POST** `/admin/unblock-user`

Разблокирует пользователя (только для администраторов). Требует JWT авторизации, админ прав и rate limiting (20 запросов в минуту).

**Тело запроса:**

```json
{
	"userId": 123456
}
```

**Ответ:**

```json
{
	"message": "User unblocked successfully",
	"user": {
		"id": 123456,
		"username": "player1",
		"blocked": false
	}
}
```

### Инициализация оферт пакетов

**POST** `/admin/initialize-package-offers`

Создает оферты для всех активных пакетов в PackageStore (только для администраторов). Требует JWT авторизации, админ прав и rate limiting (10 запросов в минуту).

**Тело запроса:**

```json
{}
```

**Ответ:**

```json
{
	"message": "Successfully initialized 5 package offers",
	"createdOffers": [
		{
			"packageId": "starter_pack",
			"offerId": 1,
			"price": 10.0,
			"currency": "tgStars",
			"amount": 1000,
			"currencyGame": "stardust"
		},
		{
			"packageId": "premium_pack",
			"offerId": 2,
			"price": 45.0,
			"currency": "tgStars",
			"amount": 5000,
			"currencyGame": "stardust"
		}
	],
	"totalPackages": 5
}
```

## Галактики

### Получение галактик пользователя

**GET** `/galaxy`

Получает все галактики текущего пользователя. Требует TMA, JWT авторизации и rate limiting (60 запросов в минуту).

**Ответ:**

```json
[
	{
		"id": 1,
		"userId": 123456,
		"starMin": 100,
		"starCurrent": 150,
		"price": 100,
		"seed": "galaxy_seed_1",
		"particleCount": 100,
		"onParticleCountChange": true,
		"galaxyProperties": {
			"type": "spiral",
			"color": "blue",
			"size": "medium"
		},
		"active": true,
		"createdAt": "2024-01-01T00:00:00.000Z"
	}
]
```

### Создание новой галактики

**POST** `/galaxy`

Создает новую галактику для пользователя. Требует TMA, JWT авторизации и rate limiting (10 запросов в минуту).

**Тело запроса:**

```json
{
	"starMin": 200,
	"starCurrent": 200,
	"price": 200,
	"seed": "new_galaxy_seed",
	"particleCount": 150,
	"galaxyProperties": {
		"type": "elliptical",
		"color": "red",
		"size": "large"
	}
}
```

**Ответ:**

```json
{
	"id": 2,
	"userId": 123456,
	"starMin": 200,
	"starCurrent": 200,
	"price": 200,
	"seed": "new_galaxy_seed",
	"particleCount": 150,
	"galaxyProperties": {
		"type": "elliptical",
		"color": "red",
		"size": "large"
	},
	"active": true
}
```

### Обновление галактики

**PUT** `/galaxy/:id`

Обновляет существующую галактику. Требует TMA, JWT авторизации и rate limiting (30 запросов в минуту).

**Тело запроса:**

```json
{
	"starCurrent": 180,
	"particleCount": 120
}
```

**Ответ:**

```json
{
	"id": 1,
	"starCurrent": 180,
	"particleCount": 120,
	"updatedAt": "2024-01-01T12:00:00.000Z"
}
```

### Удаление галактики

**DELETE** `/galaxy/:id`

Удаляет галактику пользователя.

**Ответ:**

```json
{
	"message": "Galaxy deleted successfully"
}
```

## Состояние пользователя

### Получение состояния пользователя

**GET** `/state`

Получает текущее состояние пользователя в игре.

**Ответ:**

```json
{
	"id": 1,
	"userId": 123456,
	"state": {
		"totalStars": 1000,
		"stardustCount": 150,
		"darkMatterCount": 25,
		"ownedGalaxiesCount": 3,
		"ownedNodesCount": 5
	},
	"chaosLevel": 0.3,
	"stabilityLevel": 0.7,
	"entropyVelocity": 0.1,
	"taskProgress": {
		"completedTasks": ["task_1", "task_2"],
		"currentWeight": 15,
		"unlockedNodes": ["node_1", "node_2"]
	},
	"upgradeTree": {
		"activeNodes": ["upgrade_1", "upgrade_2"],
		"completedNodes": ["upgrade_3"],
		"nodeStates": {
			"upgrade_1": { "level": 2, "progress": 0.5 }
		},
		"totalProgress": 25
	},
	"lastLoginDate": "2024-01-01",
	"currentStreak": 5,
	"maxStreak": 10,
	"activeEvents": [],
	"eventMultipliers": {
		"production": 1.0,
		"chaos": 1.0,
		"stability": 1.0,
		"entropy": 1.0,
		"rewards": 1.0
	}
}
```

### Обновление состояния пользователя

**PUT** `/state`

Обновляет состояние пользователя.

**Тело запроса:**

```json
{
	"state": {
		"totalStars": 1100,
		"stardustCount": 200
	},
	"chaosLevel": 0.4,
	"stabilityLevel": 0.6
}
```

**Ответ:**

```json
{
	"message": "State updated successfully",
	"updatedFields": ["state", "chaosLevel", "stabilityLevel"]
}
```

## История состояний

### Получение истории изменений

**GET** `/history`

Получает историю изменений состояния пользователя.

**Параметры запроса:**

-   `page` (number) - номер страницы
-   `limit` (number) - количество записей на странице
-   `type` (string) - фильтр по типу изменения
-   `category` (string) - фильтр по категории

**Ответ:**

```json
{
	"entries": [
		{
			"timestamp": "2024-01-01T12:00:00.000Z",
			"type": "state_change",
			"category": "production",
			"description": "Звезды произведены",
			"changes": {
				"totalStars": {
					"oldValue": 1000,
					"newValue": 1100
				}
			},
			"metadata": {
				"source": "automatic",
				"trigger": "production_tick"
			}
		}
	],
	"pagination": {
		"page": 1,
		"limit": 20,
		"total": 150,
		"pages": 8
	}
}
```

## Upgrades API

### Get All User Upgrade Nodes

```
GET /upgrades/nodes
```

Returns all upgrade nodes available to the user.

### Get User Upgrade Node

```
GET /upgrades/nodes/:nodeId
```

Returns details of a specific upgrade node for the user.

### Complete Upgrade Node

```
POST /upgrades/complete
```

Marks an upgrade node as completed.

**Request Body:**

```json
{
	"nodeId": "string"
}
```

### Update Upgrade Progress

```
POST /upgrades/progress
```

Updates progress for an upgrade node.

**Request Body:**

```json
{
	"nodeId": "string",
	"progress": 10
}
```

### Get Upgrade Progress

```
GET /upgrades/progress/:nodeId
```

Returns progress details for a specific upgrade node.

### Initialize User Upgrade Tree

```
POST /upgrades/initialize
```

Initializes the upgrade tree for a user.

### Get User Upgrade Stats

```
GET /upgrades/stats
```

Returns statistics about user's upgrades.

## Tasks API

### Get All User Tasks

```
GET /tasks
```

Returns all tasks available to the user.

### Get User Task

```
GET /tasks/:taskId
```

Returns details of a specific task for the user.

### Complete Task

```
POST /tasks/complete
```

Marks a task as completed.

**Request Body:**

```json
{
	"taskId": "string"
}
```

### Update Task Progress

```
POST /tasks/progress
```

Updates progress for a task.

**Request Body:**

```json
{
	"taskId": "string",
	"progress": 10
}
```

### Get Task Progress

```
GET /tasks/progress/:taskId
```

Returns progress details for a specific task.

### Initialize User Tasks

```
POST /tasks/initialize
```

Initializes tasks for a user.

### Get User Task Stats

```
GET /tasks/stats
```

Returns statistics about user's tasks.

## Events API

### Get All User Events

```
GET /events
```

Returns all events for the user.

### Get User Event

```
GET /events/:eventId
```

Returns details of a specific event for the user.

### Trigger Event

```
POST /events/trigger
```

Triggers a specific event for the user.

**Request Body:**

```json
{
	"eventId": "string"
}
```

### Get User Event Settings

```
GET /events/settings
```

Returns event settings for the user.

### Update User Event Settings

```
PUT /events/settings
```

Updates event settings for the user.

**Request Body:**

```json
{
	"enabledTypes": ["RANDOM", "PERIODIC", "CONDITIONAL"],
	"disabledEvents": ["event1", "event2"]
}
```

### Initialize User Events

```
POST /events/initialize
```

Initializes events for a user.

### Get User Event Stats

```
GET /events/stats
```

Returns statistics about user's events.

## Обработка ошибок

### Примеры ошибок

**400 Bad Request:**

```json
{
	"success": false,
	"error": {
		"code": "VALIDATION_ERROR",
		"message": "Invalid input data",
		"details": {
			"field": "username",
			"value": "",
			"constraint": "required"
		}
	}
}
```

**401 Unauthorized:**

```json
{
	"success": false,
	"error": {
		"code": "UNAUTHORIZED",
		"message": "Authentication required"
	}
}
```

**403 Forbidden:**

```json
{
	"success": false,
	"error": {
		"code": "FORBIDDEN",
		"message": "Access denied. Admin role required"
	}
}
```

**429 Too Many Requests:**

```json
{
	"success": false,
	"error": {
		"code": "RATE_LIMIT_EXCEEDED",
		"message": "Too many requests. Try again later.",
		"details": {
			"retryAfter": 60
		}
	}
}
```

**500 Internal Server Error:**

```json
{
	"success": false,
	"error": {
		"code": "INTERNAL_ERROR",
		"message": "Internal server error"
	}
}
```

## Артефакты

### Получение артефактов пользователя

**GET** `/artifact/artifact`

Получает список артефактов текущего пользователя. Требует TMA, JWT авторизации и rate limiting (60 запросов в минуту).

**Ответ:**

```json
[
	{
		"id": 1,
		"userId": 123456,
		"seed": "artifact_seed_1",
		"name": "Legendary Sword",
		"description": "A powerful legendary sword",
		"rarity": "legendary",
		"image": "sword.png",
		"effects": {
			"damage": 100,
			"durability": 1000
		},
		"tradable": true,
		"createdAt": "2024-01-01T12:00:00.000Z"
	}
]
```

### Добавление артефакта пользователю

**POST** `/artifact/artifact`

Добавляет новый артефакт текущему пользователю. Требует TMA, JWT авторизации и rate limiting (10 запросов в минуту).

**Тело запроса:**

```json
{
	"seed": "artifact_seed_1",
	"name": "Legendary Sword",
	"description": "A powerful legendary sword",
	"rarity": "legendary",
	"image": "sword.png",
	"effects": {
		"damage": 100,
		"durability": 1000
	},
	"tradable": true
}
```

**Ответ:**

```json
{
	"id": 1,
	"userId": 123456,
	"seed": "artifact_seed_1",
	"name": "Legendary Sword",
	"description": "A powerful legendary sword",
	"rarity": "legendary",
	"image": "sword.png",
	"effects": {
		"damage": 100,
		"durability": 1000
	},
	"tradable": true,
	"createdAt": "2024-01-01T12:00:00.000Z"
}
```

### Создание артефакта от SYSTEM с офертой

**POST** `/artifact/system-offer`

Создает артефакт от имени SYSTEM пользователя с автоматическим созданием оферты и инвойса. Требует TMA, JWT авторизации и rate limiting (5 запросов в минуту).

**Тело запроса:**

```json
{
	"artifactData": {
		"seed": "unique_artifact_seed",
		"name": "Legendary Sword",
		"description": "A powerful legendary sword",
		"rarity": "legendary",
		"image": "sword.png",
		"effects": {
			"damage": 100,
			"durability": 1000
		},
		"tradable": true
	},
	"offerData": {
		"price": 1000,
		"currency": "stardust",
		"expiresAt": "2024-12-31T23:59:59.000Z"
	}
}
```

**Ответ:**

```json
{
	"artifact": {
		"id": 1,
		"userId": -1,
		"seed": "unique_artifact_seed",
		"name": "Legendary Sword",
		"rarity": "legendary",
		"tradable": true
	},
	"offer": {
		"id": 1,
		"sellerId": -1,
		"itemType": "artifact",
		"itemId": 1,
		"price": 1000,
		"currency": "stardust",
		"offerType": "SYSTEM",
		"status": "ACTIVE"
	},
	"transaction": {
		"id": 1,
		"offerId": 1,
		"buyerId": 123456,
		"sellerId": -1,
		"status": "PENDING"
	},
	"payment": {
		"id": 1,
		"marketTransactionId": 1,
		"fromAccount": 123456,
		"toAccount": -1,
		"amount": 1000,
		"currency": "stardust",
		"txType": "BUYER_TO_CONTRACT",
		"status": "PENDING"
	}
}
```

## Маркет

### Получить все оферты

**GET** `/market/offers`

Получает все активные оферты на маркете. Публичный роут, не требует авторизации.

### Создать оферту на продажу артефакта

**POST** `/market/offer`

Создает оферту на продажу артефакта. Требует TMA, JWT авторизации и rate limiting (10 запросов в минуту).

**Тело запроса:** `{ artifactId, price, currency, expiresAt }`

### Отменить оферту

**POST** `/market/cancel-offer`

Отменяет оферту. Требует TMA, JWT авторизации и rate limiting (20 запросов в минуту).

**Тело запроса:** `{ offerId, reason }`

### Создать инвойс (запрос на покупку, для любого типа оферты)

**POST** `/market/invoice`

Создает инвойс для покупки любого типа оферты (артефакты, галактики, пакеты). Требует TMA, JWT авторизации и rate limiting (30 запросов в минуту).

**Тело запроса:** `{ offerId }`

### Провести сделку (оплата и передача предмета, для любого типа оферты)

**POST** `/market/deal`

Проводит сделку для любого типа оферты. Требует TMA, JWT авторизации и rate limiting (30 запросов в минуту).

**Тело запроса:** `{ transactionId, blockchainTxId }`

### Отменить сделку SYSTEM

**POST** `/market/cancel-system-deal`

Отменяет системную сделку. Требует TMA, JWT авторизации и rate limiting (10 запросов в минуту).

**Тело запроса:** `{ transactionId, reason }`

### Отменить сделку

**POST** `/market/cancel-deal`

Отменяет обычную сделку. Требует TMA, JWT авторизации и rate limiting (20 запросов в минуту).

**Тело запроса:** `{ transactionId, reason }`

### Получить все сделки пользователя

**GET** `/market/transactions`

Получает все сделки текущего пользователя. Требует TMA, JWT авторизации и rate limiting (60 запросов в минуту).

### Инициализация пакетов

**POST** `/market/initialize-packages`

Инициализирует пакеты в системе. Создает пакеты в PackageStore и оферты для них из переданных данных. Требует TMA, JWT авторизации и rate limiting (5 запросов в минуту).

**Тело запроса:**

```json
{
	"packages": [
		{
			"id": "starter_pack",
			"amount": 1000,
			"currencyGame": "stardust",
			"price": 10.0,
			"currency": "tgStars",
			"status": "ACTIVE"
		},
		{
			"id": "premium_pack",
			"amount": 5000,
			"currencyGame": "stardust",
			"price": 45.0,
			"currency": "tgStars",
			"status": "ACTIVE"
		},
		{
			"id": "dark_matter_pack",
			"amount": 100,
			"currencyGame": "darkMatter",
			"price": 25.0,
			"currency": "tgStars",
			"status": "ACTIVE"
		}
	]
}
```

**Обязательные поля для каждого пакета:**

-   `id` - уникальный идентификатор пакета
-   `amount` - количество игровой валюты
-   `currencyGame` - тип игровой валюты (stardust, darkMatter)
-   `price` - цена пакета
-   `currency` - валюта оплаты (tgStars, tonToken)
-   `status` - статус пакета (опционально, по умолчанию ACTIVE)

**Ответ:**

```json
{
	"message": "Successfully initialized 3 packages and 3 offers",
	"createdPackages": [
		{
			"id": "starter_pack",
			"amount": 1000,
			"currencyGame": "stardust",
			"price": 10.0,
			"currency": "tgStars",
			"status": "ACTIVE"
		},
		{
			"id": "premium_pack",
			"amount": 5000,
			"currencyGame": "stardust",
			"price": 45.0,
			"currency": "tgStars",
			"status": "ACTIVE"
		},
		{
			"id": "dark_matter_pack",
			"amount": 100,
			"currencyGame": "darkMatter",
			"price": 25.0,
			"currency": "tgStars",
			"status": "ACTIVE"
		}
	],
	"createdOffers": [
		{
			"packageId": "starter_pack",
			"offerId": 1,
			"price": 10.0,
			"currency": "tgStars",
			"amount": 1000,
			"currencyGame": "stardust"
		},
		{
			"packageId": "premium_pack",
			"offerId": 2,
			"price": 45.0,
			"currency": "tgStars",
			"amount": 5000,
			"currencyGame": "stardust"
		},
		{
			"packageId": "dark_matter_pack",
			"offerId": 3,
			"price": 25.0,
			"currency": "tgStars",
			"amount": 100,
			"currencyGame": "darkMatter"
		}
	],
	"totalPackages": 3
}
```

**Что происходит:**

1. **Создание пакетов**: Для каждого пакета из JSON создается запись в таблице `packagestore`
2. **Создание оферт**: Для каждого пакета создается оферта в таблице `marketoffer` от имени SYSTEM пользователя
3. **Проверка дубликатов**: Если пакет или оферта уже существуют, они не создаются повторно
4. **Транзакционность**: Все операции выполняются в рамках одной транзакции для обеспечения целостности данных

---

**Примечание:**

-   Для всех типов оферт (артефакты, галактики, пакеты) используются одни и те же универсальные методы /invoice и /deal.
-   Для пакетов не требуется отдельный маршрут — просто используйте offerId пакета.

## Галактики

### Создание галактики от SYSTEM с офертой

**POST** `/galaxy/system-offer`

Создает галактику от имени SYSTEM пользователя с автоматическим созданием оферты и инвойса.

**Тело запроса:**

```json
{
	"galaxyData": {
		"seed": "unique_galaxy_seed",
		"starMin": 100,
		"starCurrent": 100,
		"price": 100,
		"particleCount": 100,
		"onParticleCountChange": true,
		"galaxyProperties": {
			"name": "Galaxy Name",
			"description": "Galaxy Description"
		}
	},
	"offerData": {
		"price": 500,
		"currency": "stardust",
		"expiresAt": "2024-12-31T23:59:59.000Z"
	}
}
```

**Ответ:**

```json
{
	"galaxy": {
		"id": 1,
		"userId": -1,
		"seed": "unique_galaxy_seed",
		"starMin": 100,
		"starCurrent": 100,
		"price": 100,
		"particleCount": 100
	},
	"offer": {
		"id": 1,
		"sellerId": -1,
		"itemType": "galaxy",
		"itemId": 1,
		"price": 500,
		"currency": "stardust",
		"offerType": "SYSTEM",
		"status": "ACTIVE"
	},
	"transaction": {
		"id": 1,
		"offerId": 1,
		"buyerId": 123456,
		"sellerId": -1,
		"status": "PENDING"
	},
	"payment": {
		"id": 1,
		"marketTransactionId": 1,
		"fromAccount": 123456,
		"toAccount": -1,
		"amount": 500,
		"currency": "stardust",
		"txType": "BUYER_TO_CONTRACT",
		"status": "PENDING"
	}
}
```

## Маркет и платежи

### Управление TON-кошельком

#### Получение адреса TON-кошелька

**GET** `/market/ton-wallet`

Получает адрес TON-кошелька пользователя.

**Ответ:**

```json
{
	"tonWallet": "EQD7-buI0-VuhTBQbM_Zj_8qV4lf2EA5AoCv9yGF5HzDTuT7"
}
```

#### Обновление адреса TON-кошелька

**PUT** `/market/ton-wallet`

Обновляет адрес TON-кошелька пользователя.

**Тело запроса:**

```json
{
	"tonWallet": "EQD7-buI0-VuhTBQbM_Zj_8qV4lf2EA5AoCv9yGF5HzDTuT7"
}
```

**Ответ:**

```json
{
	"success": true,
	"tonWallet": "EQD7-buI0-VuhTBQbM_Zj_8qV4lf2EA5AoCv9yGF5HzDTuT7"
}
```

### Внутриигровые транзакции

#### Регистрация награды за фарминг

**POST** `/market/farming-reward`

Регистрирует получение ресурсов (пыль, темная материя) через фарминг.

**Тело запроса:**

```json
{
	"amount": 100,
	"currency": "stardust",
	"source": "mining"
}
```

**Ответ:**

```json
{
	"transaction": {
		"id": 1,
		"offerId": null,
		"buyerId": 123456,
		"sellerId": -1,
		"status": "COMPLETED",
		"completedAt": "2025-07-10T12:00:00.000Z"
	},
	"payment": {
		"id": 1,
		"marketTransactionId": 1,
		"fromAccount": -1,
		"toAccount": 123456,
		"amount": "100",
		"currency": "stardust",
		"txType": "FARMING_REWARD",
		"status": "CONFIRMED",
		"confirmedAt": "2025-07-10T12:00:00.000Z"
	}
}
```

#### Регистрация оплаты апгрейда

**POST** `/market/upgrade-payment`

Регистрирует оплату за приобретение апгрейда.

**Тело запроса:**

```json
{
	"nodeId": "production_1",
	"amount": 50,
	"currency": "stardust"
}
```

**Ответ:**

```json
{
	"transaction": {
		"id": 2,
		"offerId": null,
		"buyerId": 123456,
		"sellerId": -1,
		"status": "COMPLETED",
		"completedAt": "2025-07-10T12:05:00.000Z"
	},
	"payment": {
		"id": 2,
		"marketTransactionId": 2,
		"fromAccount": 123456,
		"toAccount": -1,
		"amount": "50",
		"currency": "stardust",
		"txType": "UPGRADE_PAYMENT",
		"status": "CONFIRMED",
		"confirmedAt": "2025-07-10T12:05:00.000Z"
	}
}
```

#### Регистрация награды за задачу

**POST** `/market/task-reward`

Регистрирует получение награды за выполнение задачи.

**Тело запроса:**

```json
{
	"taskId": "daily_1",
	"amount": 25,
	"currency": "darkMatter"
}
```

**Ответ:**

```json
{
	"transaction": {
		"id": 3,
		"offerId": null,
		"buyerId": 123456,
		"sellerId": -1,
		"status": "COMPLETED",
		"completedAt": "2025-07-10T12:10:00.000Z"
	},
	"payment": {
		"id": 3,
		"marketTransactionId": 3,
		"fromAccount": -1,
		"toAccount": 123456,
		"amount": "25",
		"currency": "darkMatter",
		"txType": "TASK_REWARD",
		"status": "CONFIRMED",
		"confirmedAt": "2025-07-10T12:10:00.000Z"
	}
}
```

#### Регистрация награды за событие

**POST** `/market/event-reward`

Регистрирует получение награды за завершение события.

**Тело запроса:**

```json
{
	"eventId": "event_1",
	"amount": 30,
	"currency": "stardust"
}
```

**Ответ:**

```json
{
	"transaction": {
		"id": 4,
		"offerId": null,
		"buyerId": 123456,
		"sellerId": -1,
		"status": "COMPLETED",
		"completedAt": "2025-07-10T12:15:00.000Z"
	},
	"payment": {
		"id": 4,
		"marketTransactionId": 4,
		"fromAccount": -1,
		"toAccount": 123456,
		"amount": "30",
		"currency": "stardust",
		"txType": "EVENT_REWARD",
		"status": "CONFIRMED",
		"confirmedAt": "2025-07-10T12:15:00.000Z"
	}
}
```

### Операции с галактиками

#### Добавление звезд в галактику

**POST** `/galaxy/add-stars`

Добавляет звезды в галактику пользователя.

**Тело запроса:**

```json
{
	"galaxyId": 1,
	"amount": 50
}
```

**Ответ:**

```json
{
	"success": true,
	"galaxy": {
		"id": 1,
		"userId": 123456,
		"starMin": 100,
		"starCurrent": 150,
		"price": 100,
		"seed": "galaxy_seed_1",
		"particleCount": 100
	},
	"transaction": {
		"id": 5,
		"offerId": null,
		"buyerId": -1,
		"sellerId": 123456,
		"status": "COMPLETED",
		"completedAt": "2025-07-10T12:20:00.000Z"
	}
}
```

### P2P торговля ресурсами

#### Создание оферты на продажу ресурсов

**POST** `/market/resource-offer`

Создает оферту на продажу ресурсов (пыль, темная материя, звезды) за TON.

**Тело запроса:**

```json
{
	"resourceType": "stardust",
	"amount": 1000,
	"price": "0.1",
	"currency": "tonToken"
}
```

**Ответ:**

```json
{
	"id": 6,
	"sellerId": 123456,
	"itemType": "resource",
	"itemId": "stardust_1000",
	"price": "0.1",
	"currency": "tonToken",
	"status": "ACTIVE",
	"offerType": "P2P",
	"createdAt": "2025-07-10T12:25:00.000Z",
	"expiresAt": null
}
```

#### Обмен ресурсами между пользователями

**POST** `/market/exchange-resources`

Выполняет обмен ресурсами между пользователями.

**Тело запроса:**

```json
{
	"toUserId": 654321,
	"resourceType": "darkMatter",
	"amount": 50
}
```

**Ответ:**

```json
{
	"transaction": {
		"id": 7,
		"offerId": null,
		"buyerId": 654321,
		"sellerId": 123456,
		"status": "COMPLETED",
		"completedAt": "2025-07-10T12:30:00.000Z"
	},
	"payment": {
		"id": 7,
		"marketTransactionId": 7,
		"fromAccount": 123456,
		"toAccount": 654321,
		"amount": "50",
		"currency": "darkMatter",
		"txType": "RESOURCE_EXCHANGE",
		"status": "CONFIRMED",
		"confirmedAt": "2025-07-10T12:30:00.000Z"
	}
}
```

### Получение оферт с пагинацией

#### Получение всех оферт

**GET** `/market/offers?page=1&limit=10&itemType=resource&offerType=P2P&status=ACTIVE&currency=tonToken`

Получает список всех оферт с пагинацией и фильтрацией.

**Параметры запроса:**

-   `page` - номер страницы (по умолчанию: 1)
-   `limit` - количество элементов на странице (по умолчанию: 10, максимум: 50)
-   `itemType` - тип предмета (galaxy, artifact, resource, package)
-   `offerType` - тип оферты (SYSTEM, P2P)
-   `status` - статус оферты (ACTIVE, COMPLETED, CANCELLED)
-   `currency` - валюта оферты (tgStars, stardust, darkMatter, tonToken)

**Ответ:**

```json
{
	"offers": [
		{
			"id": 1,
			"sellerId": 123456,
			"itemType": "resource",
			"itemId": "stardust_1000",
			"price": "0.1",
			"currency": "tonToken",
			"status": "ACTIVE",
			"offerType": "P2P",
			"createdAt": "2025-07-10T12:25:00.000Z",
			"expiresAt": null,
			"seller": {
				"id": 123456,
				"username": "player1"
			}
		}
		// ... другие оферты
	],
	"pagination": {
		"page": 1,
		"limit": 10,
		"totalItems": 25,
		"totalPages": 3
	}
}
```

#### Получение оферт галактик

**GET** `/market/offers/galaxy?page=1&limit=10&status=ACTIVE&currency=tgStars`

Получает список оферт галактик с пагинацией.

**Параметры запроса:**

-   `page` - номер страницы (по умолчанию: 1)
-   `limit` - количество элементов на странице (по умолчанию: 10, максимум: 50)
-   `status` - статус оферты (ACTIVE, COMPLETED, CANCELLED)
-   `currency` - валюта оферты (tgStars, stardust, darkMatter, tonToken)

**Ответ:**

```json
{
	"offers": [
		{
			"id": 2,
			"sellerId": 123456,
			"itemType": "galaxy",
			"itemId": "1",
			"price": "100",
			"currency": "tgStars",
			"status": "ACTIVE",
			"offerType": "P2P",
			"createdAt": "2025-07-10T12:30:00.000Z",
			"expiresAt": null,
			"seller": {
				"id": 123456,
				"username": "player1"
			}
		}
		// ... другие оферты галактик
	],
	"pagination": {
		"page": 1,
		"limit": 10,
		"totalItems": 15,
		"totalPages": 2
	}
}
```

#### Получение оферт ресурсов

**GET** `/market/offers/resource?page=1&limit=10&resourceType=stardust&status=ACTIVE`

Получает список оферт ресурсов с пагинацией.

**Параметры запроса:**

-   `page` - номер страницы (по умолчанию: 1)
-   `limit` - количество элементов на странице (по умолчанию: 10, максимум: 50)
-   `resourceType` - тип ресурса (stardust, darkMatter, tgStars)
-   `status` - статус оферты (ACTIVE, COMPLETED, CANCELLED)

**Ответ:**

```json
{
	"offers": [
		{
			"id": 3,
			"sellerId": 123456,
			"itemType": "resource",
			"itemId": "stardust_1000",
			"price": "0.1",
			"currency": "tonToken",
			"status": "ACTIVE",
			"offerType": "P2P",
			"createdAt": "2025-07-10T12:35:00.000Z",
			"expiresAt": null,
			"seller": {
				"id": 123456,
				"username": "player1",
				"tonWallet": "EQD7-buI0-VuhTBQbM_Zj_8qV4lf2EA5AoCv9yGF5HzDTuT7"
			},
			"resourceType": "stardust",
			"resourceAmount": 1000
		}
		// ... другие оферты ресурсов
	],
	"pagination": {
		"page": 1,
		"limit": 10,
		"totalItems": 20,
		"totalPages": 2
	}
}
```

#### Получение оферт артефактов

**GET** `/market/offers/artifact?page=1&limit=10&status=ACTIVE&currency=darkMatter&rarity=LEGENDARY`

Получает список оферт артефактов с пагинацией.

**Параметры запроса:**

-   `page` - номер страницы (по умолчанию: 1)
-   `limit` - количество элементов на странице (по умолчанию: 10, максимум: 50)
-   `status` - статус оферты (ACTIVE, COMPLETED, CANCELLED)
-   `currency` - валюта оферты (tgStars, stardust, darkMatter, tonToken)
-   `rarity` - редкость артефакта (COMMON, UNCOMMON, RARE, EPIC, LEGENDARY)

**Ответ:**

```json
{
	"offers": [
		{
			"id": 4,
			"sellerId": 123456,
			"itemType": "artifact",
			"itemId": "1",
			"price": "500",
			"currency": "darkMatter",
			"status": "ACTIVE",
			"offerType": "P2P",
			"createdAt": "2025-07-10T12:40:00.000Z",
			"expiresAt": null,
			"seller": {
				"id": 123456,
				"username": "player1"
			}
		}
		// ... другие оферты артефактов
	],
	"pagination": {
		"page": 1,
		"limit": 10,
		"totalItems": 5,
		"totalPages": 1
	}
}
```

#### Получение P2P оферт

**GET** `/market/offers/p2p?page=1&limit=10&status=ACTIVE&currency=tonToken&itemType=resource`

Получает список P2P оферт с пагинацией.

**Параметры запроса:**

-   `page` - номер страницы (по умолчанию: 1)
-   `limit` - количество элементов на странице (по умолчанию: 10, максимум: 50)
-   `status` - статус оферты (ACTIVE, COMPLETED, CANCELLED)
-   `currency` - валюта оферты (tgStars, stardust, darkMatter, tonToken)
-   `itemType` - тип предмета (galaxy, artifact, resource, package)

**Ответ:**

```json
{
	"offers": [
		{
			"id": 5,
			"sellerId": 123456,
			"itemType": "resource",
			"itemId": "stardust_1000",
			"price": "0.1",
			"currency": "tonToken",
			"status": "ACTIVE",
			"offerType": "P2P",
			"createdAt": "2025-07-10T12:45:00.000Z",
			"expiresAt": null,
			"seller": {
				"id": 123456,
				"username": "player1"
			}
		}
		// ... другие P2P оферты
	],
	"pagination": {
		"page": 1,
		"limit": 10,
		"totalItems": 30,
		"totalPages": 3
	}
}
```

#### Получение системных оферт

**GET** `/market/offers/system?page=1&limit=10&status=ACTIVE&currency=tgStars&itemType=galaxy`

Получает список системных оферт с пагинацией.

**Параметры запроса:**

-   `page` - номер страницы (по умолчанию: 1)
-   `limit` - количество элементов на странице (по умолчанию: 10, максимум: 50)
-   `status` - статус оферты (ACTIVE, COMPLETED, CANCELLED, EXPIRED)
-   `currency` - валюта оферты (tgStars, stardust, darkMatter, tonToken)
-   `itemType` - тип предмета (galaxy, artifact, resource, package)

**Ответ:**

```json
{
	"offers": [
		{
			"id": 6,
			"sellerId": -1,
			"itemType": "galaxy",
			"itemId": "2",
			"price": "200",
			"currency": "tgStars",
			"status": "ACTIVE",
			"offerType": "SYSTEM",
			"createdAt": "2025-07-10T12:50:00.000Z",
			"expiresAt": "2025-07-24T12:50:00.000Z",
			"isItemLocked": true,
			"seller": {
				"id": -1,
				"username": "SYSTEM"
			}
		}
		// ... другие системные оферты
	],
	"pagination": {
		"page": 1,
		"limit": 10,
		"totalItems": 25,
		"totalPages": 3
	}
}
```

#### Отмена оферты

**POST** `/market/offers/{offerId}/cancel`

Отменяет активную оферту и разблокирует ресурсы или объект.

**Параметры пути:**

-   `offerId` - ID оферты для отмены

**Ответ:**

```json
{
	"id": 5,
	"sellerId": 123456,
	"itemType": "resource",
	"itemId": "stardust_1000",
	"price": "0.1",
	"currency": "tonToken",
	"status": "CANCELLED",
	"offerType": "P2P",
	"createdAt": "2025-07-10T12:45:00.000Z",
	"expiresAt": "2025-07-13T12:45:00.000Z",
	"isItemLocked": false
}
```

#### Покупка оферты

**POST** `/market/offers/{offerId}/buy`

Покупает оферту, переводит средства продавцу и передает право собственности на предмет покупателю.

**Параметры пути:**

-   `offerId` - ID оферты для покупки

**Ответ:**

```json
{
	"transaction": {
		"id": 8,
		"offerId": 5,
		"buyerId": 654321,
		"sellerId": 123456,
		"status": "COMPLETED",
		"completedAt": "2025-07-10T13:00:00.000Z"
	},
	"payment": {
		"id": 8,
		"marketTransactionId": 8,
		"fromAccount": 654321,
		"toAccount": 123456,
		"amount": "0.1",
		"currency": "tonToken",
		"txType": "MARKET_PURCHASE",
		"status": "CONFIRMED",
		"confirmedAt": "2025-07-10T13:00:00.000Z"
	}
}
```

#### Обработка истекших оферт

**POST** `/market/offers/process-expired`

Обрабатывает истекшие оферты, меняя их статус на EXPIRED и разблокируя ресурсы или объекты. Доступно только для администраторов.

**Ответ:**

```json
{
	"success": true,
	"processedOffers": 3,
	"message": "Обработано 3 истекших оферт"
}
```

## Rate Limiting

API использует rate limiting для защиты от злоупотреблений:

### Аутентификация

-   **Регистрация**: 10 запросов в минуту (только TMA)
-   **Логин**: 30 запросов в минуту (TMA + JWT + rate limiting)
-   **Логаут**: 20 запросов в минуту (TMA + JWT + rate limiting)
-   **Обновление токенов**: 30 запросов в минуту (TMA + JWT + rate limiting)
-   **Друзья**: 60 запросов в минуту (TMA + JWT + rate limiting)

### Административные функции

-   **Список пользователей**: 30 запросов в минуту (TMA + JWT + admin + rate limiting)
-   **Блокировка/разблокировка**: 20 запросов в минуту (TMA + JWT + admin + rate limiting)

### Маркет

-   **Создание оферты**: 10 запросов в минуту (TMA + JWT + rate limiting)
-   **Отмена оферты**: 20 запросов в минуту (TMA + JWT + rate limiting)
-   **Создание инвойса**: 30 запросов в минуту (TMA + JWT + rate limiting)
-   **Проведение сделки**: 30 запросов в минуту (TMA + JWT + rate limiting)
-   **Отмена системной сделки**: 10 запросов в минуту (TMA + JWT + rate limiting)
-   **Отмена сделки**: 20 запросов в минуту (TMA + JWT + rate limiting)
-   **Получение транзакций**: 60 запросов в минуту (TMA + JWT + rate limiting)
-   **Инициализация пакетов**: 5 запросов в минуту (TMA + JWT + rate limiting)

### Артефакты

-   **Добавление артефакта**: 10 запросов в минуту (TMA + JWT + rate limiting)
-   **Получение артефактов**: 60 запросов в минуту (TMA + JWT + rate limiting)
-   **Создание системного артефакта**: 5 запросов в минуту (TMA + JWT + rate limiting)

### Галактики

-   **Создание галактики**: 10 запросов в минуту (TMA + JWT + rate limiting)
-   **Получение галактик**: 60 запросов в минуту (TMA + JWT + rate limiting)
-   **Обновление галактики**: 30 запросов в минуту (TMA + JWT + rate limiting)

### Задачи

-   **Получение задач**: 60 запросов в минуту (TMA + JWT + rate limiting)
-   **Обновление прогресса**: 30 запросов в минуту (TMA + JWT + rate limiting)
-   **Создание задачи (админ)**: 20 запросов в минуту (TMA + JWT + admin + rate limiting)
-   **Обновление задачи (админ)**: 20 запросов в минуту (TMA + JWT + admin + rate limiting)

### Метрики

-   **Все метрики**: 30 запросов в минуту (TMA + JWT + rate limiting)
-   **Prometheus метрики**: 60 запросов в минуту (без аутентификации)

При превышении лимита возвращается ошибка 429 с заголовком `Retry-After`.

## Административные эндпойнты

### Логин администратора

**POST** `/admin/login`

Аутентификация администратора через Telegram Mini Apps (initData) и Google 2FA.

**Заголовки:**

-   `x-telegram-init-data`: строка initData от Telegram WebApp
-   `x-2fa-code`: одноразовый код из Google Authenticator (или в теле запроса как `otp`)

**Тело запроса:**

```json
{}
```

или

```json
{ "otp": "123456" }
```

**Ответ:**

```json
{
	"message": "Admin login successful",
	"username": "admin",
	"id": 123456,
	"role": "ADMIN",
	"accessToken": "...jwt...",
	"refreshToken": "...jwt..."
}
```

---

### Logout администратора

**POST** `/admin/logout`

Завершение сессии администратора. Требует JWT и роль ADMIN.

**Заголовки:**

-   `Authorization: Bearer <accessToken>`

**Тело запроса:**

```json
{ "refreshToken": "...jwt..." }
```

**Ответ:**

```json
{ "message": "Admin logged out successfully" }
```

---

### Пример последовательности

1. Получить initData в Telegram WebApp (или через клиент).
2. Получить 2FA-код из Google Authenticator.
3. Вызвать `/admin/login` с нужными заголовками.
4. Использовать полученный accessToken для всех защищённых админских эндпойнтов.
5. Для выхода вызвать `/admin/logout` с accessToken и refreshToken.

### Инициализация администратора

**POST** `/admin/init`

Создаёт администратора на основе уже существующего пользователя Telegram (по id), если он ещё не админ. Требует секретный ключ (из переменной окружения).

**Тело запроса:**

```json
{
	"telegramId": "<id пользователя из Telegram>",
	"secretKey": "<секретный ключ>"
}
```

**Ответ:**

```json
{
	"message": "Admin initialized",
	"username": "admin",
	"id": 123456,
	"google2faSecret": "BASE32SECRET",
	"otpAuthUrl": "otpauth://totp/Nebulahunt%20Admin%20(admin)?secret=..."
}
```

**Важно:**

-   `secretKey` должен совпадать с переменной окружения `ADMIN_INIT_SECRET` (по умолчанию: `supersecret`).
-   После инициализации рекомендуется удалить или ограничить этот эндпойнт.

---

### Переменные окружения

Добавьте в `.env`:

```
ADMIN_INIT_SECRET=your_super_secret_key
```

Используется для защиты эндпойнта `/admin/init` от несанкционированного доступа.

## Шаблоны пакетов

### Получение всех активных шаблонов пакетов

```
GET /api/package-templates
```

**Параметры запроса:**

-   `category` (опционально) - категория шаблонов
-   `sortBy` (опционально) - поле для сортировки (по умолчанию: sortOrder)
-   `sortDir` (опционально) - направление сортировки (ASC или DESC, по умолчанию: ASC)

**Ответ:**

```json
[
	{
		"id": "pkg_12345678",
		"name": "Стартовый набор",
		"description": "Набор для новичков",
		"amount": 1000,
		"currencyGame": "stardust",
		"price": "10.00000000",
		"currency": "tgStars",
		"status": "ACTIVE",
		"imageUrl": "https://example.com/images/starter-pack.png",
		"sortOrder": 1,
		"category": "starter",
		"isPromoted": true,
		"validUntil": "2025-12-31T23:59:59.999Z",
		"createdAt": "2025-07-15T12:00:00.000Z",
		"updatedAt": "2025-07-15T12:00:00.000Z"
	}
]
```

### Получение шаблона пакета по ID

```
GET /api/package-templates/:id
```

**Ответ:**

```json
{
	"id": "pkg_12345678",
	"name": "Стартовый набор",
	"description": "Набор для новичков",
	"amount": 1000,
	"currencyGame": "stardust",
	"price": "10.00000000",
	"currency": "tgStars",
	"status": "ACTIVE",
	"imageUrl": "https://example.com/images/starter-pack.png",
	"sortOrder": 1,
	"category": "starter",
	"isPromoted": true,
	"validUntil": "2025-12-31T23:59:59.999Z",
	"createdAt": "2025-07-15T12:00:00.000Z",
	"updatedAt": "2025-07-15T12:00:00.000Z"
}
```

### Создание шаблона пакета (только для администраторов)

```
POST /api/package-templates
```

**Тело запроса:**

```json
{
	"name": "Стартовый набор",
	"description": "Набор для новичков",
	"amount": 1000,
	"currencyGame": "stardust",
	"price": "10.00000000",
	"currency": "tgStars",
	"imageUrl": "https://example.com/images/starter-pack.png",
	"sortOrder": 1,
	"category": "starter",
	"isPromoted": true,
	"validUntil": "2025-12-31T23:59:59.999Z"
}
```

**Ответ:**

```json
{
	"id": "pkg_12345678",
	"name": "Стартовый набор",
	"description": "Набор для новичков",
	"amount": 1000,
	"currencyGame": "stardust",
	"price": "10.00000000",
	"currency": "tgStars",
	"status": "ACTIVE",
	"imageUrl": "https://example.com/images/starter-pack.png",
	"sortOrder": 1,
	"category": "starter",
	"isPromoted": true,
	"validUntil": "2025-12-31T23:59:59.999Z",
	"createdAt": "2025-07-15T12:00:00.000Z",
	"updatedAt": "2025-07-15T12:00:00.000Z"
}
```

### Обновление шаблона пакета (только для администраторов)

```
PUT /api/package-templates/:id
```

**Тело запроса:**

```json
{
	"name": "Обновленный стартовый набор",
	"description": "Улучшенный набор для новичков",
	"amount": 1500,
	"price": "15.00000000",
	"imageUrl": "https://example.com/images/starter-pack-v2.png",
	"isPromoted": false
}
```

**Ответ:**

```json
{
	"id": "pkg_12345678",
	"name": "Обновленный стартовый набор",
	"description": "Улучшенный набор для новичков",
	"amount": 1500,
	"currencyGame": "stardust",
	"price": "15.00000000",
	"currency": "tgStars",
	"status": "ACTIVE",
	"imageUrl": "https://example.com/images/starter-pack-v2.png",
	"sortOrder": 1,
	"category": "starter",
	"isPromoted": false,
	"validUntil": "2025-12-31T23:59:59.999Z",
	"createdAt": "2025-07-15T12:00:00.000Z",
	"updatedAt": "2025-07-15T12:30:00.000Z"
}
```

### Изменение статуса шаблона пакета (только для администраторов)

```
PATCH /api/package-templates/:id/status
```

**Тело запроса:**

```json
{
	"status": "INACTIVE"
}
```

**Ответ:**

```json
{
	"id": "pkg_12345678",
	"name": "Обновленный стартовый набор",
	"status": "INACTIVE",
	"updatedAt": "2025-07-15T12:45:00.000Z"
}
```

### Создание оферты из шаблона пакета (только для администраторов)

```
POST /api/package-templates/:id/offer
```

**Ответ:**

```json
{
	"id": 123,
	"sellerId": "system",
	"itemType": "package",
	"itemId": "pkg_12345678",
	"price": "15.00000000",
	"currency": "tgStars",
	"offerType": "SYSTEM",
	"status": "ACTIVE",
	"expiresAt": null,
	"isItemLocked": false,
	"createdAt": "2025-07-15T12:45:00.000Z",
	"updatedAt": "2025-07-15T12:45:00.000Z"
}
```

**Примечание:** Системные пакеты от игры (sellerId = SYSTEM_USER_ID, itemType = 'package') имеют следующие особенности:

-   Не имеют даты истечения (`expiresAt: null`)
-   Не блокируют ресурсы (`isItemLocked: false`)
-   Не обрабатываются скриптом автоматической проверки истекших оферт
-   Всегда доступны для покупки пользователями

## Prometheus Метрики

### Получение метрик

**GET** `/api/metrics/metrics`

Предоставляет метрики в формате Prometheus для мониторинга системы.

**Ответ:**

```
# HELP game_user_registrations_total Total number of user registrations
# TYPE game_user_registrations_total counter
game_user_registrations_total 150

# HELP game_purchases_total Total number of successful purchases
# TYPE game_purchases_total counter
game_purchases_total{currency="tonToken"} 45
game_purchases_total{currency="tgStars"} 23

# HELP game_active_users_dau Number of unique active users in the last 24h
# TYPE game_active_users_dau gauge
game_active_users_dau 89

# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/health",status="200"} 1250
```

### Проверка здоровья сервиса метрик

**GET** `/api/metrics/health`

Проверяет доступность и работоспособность сервиса метрик.

**Ответ:**

```json
{
	"success": true,
	"status": "healthy",
	"timestamp": "2025-07-15T12:00:00.000Z"
}
```

### Принудительное обновление метрик

**POST** `/api/metrics/update`

Принудительно обновляет все метрики системы.

**Ответ:**

```json
{
	"success": true,
	"message": "Metrics updated successfully",
	"timestamp": "2025-07-15T12:00:00.000Z"
}
```

### Доступные метрики

#### Счетчики событий

-   `game_user_registrations_total` - Общее количество регистраций пользователей
-   `game_purchases_total` - Количество покупок по валютам
-   `game_revenue_total` - Общий доход по валютам
-   `game_errors_total` - Количество ошибок по типам
-   `game_market_offers_total` - Количество созданных оферт по типам
-   `game_market_deals_total` - Количество завершенных сделок по валютам

#### HTTP метрики

-   `http_requests_total` - Общее количество HTTP запросов
-   `http_errors_total` - Количество HTTP ошибок
-   `http_request_duration_seconds` - Время выполнения запросов
-   `http_response_size_bytes` - Размер ответов

#### Метрики активных пользователей

-   `game_active_users_dau` - Активные пользователи за 24 часа
-   `game_active_users_wau` - Активные пользователи за 7 дней
-   `game_active_users_mau` - Активные пользователи за 30 дней

#### Метрики базы данных

-   `db_connections` - Количество активных соединений с БД

#### Метрики игровой экономики

-   `game_total_stardust` - Общее количество звездной пыли в экономике
-   `game_total_dark_matter` - Общее количество темной материи в экономике
-   `game_total_tg_stars` - Общее количество TG Stars в экономике
-   `game_total_galaxies` - Общее количество галактик
-   `game_owned_galaxies` - Количество принадлежащих галактик
-   `game_total_artifacts` - Количество артефактов по редкости

### Автоматическое обновление

Метрики автоматически обновляются каждые 5 минут через cron-задачу.

### Интеграция с Prometheus

Для интеграции с Prometheus добавьте в конфигурацию:

```yaml
scrape_configs:
    - job_name: 'nebulahunt'
      static_configs:
          - targets: ['localhost:5000']
      metrics_path: '/api/metrics/metrics'
      scrape_interval: 30s
```

```

```
