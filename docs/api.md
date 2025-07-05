# API Документация

## Общая информация

### Базовый URL

```
https://your-server.com/api
```

### Аутентификация

Все запросы (кроме регистрации/логина) требуют аутентификации через Telegram Mini Apps. Токен передается в заголовке `Authorization: Bearer <token>`.

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
    "blocked": false
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

Вход существующего пользователя.

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

Выход пользователя из системы.

**Ответ:**

```json
{
	"message": "Successfully logged out"
}
```

### Обновление токенов

**GET** `/auth/refresh`

Обновляет access token используя refresh token.

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

Получает список пользователей, которые зарегистрировались по реферальной ссылке текущего пользователя.

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

Получает список всех пользователей (только для администраторов).

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

Блокирует пользователя (только для администраторов).

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

Разблокирует пользователя (только для администраторов).

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

## Галактики

### Получение галактик пользователя

**GET** `/galaxy`

Получает все галактики текущего пользователя.

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

Создает новую галактику для пользователя.

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

Обновляет существующую галактику.

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

## Апгрейды

### Получение доступных апгрейдов

**GET** `/upgrades`

Получает список доступных апгрейдов для пользователя.

**Ответ:**

```json
[
	{
		"id": "upgrade_1",
		"name": "Star Production",
		"description": {
			"en": "Increase star production by 10%",
			"ru": "Увеличивает производство звезд на 10%"
		},
		"maxLevel": 10,
		"basePrice": 100,
		"effectPerLevel": 0.1,
		"priceMultiplier": 1.5,
		"currency": "stardust",
		"category": "production",
		"icon": "⭐",
		"stability": 0.8,
		"instability": 0.2,
		"modifiers": {
			"productionBonus": 0.1,
			"costReduction": 0.05
		},
		"conditions": {
			"minStars": 100,
			"requiredUpgrades": ["upgrade_2"]
		},
		"children": ["upgrade_3", "upgrade_4"],
		"weight": 1
	}
]
```

### Покупка апгрейда

**POST** `/upgrades/purchase`

Покупает апгрейд для пользователя.

**Тело запроса:**

```json
{
	"upgradeId": "upgrade_1",
	"level": 1
}
```

**Ответ:**

```json
{
	"message": "Upgrade purchased successfully",
	"upgrade": {
		"id": "upgrade_1",
		"level": 1,
		"progress": 1.0,
		"completed": true,
		"cost": 100,
		"effects": {
			"productionBonus": 0.1
		}
	},
	"userState": {
		"stardustCount": 50,
		"upgradeTree": {
			"activeNodes": ["upgrade_3", "upgrade_4"],
			"completedNodes": ["upgrade_1"],
			"totalProgress": 15
		}
	}
}
```

### Получение дерева апгрейдов

**GET** `/upgrades/tree`

Получает полное дерево апгрейдов с прогрессом пользователя.

**Ответ:**

```json
{
	"tree": {
		"nodes": {
			"upgrade_1": {
				"id": "upgrade_1",
				"name": "Star Production",
				"level": 2,
				"maxLevel": 10,
				"completed": true,
				"children": ["upgrade_3", "upgrade_4"],
				"requirements": {
					"met": true,
					"missing": []
				}
			}
		},
		"connections": [
			{
				"from": "upgrade_1",
				"to": "upgrade_3"
			}
		]
	},
	"userProgress": {
		"activeNodes": ["upgrade_3", "upgrade_4"],
		"completedNodes": ["upgrade_1", "upgrade_2"],
		"totalProgress": 25,
		"availableUpgrades": ["upgrade_3", "upgrade_4"]
	}
}
```

## События

### Получение активных событий

**GET** `/events`

Получает активные события для пользователя.

**Ответ:**

```json
{
	"activeEvents": [
		{
			"id": "event_1",
			"name": "Star Storm",
			"description": {
				"en": "Increased star production for 1 hour",
				"ru": "Увеличенное производство звезд на 1 час"
			},
			"type": "RANDOM",
			"effect": {
				"type": "multiplier",
				"target": "production",
				"value": 2.0,
				"duration": 3600000
			},
			"startTime": "2024-01-01T12:00:00.000Z",
			"endTime": "2024-01-01T13:00:00.000Z",
			"progress": 0.5
		}
	],
	"eventMultipliers": {
		"production": 2.0,
		"chaos": 1.0,
		"stability": 1.0,
		"entropy": 1.0,
		"rewards": 1.0
	},
	"nextEventCheck": "2024-01-01T12:30:00.000Z"
}
```

