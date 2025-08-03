# Модели данных

## Обзор

Модели данных в Nebulahunt Server построены с использованием Sequelize ORM и PostgreSQL. Система использует JSONB поля для хранения сложных игровых структур, что обеспечивает гибкость и производительность.

## Схема базы данных

### ER-диаграмма

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│    User     │────▶│  UserState   │     │    Token    │
│             │     │              │     │             │
│ id (PK)     │     │ id (PK)      │     │ id (PK)     │
│ username    │     │ userId (FK)  │     │ userId (FK) │
│ referral    │     │ stardust     │     │ refreshToken│
│ role        │     │ darkMatter   │     │ expiresAt   │
│ blocked     │     │ tgStars      │     │             │
└─────────────┘     │ chaosLevel   │     └─────────────┘
       │            │ stabilityLevel│
       │            │ tasks (JSONB) │
       │            │ events (JSONB)│
       │            │ upgrades (JSONB)│
       │            │ settings (JSONB)│
       │            │ lockedResources (JSONB)│
       │            │ playerParameters (JSONB)│
       │            │ lastBotNotification (JSONB)│
       ▼            └──────────────┘
┌─────────────┐
│   Galaxy    │
│             │
│ id (PK)     │
│ userId (FK) │
│ starMin     │
│ starCurrent │
│ price       │
│ seed (UK)   │
│ particleCount│
│ galaxyProperties (JSONB)│
│ active      │
└─────────────┘

┌─────────────┐
│  Artifact   │
│             │
│ id (PK)     │
│ userId (FK) │
│ seed (UK)   │
│ name        │
│ description │
│ rarity      │
│ image       │
│ effects (JSONB)│
│ tradable    │
└─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│MarketOffer  │────▶│MarketTransaction│  │PaymentTransaction│
│             │     │             │     │             │
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │
│ sellerId (FK)│    │ offerId (FK)│    │ marketTransactionId (FK)│
│ itemType     │    │ buyerId (FK)│    │ fromAccount (FK)│
│ itemId       │    │ sellerId (FK)│   │ toAccount (FK)│
│ price        │    │ status       │    │ amount       │
│ currency     │    │ createdAt    │    │ currency     │
│ offerType    │    │ completedAt  │    │ txType       │
│ status       │    │             │    │ status       │
│ expiresAt    │    │             │    │ blockchainTxId│
│ cancelledAt  │    │             │    │ confirmedAt  │
│ cancelReason │    │             │    │             │
└─────────────┘     └─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐
│PackageStore │     │PackageTemplate│
│             │     │             │
│ id (PK)     │     │ id (PK)     │
│ userId (FK) │     │ name        │
│ amount      │     │ description │
│ resource    │     │ amount      │
│ price       │     │ resource    │
│ currency    │     │ price       │
│ status      │     │ currency    │
│ isUsed      │     │ status      │
│ isLocked    │     │             │
└─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│UpgradeNodeTemplate  │     │TaskTemplate │     │EventTemplate│
│             │     │             │     │             │
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │
│ name        │     │ title (JSONB)│    │ name        │
│ description (JSONB)│ description (JSONB)│ description (JSONB)│
│ maxLevel    │     │ reward      │     │ type        │
│ basePrice   │     │ condition (JSONB)│ │ triggerConfig (JSONB)│
│ effectPerLevel│   │ icon        │     │ effect (JSONB)│
│ priceMultiplier│  │ active      │     │ frequency (JSONB)│
│ currency    │     │             │     │ conditions (JSONB)│
│ category    │     │             │     │ active      │
│ icon        │     │             │     │             │
│ stability   │     │             │     │             │
│ instability │     │             │     │             │
│ modifiers (JSONB) │             │     │             │
│ conditions (JSONB)│             │     │             │
│ children (ARRAY)  │             │     │             │
│ weight      │     │             │     │             │
│ active      │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘

