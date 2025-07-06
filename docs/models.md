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
│ referral    │     │ state (JSONB)│     │ refreshToken│
│ role        │     │ chaosLevel   │     │             │
│ blocked     │     │ stabilityLevel│    │             │
└─────────────┘     └──────────────┘     └─────────────┘
       │
       │
       ▼
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

┌─────────────┐
│PackageStore │
│             │
│ id (PK)     │
│ name        │
│ description │
│ amount      │
│ currencyGame│
│ price       │
│ currency    │
│ active      │
└─────────────┘

┌─────────────┐     ┌─────────────┐
│UpgradeNode  │     │    Task     │
│             │     │             │
│ id (PK)     │     │ id (PK)     │
│ name        │     │ title (JSONB)│
│ description (JSONB)│ description (JSONB)│
│ maxLevel    │     │ reward      │
│ basePrice   │     │ condition (JSONB)│
│ effectPerLevel│   │ icon        │
│ priceMultiplier│  │ active      │
│ currency    │     │             │
│ category    │     │             │
│ icon        │     │             │
│ stability   │     │             │
│ instability │     │             │
│ modifiers (JSONB) │             │
│ conditions (JSONB)│             │
│ children (ARRAY)  │             │
│ weight      │     │             │
│ active      │     │             │
└─────────────┘     └─────────────┘

┌─────────────┐
│ GameEvent   │
│             │
│ id (PK)     │
│ name        │
│ description (JSONB)│
│ type        │
│ triggerConfig (JSONB)│
│ effect (JSONB)│
│ frequency (JSONB)│
│ conditions (JSONB)│
│ active      │
└─────────────┘

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

### UserState

Состояние пользователя в игре. Все игровые параметры, прогресс, события, задачи и апгрейды теперь централизованно хранятся в JSONB-полях этой модели.

**Основные поля:**

-   `state` — основные игровые параметры (totalStars, stardustCount и др.)
-   `chaosLevel`, `stabilityLevel`, `entropyVelocity` — глобальные показатели
-   `taskProgress`, `upgradeTree`, `stateHistory` — прогресс и история
-   `activeEvents`, `eventHistory`, `eventMultipliers`, `eventCooldowns`, `eventPreferences` — состояние событий
-   `userTasks`, `completedTasks`, `activeTasks`, `taskMultipliers` — состояние задач
-   `userUpgrades`, `completedUpgrades`, `activeUpgrades`, `upgradeMultipliers` — состояние апгрейдов

**Все игровые состояния пользователя (события, задачи, апгрейды) теперь хранятся только в UserState.**

**Индексы:**

-   `userstate_totalstars_idx` — индекс по totalStars в JSONB
-   `userstate_user_id_idx` — индекс по userId
-   `userstate_last_event_check_idx` — индекс по lastEventCheck
-   `userstate_last_task_check_idx` — индекс по lastTaskCheck
-   `userstate_last_upgrade_check_idx` — индекс по lastUpgradeCheck

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
  }
}
```

**Индексы:**

-   `token_refresh_token_idx` - индекс по refreshToken
-   `token_user_id_idx` - индекс по userId

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

### UpgradeNode

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
    type: DataTypes.ENUM('stardust', 'darkmetter'),
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

### Task

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

### GameEvent

Модель игровых событий.

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

## JSONB структуры

### UserState.state

```json
{
	"totalStars": 1000,
	"stardustCount": 150,
	"darkMatterCount": 25,
	"ownedGalaxiesCount": 3,
	"ownedNodesCount": 5
}
```

### UserState.taskProgress

```json
{
	"completedTasks": ["task_1", "task_2"],
	"currentWeight": 15,
	"unlockedNodes": ["node_1", "node_2"]
}
```

### UserState.upgradeTree

```json
{
	"activeNodes": ["upgrade_1", "upgrade_2"],
	"completedNodes": ["upgrade_3"],
	"nodeStates": {
		"upgrade_1": {
			"level": 2,
			"progress": 0.5,
			"completed": false
		}
	},
	"treeStructure": {
		"upgrade_1": {
			"children": ["upgrade_3", "upgrade_4"],
			"requirements": ["upgrade_2"]
		}
	},
	"totalProgress": 25,
	"lastNodeUpdate": "2024-01-01T12:00:00.000Z"
}
```

### UserState.stateHistory

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
				"trigger": "production_tick",
				"relatedId": null
			}
		}
	],
	"lastUpdate": "2024-01-01T12:00:00.000Z",
	"version": "1.0"
}
```

### Galaxy.galaxyProperties

```json
{
	"type": "spiral",
	"color": "blue",
	"size": "medium",
	"features": {
		"blackHole": true,
		"nebula": false,
		"asteroidBelt": true
	},
	"coordinates": {
		"x": 100,
		"y": 200,
		"z": 50
	}
}
```

### UpgradeNode.modifiers

```json
{
	"productionBonus": 0.1,
	"costReduction": 0.05,
	"unlockBonus": 0.2,
	"specialEffects": {
		"chaosReduction": 0.1,
		"stabilityBoost": 0.15
	}
}
```