### Принудительный запуск события

**POST** `/events/trigger`

Принудительно запускает событие (только для администраторов).

**Тело запроса:**

```json
{
	"eventId": "event_1",
	"userId": 123456
}
```

**Ответ:**

```json
{
	"message": "Event triggered successfully",
	"event": {
		"id": "event_1",
		"name": "Star Storm",
		"startTime": "2024-01-01T12:00:00.000Z",
		"endTime": "2024-01-01T13:00:00.000Z"
	}
}
```

## Задачи

### Получение доступных задач

**GET** `/tasks`

Получает доступные задачи для пользователя.

**Ответ:**

```json
{
	"availableTasks": [
		{
			"id": "task_1",
			"title": {
				"en": "First Steps",
				"ru": "Первые шаги"
			},
			"description": {
				"en": "Produce 100 stars",
				"ru": "Произведите 100 звезд"
			},
			"reward": 50,
			"condition": {
				"type": "production",
				"target": "totalStars",
				"operator": ">=",
				"value": 100
			},
			"icon": "⭐",
			"progress": {
				"current": 75,
				"target": 100,
				"percentage": 0.75
			},
			"completed": false
		}
	],
	"completedTasks": ["task_2", "task_3"],
	"taskMultipliers": {
		"progress": 1.0,
		"rewards": 1.0,
		"unlock": 1.0
	}
}
```

### Завершение задачи

**POST** `/tasks/complete`

Завершает задачу и выдает награду.

**Тело запроса:**

```json
{
	"taskId": "task_1"
}
```

**Ответ:**

```json
{
	"message": "Task completed successfully",
	"task": {
		"id": "task_1",
		"title": "First Steps",
		"completed": true,
		"completedAt": "2024-01-01T12:00:00.000Z"
	},
	"reward": {
		"stardust": 50,
		"experience": 10
	},
	"userState": {
		"stardustCount": 200,
		"completedTasks": ["task_1", "task_2", "task_3"]
	}
}
```

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

Получает список артефактов текущего пользователя.

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

Добавляет новый артефакт текущему пользователю.

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

Создает артефакт от имени SYSTEM пользователя с автоматическим созданием оферты и инвойса.

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

### Получение всех оферт

**GET** `/market/offers`

Получает все активные оферты на маркете.

**Ответ:**

```json
[
	{
		"id": 1,
		"sellerId": 123456,
		"itemType": "artifact",
		"itemId": 1,
		"price": 1000,
		"currency": "stardust",
		"offerType": "P2P",
		"status": "ACTIVE",
		"expiresAt": "2024-12-31T23:59:59.000Z"
	}
]
```

### Получение оферт по типу

**GET** `/market/offers/galaxy`

Получает все активные оферты галактик.

**GET** `/market/offers/artifact`

Получает все активные оферты артефактов.

**GET** `/market/offers/package`

Получает все активные оферты пакетов (только SYSTEM).

### Создание оферты

**POST** `/market/offer`

Создает новую оферту на продажу предмета.

**Тело запроса:**

```json
{
	"artifactId": 1,
	"price": 1000,
	"currency": "stardust",
	"expiresAt": "2024-12-31T23:59:59.000Z"
}
```

**Ответ:**

```json
{
	"id": 1,
	"sellerId": 123456,
	"itemType": "artifact",
	"itemId": 1,
	"price": 1000,
	"currency": "stardust",
	"offerType": "P2P",
	"status": "ACTIVE",
	"expiresAt": "2024-12-31T23:59:59.000Z"
}
```

### Создание инвойса

**POST** `/market/invoice`

Создает инвойс для покупки предмета.

**Тело запроса:**

```json
{
	"offerId": 1
}
```

**Ответ:**