┌─────────────┐
│MarketCommission│
│             │
│ id (PK)     │
│ currency    │
│ rate        │
│ description │
│ active      │
└─────────────┘
```

## Детальное описание моделей

### User

Основная модель пользователя системы.

```javascript
{
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    defaultValue: 0
  },
  username: {
    type: DataTypes.STRING
  },
  referral: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  role: {
    type: DataTypes.ENUM('USER', 'ADMIN', 'SYSTEM'),
    defaultValue: 'USER'
  },
  blocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}
```

**Индексы:**

-   `user_referral_idx` - индекс по полю referral для быстрого поиска рефералов

**Связи:**

-   `hasOne(UserState)` - один пользователь имеет одно состояние
-   `hasOne(Token)` - один пользователь имеет один токен
-   `hasMany(Galaxy)` - один пользователь может иметь много галактик
-   `hasMany(Artifact)` - один пользователь может иметь много артефактов
-   `hasMany(MarketOffer)` - один пользователь может создавать много оферт
-   `hasMany(MarketTransaction, { as: 'buyerTransactions', foreignKey: 'buyerId' })` - транзакции как покупатель
-   `hasMany(MarketTransaction, { as: 'sellerTransactions', foreignKey: 'sellerId' })` - транзакции как продавец
-   `hasMany(PaymentTransaction, { as: 'sentPayments', foreignKey: 'fromAccount' })` - отправленные платежи
-   `hasMany(PaymentTransaction, { as: 'receivedPayments', foreignKey: 'toAccount' })` - полученные платежи
-   `hasMany(PackageStore)` - один пользователь может иметь много пакетов

### UserState

Состояние пользователя в игре. Все игровые параметры, прогресс, события, задачи и апгрейды централизованно хранятся в JSONB-полях этой модели.

```javascript
{
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.BIGINT,
    references: {
      model: 'users',
      key: 'id'
    },
    unique: true
  },
  stardust: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  darkMatter: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tgStars: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  chaosLevel: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  stabilityLevel: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  tasks: {
    type: DataTypes.JSONB,
    defaultValue: {
      active: [],
      completed: [],
      progress: {}
    }
  },
  events: {
    type: DataTypes.JSONB,
    defaultValue: {
      active: [],
      history: [],
      cooldowns: {},
      multipliers: {}
    }
  },
  upgrades: {
    type: DataTypes.JSONB,
    defaultValue: {
      active: [],
      completed: [],
      levels: {}
    }
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      notifications: true,
      language: 'en',
      theme: 'dark'
    }
  },
  lockedResources: {
    type: DataTypes.JSONB,
    defaultValue: {
      stardust: 0,
      darkMatter: 0,
      tgStars: 0
    }
  },
  playerParameters: {
    type: DataTypes.JSONB,
    defaultValue: {
      stardustProduction: 0,
      starDiscount: 0,
      darkMatterChance: 0,
      stardustMultiplier: 0,
      galaxyExplorer: 0,
      darkMatterSynthesis: 0,
      bulkCreation: 0,
      stellarMarket: 0,
      cosmicHarmony: 0,
      overflowProtection: 0,
      quantumInstability: 0,
      voidResonance: 0,
      stellarForge: 0
    }
  },
  lastBotNotification: {
    type: DataTypes.JSONB,
    defaultValue: {
      lastBotNotificationTime: null,
      lastBotNotificationToday: {
        date: null,
        count: 0
      }
    }
  }
}
```

**Индексы:**

-   `userstate_user_id_idx` — индекс по userId
-   `userstate_stardust_idx` — индекс по полю stardust
-   `userstate_dark_matter_idx` — индекс по полю darkMatter
-   `userstate_tg_stars_idx` — индекс по полю tgStars
-   `userstate_tasks_gin_idx` — GIN индекс по JSONB полю tasks
-   `userstate_events_gin_idx` — GIN индекс по JSONB полю events
-   `userstate_upgrades_gin_idx` — GIN индекс по JSONB полю upgrades

**Связи:**

-   `belongsTo(User)` — состояние принадлежит пользователю

### Token

Модель для хранения JWT refresh токенов.

```javascript
{
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.BIGINT,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}
```

**Индексы:**

-   `token_refresh_token_idx` - индекс по refreshToken
-   `token_user_id_idx` - индекс по userId
-   `token_expires_at_idx` - индекс по expiresAt

**Связи:**

-   `belongsTo(User)` - токен принадлежит пользователю

### Galaxy

Модель галактик пользователя.

```javascript
{
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.BIGINT,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  starMin: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  starCurrent: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  price: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  seed: {
    type: DataTypes.STRING,
    unique: true
  },
  particleCount: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  onParticleCountChange: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  galaxyProperties: {
    type: DataTypes.JSONB
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}
```

**Индексы:**

-   `galaxy_seed_idx` - уникальный индекс по seed
-   `galaxy_user_id_idx` - индекс по userId

**Связи:**

-   `belongsTo(User)` - галактика принадлежит пользователю

### UpgradeNodeTemplate

Глобальный шаблон апгрейда. Не связан с User напрямую. Все пользовательские апгрейды хранятся в UserState.

```javascript
{
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    unique: true
  },
  name: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.JSONB,
    defaultValue: {
      en: '',
      ru: ''
    }
  },
  maxLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  basePrice: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  effectPerLevel: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  priceMultiplier: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0
  },
  currency: {
    type: DataTypes.ENUM('stardust', 'darkMatter'),
    defaultValue: 'stardust'
  },
  category: {
    type: DataTypes.ENUM('production', 'economy', 'special', 'chance', 'storage', 'multiplier'),
    defaultValue: 'production'
  },
  icon: {
    type: DataTypes.STRING(3),
    defaultValue: ''
  },
  stability: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  instability: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  modifiers: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  conditions: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  delayedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  children: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  weight: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}