### UpgradeNode.conditions

```json
{
	"minStars": 100,
	"minStardust": 50,
	"requiredUpgrades": ["upgrade_2", "upgrade_3"],
	"maxChaosLevel": 0.5,
	"minStabilityLevel": 0.3
}
```

### Task.condition

```json
{
	"type": "production",
	"target": "totalStars",
	"operator": ">=",
	"value": 100,
	"timeLimit": 86400000,
	"bonusConditions": {
		"withinTime": {
			"bonus": 1.5,
			"time": 3600000
		}
	}
}
```

### GameEvent.triggerConfig

```json
{
	"interval": "1h",
	"chancePerHour": 0.1,
	"condition": {
		"metric": "chaosLevel",
		"op": ">",
		"value": 50
	},
	"after": "eventId",
	"action": "burn-core",
	"start": "2025-06-01",
	"end": "2025-06-30",
	"at": "2025-07-01T00:00:00Z"
}
```

### GameEvent.effect

```json
{
	"type": "multiplier",
	"target": "production",
	"value": 2.0,
	"duration": 3600000,
	"stackable": false,
	"conditions": {
		"maxStacks": 1,
		"minInterval": 1800000
	}
}
```

## Индексы и оптимизация

### Основные индексы

1. **Первичные ключи** - автоматически создаются для всех моделей
2. **Внешние ключи** - индексы для связей между таблицами
3. **Уникальные поля** - seed для галактик, refreshToken для токенов
4. **JSONB индексы** - для быстрого поиска по JSONB полям

### Специальные индексы

```sql
-- Индекс по totalStars в JSONB
CREATE INDEX userstate_totalstars_idx ON userstates
USING GIN ((state->'totalStars'));

-- Индекс по датам проверки
CREATE INDEX userstate_last_event_check_idx ON userstates (lastEventCheck);
CREATE INDEX userstate_last_task_check_idx ON userstates (lastTaskCheck);
CREATE INDEX userstate_last_upgrade_check_idx ON userstates (lastUpgradeCheck);
```

### Оптимизация запросов

1. **Использование JSONB операторов** для эффективного поиска
2. **Партиционирование** для больших таблиц (если потребуется)
3. **Кэширование** часто используемых данных
4. **Оптимизация JOIN** запросов

## Миграции

### Создание таблиц

```sql
-- Создание таблицы пользователей
CREATE TABLE users (
  id BIGINT PRIMARY KEY DEFAULT 0,
  username VARCHAR(255),
  referral BIGINT DEFAULT 0,
  role ENUM('USER', 'ADMIN', 'SYSTEM') DEFAULT 'USER',
  blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индекса по referral
CREATE INDEX user_referral_idx ON users (referral);
```

### Обновление схемы

```sql
-- Добавление нового поля
ALTER TABLE userstates ADD COLUMN new_field JSONB DEFAULT '{}';

-- Создание нового индекса
CREATE INDEX userstate_new_field_idx ON userstates USING GIN (new_field);
```

## Валидация данных

### Уровни валидации

1. **Sequelize уровень** - валидация типов и ограничений
2. **Бизнес-логика уровень** - валидация в сервисах
3. **API уровень** - валидация входящих данных

### Примеры валидации

```javascript
// Sequelize валидация
{
  totalStars: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0,
      max: 999999999
    }
  },
  chaosLevel: {
    type: DataTypes.FLOAT,
    validate: {
      min: 0.0,
      max: 1.0
    }
  }
}

// JSONB валидация
{
  state: {
    type: DataTypes.JSONB,
    validate: {
      isValidState(value) {
        if (!value.totalStars || value.totalStars < 0) {
          throw new Error('Invalid state structure');
        }
      }
    }
  }
}
```

## Резервное копирование

### Стратегия бэкапов

1. **Полные бэкапы** - ежедневно
2. **Инкрементальные бэкапы** - каждый час
3. **WAL архивирование** - непрерывно
4. **Тестирование восстановления** - еженедельно

### Команды для бэкапа

```bash
# Полный бэкап
pg_dump -h localhost -U postgres -d nebulahunt > backup.sql

# Бэкап только схемы
pg_dump -h localhost -U postgres -d nebulahunt --schema-only > schema.sql

# Бэкап только данных
pg_dump -h localhost -U postgres -d nebulahunt --data-only > data.sql
```

### Artifact

Модель артефактов пользователя.

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
  seed: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  rarity: {
    type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
    allowNull: false
  },
  image: {
    type: DataTypes.STRING
  },
  effects: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  tradable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}