```json
{
	"transaction": {
		"id": 1,
		"offerId": 1,
		"buyerId": 123456,
		"sellerId": 789012,
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

### Подтверждение сделки

**POST** `/market/deal`

Подтверждает сделку и передает предмет покупателю.

**Тело запроса:**

```json
{
	"transactionId": 1,
	"blockchainTxId": "0x1234567890abcdef"
}
```

**Ответ:**

```json
{
	"transaction": {
		"id": 1,
		"status": "COMPLETED",
		"completedAt": "2024-01-01T12:00:00.000Z"
	},
	"offer": {
		"id": 1,
		"status": "COMPLETED"
	},
	"sellerAmount": 950,
	"commission": 50
}
```

### Покупка пакета

**POST** `/market/package-invoice`

Создает инвойс для покупки пакета от SYSTEM.

**Тело запроса:**

```json
{
	"offerId": 1
}
```

**Ответ:**

```json
{
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

### Подтверждение покупки пакета

**POST** `/market/package-deal`

Подтверждает покупку пакета и начисляет игровую валюту.

**Тело запроса:**

```json
{
	"transactionId": 1,
	"blockchainTxId": "0x1234567890abcdef"
}
```

**Ответ:**

```json
{
	"transaction": {
		"id": 1,
		"status": "COMPLETED",
		"completedAt": "2024-01-01T12:00:00.000Z"
	},
	"offer": {
		"id": 1,
		"status": "ACTIVE"
	},
	"package": {
		"id": 1,
		"amount": 500,
		"currencyGame": "stardust"
	}
}
```

### Отмена оферты

**POST** `/market/cancel-offer`

Отменяет оферту (только продавец или система).

**Тело запроса:**

```json
{
	"offerId": 1,
	"reason": "Item no longer available"
}
```

**Ответ:**

```json
{
	"offer": {
		"id": 1,
		"status": "CANCELLED",
		"cancelledAt": "2024-01-01T12:00:00.000Z",
		"cancelReason": "Item no longer available"
	},
	"closedTransactions": []
}
```

### Отмена сделки

**POST** `/market/cancel-deal`

Отменяет сделку и возвращает средства покупателю.

**Тело запроса:**

```json
{
	"transactionId": 1,
	"reason": "Cancelled by user"
}
```

**Ответ:**

```json
{
	"transaction": {
		"id": 1,
		"status": "CANCELLED"
	},
	"payment": {
		"id": 1,
		"status": "FAILED"
	},
	"reason": "Cancelled by user"
}
```

### Отмена SYSTEM сделки

**POST** `/market/cancel-system-deal`

Отменяет SYSTEM сделку и удаляет все связанные объекты.

**Тело запроса:**

```json
{
	"transactionId": 1,
	"reason": "Cancelled by system"
}
```

**Ответ:**

```json
{
	"transaction": {
		"id": 1,
		"status": "CANCELLED"
	},
	"offer": {
		"id": 1,
		"status": "CANCELLED"
	},
	"payments": [
		{
			"id": 1,
			"status": "FAILED"
		}
	],
	"reason": "Cancelled by system",
	"deletedObjects": "galaxy"
}
```

### Получение транзакций пользователя

**GET** `/market/transactions`

Получает все транзакции текущего пользователя (как покупатель или продавец).

**Ответ:**

```json
[
	{
		"id": 1,
		"offerId": 1,
		"buyerId": 123456,
		"sellerId": 789012,
		"status": "COMPLETED",
		"createdAt": "2024-01-01T12:00:00.000Z",
		"completedAt": "2024-01-01T12:05:00.000Z"
	}
]
```

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

## Rate Limiting

API использует rate limiting для защиты от злоупотреблений:

-   **Регистрация**: 10 запросов в минуту
-   **Логин**: 30 запросов в минуту
-   **Логаут**: 20 запросов в минуту
-   **Обновление токенов**: 30 запросов в минуту
-   **Друзья**: 60 запросов в минуту
-   **Системный пользователь**: 10 запросов в минуту
-   **Административные функции**: 100 запросов в минуту
-   **Маркет**: 100 запросов в минуту
-   **Артефакты**: 50 запросов в минуту
-   **Галактики**: 30 запросов в минуту
-   **Остальные эндпоинты**: 1000 запросов в минуту

При превышении лимита возвращается ошибка 429 с заголовком `Retry-After`.