```

### TaskTemplate

Глобальный шаблон задачи. Не связан с User напрямую. Все пользовательские задачи и их прогресс хранятся в UserState.

```javascript
{
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  title: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  description: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  reward: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  condition: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}
```

### EventTemplate

Модель шаблонов игровых событий. Не связана с User напрямую. Все пользовательские события хранятся в UserState.

```javascript
{
  id: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.JSONB,
    defaultValue: {
      en: '',
      ru: ''
    }
  },
  type: {
    type: DataTypes.ENUM('RANDOM', 'PERIODIC', 'ONE_TIME', 'CONDITIONAL', 'CHAINED', 'TRIGGERED_BY_ACTION', 'GLOBAL_TIMED', 'LIMITED_REPEATABLE', 'SEASONAL', 'PASSIVE'),
    allowNull: false
  },
  triggerConfig: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  effect: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  frequency: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  conditions: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}
```

### PackageTemplate

Модель шаблонов пакетов.

```javascript
{
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.JSONB,
    defaultValue: {
      en: '',
      ru: ''
    }
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  resource: {
    type: DataTypes.ENUM('stardust', 'darkMatter', 'tgStars'),
    allowNull: false
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  currency: {
    type: DataTypes.ENUM('tgStars', 'usd', 'ton'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'DELETED'),
    defaultValue: 'ACTIVE'
  }
}
```

### PackageStore

Модель пакетов пользователя.

```javascript
{
  id: {
    type: DataTypes.STRING(100),
    primaryKey: true
  },
  userId: {
    type: DataTypes.BIGINT,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  resource: {
    type: DataTypes.ENUM('stardust', 'darkMatter', 'tgStars'),
    allowNull: false
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  currency: {
    type: DataTypes.ENUM('tgStars', 'usd', 'ton'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'DELETED'),
    defaultValue: 'ACTIVE'
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}
```

**Индексы:**

-   `packagestore_user_id_idx` - индекс по userId
-   `packagestore_status_idx` - индекс по status
-   `packagestore_is_used_idx` - индекс по isUsed
-   `packagestore_is_locked_idx` - индекс по isLocked

**Связи:**

-   `belongsTo(User)` - пакет принадлежит пользователю

## JSONB структуры

### UserState.tasks

```json
{
	"active": ["task_id_1", "task_id_2"],
	"completed": ["task_id_3", "task_id_4"],
	"progress": {
		"task_id_1": {
			"currentValue": 5,
			"targetValue": 10,
			"startedAt": "2025-07-15T12:00:00Z"
		},
		"task_id_2": {
			"currentValue": 2,
			"targetValue": 5,
			"startedAt": "2025-07-16T14:30:00Z"
		}
	}
}
```

### UserState.events

```json
{
	"active": ["event_id_1"],
	"history": [
		{
			"id": "event_id_2",
			"startedAt": "2025-07-10T08:00:00Z",
			"endedAt": "2025-07-10T12:00:00Z",
			"outcome": "success"
		}
	],
	"cooldowns": {
		"event_id_3": "2025-07-20T00:00:00Z"
	},
	"multipliers": {
		"production": 1.5,
		"stardustGain": 1.2
	}
}
```

### UserState.upgrades

```json
{
	"active": ["upgrade_id_1", "upgrade_id_2"],
	"completed": ["upgrade_id_3"],
	"levels": {
		"upgrade_id_1": 3,
		"upgrade_id_2": 1,
		"upgrade_id_3": 5
	}
}
```

### UserState.settings

```json
{
	"notifications": true,
	"language": "en",
	"theme": "dark",
	"soundEnabled": true,
	"eventPreferences": {
		"randomEvents": true,
		"periodicEvents": true
	}
}
```

### UserState.lockedResources

```json
{
	"stardust": 50,
	"darkMatter": 10,
	"tgStars": 0,
	"locks": [
		{
			"id": "market_offer_1",
			"type": "marketOffer",
			"resources": {
				"stardust": 50
			},
			"expiresAt": "2025-07-20T00:00:00Z"
		},
		{
			"id": "upgrade_purchase_1",
			"type": "upgrade",
			"resources": {
				"darkMatter": 10
			},
			"expiresAt": "2025-07-18T00:00:00Z"
		}
	]
}
```

### UserState.playerParameters

```json
{
	"stardustProduction": 0,
	"starDiscount": 0,
	"darkMatterChance": 0,
	"stardustMultiplier": 0,
	"galaxyExplorer": 0,
	"darkMatterSynthesis": 0,
	"bulkCreation": 0,
	"stellarMarket": 0,
	"cosmicHarmony": 0,
	"overflowProtection": 0,
	"quantumInstability": 0,
	"voidResonance": 0,
	"stellarForge": 0
}
```

### UserState.lastBotNotification

```json
{
	"lastBotNotificationTime": null,
	"lastBotNotificationToday": {
		"date": null,
		"count": 0
	}
}
```

---

## Связи между моделями

```
User
 ├── UserState (1:1)
 ├── Token (1:n)
 ├── Galaxy (1:n)
 ├── Artifact (1:n)
 ├── MarketOffer (1:n)
 └── PackageStore (1:n)

MarketOffer
 ├── MarketTransaction (1:n)
 └── PaymentTransaction (через MarketTransaction)
```

## Примечания

1. **Централизованное хранение данных пользователя** - Все игровые данные пользователя (задачи, события, апгрейды) хранятся в JSONB полях таблицы UserState. Это упрощает структуру базы данных и повышает производительность.

2. **Шаблоны и экземпляры** - TaskTemplate, EventTemplate, UpgradeNodeTemplate и PackageTemplate являются шаблонами, которые используются для создания экземпляров в UserState.

3. **Индексы JSONB полей** - Для оптимизации запросов к JSONB полям используются GIN индексы, что позволяет эффективно искать по содержимому этих полей.

4. **Транзакционная безопасность** - Все операции с игровыми данными выполняются в транзакциях для обеспечения целостности данных.