```

**Индексы:**

-   `artifact_seed_idx` - уникальный индекс по seed
-   `artifact_user_id_idx` - индекс по userId
-   `artifact_rarity_idx` - индекс по rarity
-   `artifact_tradable_idx` - индекс по tradable

**Связи:**

-   `belongsTo(User)` - артефакт принадлежит пользователю

### MarketOffer

Модель оферт на маркете.

```javascript
{
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  sellerId: {
    type: DataTypes.BIGINT,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  itemType: {
    type: DataTypes.ENUM('artifact', 'galaxy', 'package'),
    allowNull: false
  },
  itemId: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.ENUM('stardust', 'darkMatter', 'tgStars', 'tonToken'),
    allowNull: false
  },
  offerType: {
    type: DataTypes.ENUM('P2P', 'SYSTEM'),
    defaultValue: 'P2P'
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'ACTIVE'
  },
  expiresAt: {
    type: DataTypes.DATE
  },
  cancelledAt: {
    type: DataTypes.DATE
  },
  cancelReason: {
    type: DataTypes.STRING
  }
}
```

**Индексы:**

-   `marketoffer_seller_id_idx` - индекс по sellerId
-   `marketoffer_item_type_idx` - индекс по itemType
-   `marketoffer_status_idx` - индекс по status
-   `marketoffer_offer_type_idx` - индекс по offerType

**Связи:**

-   `belongsTo(User, { as: 'seller' })` - оферта принадлежит продавцу
-   `hasMany(MarketTransaction)` - оферта может иметь много транзакций

### MarketTransaction

Модель транзакций на маркете.

```javascript
{
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  offerId: {
    type: DataTypes.BIGINT,
    references: {
      model: 'marketoffers',
      key: 'id'
    }
  },
  buyerId: {
    type: DataTypes.BIGINT,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  sellerId: {
    type: DataTypes.BIGINT,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'PENDING'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  completedAt: {
    type: DataTypes.DATE
  }
}
```

**Индексы:**

-   `markettransaction_offer_id_idx` - индекс по offerId
-   `markettransaction_buyer_id_idx` - индекс по buyerId
-   `markettransaction_seller_id_idx` - индекс по sellerId
-   `markettransaction_status_idx` - индекс по status

**Связи:**

-   `belongsTo(MarketOffer)` - транзакция принадлежит оферте
-   `belongsTo(User, { as: 'buyer' })` - транзакция принадлежит покупателю
-   `belongsTo(User, { as: 'seller' })` - транзакция принадлежит продавцу
-   `hasMany(PaymentTransaction)` - транзакция может иметь много платежей

### PaymentTransaction

Модель платежных транзакций.

```javascript
{
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  marketTransactionId: {
    type: DataTypes.BIGINT,
    references: {
      model: 'markettransactions',
      key: 'id'
    }
  },
  fromAccount: {
    type: DataTypes.BIGINT,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  toAccount: {
    type: DataTypes.BIGINT,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.ENUM('stardust', 'darkMatter', 'tgStars', 'tonToken'),
    allowNull: false
  },
  txType: {
    type: DataTypes.ENUM('BUYER_TO_CONTRACT', 'CONTRACT_TO_SELLER', 'CONTRACT_TO_BUYER', 'FEE'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'FAILED'),
    defaultValue: 'PENDING'
  },
  blockchainTxId: {
    type: DataTypes.STRING
  },
  confirmedAt: {
    type: DataTypes.DATE
  }
}
```

**Индексы:**

-   `paymenttransaction_market_transaction_id_idx` - индекс по marketTransactionId
-   `paymenttransaction_from_account_idx` - индекс по fromAccount
-   `paymenttransaction_to_account_idx` - индекс по toAccount
-   `paymenttransaction_status_idx` - индекс по status
-   `paymenttransaction_tx_type_idx` - индекс по txType

**Связи:**

-   `belongsTo(MarketTransaction)` - платеж принадлежит транзакции
-   `belongsTo(User, { as: 'fromUser' })` - платеж отправлен от пользователя
-   `belongsTo(User, { as: 'toUser' })` - платеж получен пользователем

### PackageStore

Модель пакетов для продажи.

```javascript
{
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  currencyGame: {
    type: DataTypes.ENUM('stardust', 'darkMatter', 'tgStars', 'tonToken'),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.ENUM('stardust', 'darkMatter', 'tgStars', 'tonToken'),
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}
```

**Индексы:**

-   `packagestore_active_idx` - индекс по active
-   `packagestore_currency_game_idx` - индекс по currencyGame

**Связи:**

-   Нет прямых связей с другими моделями

### MarketCommission

Модель комиссий маркета. Автоматически инициализируется при запуске сервера из конфигурации.

```javascript
{
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  currency: {
    type: DataTypes.ENUM('stardust', 'darkMatter', 'tgStars', 'tonToken'),
    allowNull: false,
    unique: true
  },
  rate: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}
```

**Индексы:**

-   `marketcommission_currency_idx` - уникальный индекс по currency
-   `marketcommission_active_idx` - индекс по active

**Автоматическая инициализация:**

Комиссии загружаются из `config/market.config.js` при запуске сервера:

```javascript
// config/market.config.js
module.exports = {
	commission: {
		stardust: 0.05, // 5%
		darkMatter: 0.07, // 7%
		tgStars: 0.03, // 3%
		tonToken: 0.1, // 10%
	},
};
```

**Связи:**

-   Нет прямых связей с другими моделями

---

Эта структура данных обеспечивает гибкость, производительность и масштабируемость для игры Nebulahunt, позволяя эффективно хранить и обрабатывать сложные игровые данные.
