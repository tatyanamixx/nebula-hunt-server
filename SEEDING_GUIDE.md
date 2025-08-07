# 🌱 Руководство по запуску сидеров

## Проблема

Сидеры не работают корректно, если запускать их напрямую, потому что:

1. Нет системного пользователя (создается сервером)
2. Используются фиксированные ID, которые могут конфликтовать
3. Нет проверки существующих данных
4. **JSONB поля не сериализованы правильно**
5. **Строковые ID вместо числовых BIGINT**

## ✅ Правильная последовательность

### Вариант 1: Автоматический (рекомендуется)

```bash
# 1. Очистить базу данных (если нужно)
npm run clear-db

# 2. Запустить миграции
npm run migrate

# 3. Запустить сервер в одном терминале
npm run dev

# 4. В другом терминале запустить автоматическую настройку
npm run setup:with-server
```

### Вариант 2: Ручной

```bash
# 1. Очистить базу данных (если нужно)
npm run clear-db

# 2. Запустить миграции
npm run migrate

# 3. Запустить сервер и дождаться создания системного пользователя
npm run dev

# 4. В новом терминале запустить сидеры
npm run seed
```

### Вариант 3: Исправление проблем

```bash
# Если есть ошибки JSONB или фиксированных ID
npm run fix-seeders

# Затем запустить сидеры
npm run seed
```

## 🔧 Что исправлено в сидерах

### 1. Сидер пользователей (`20250701000001-demo-users.js`)

-   ✅ Проверка существующих пользователей
-   ✅ Динамические ID вместо фиксированных
-   ✅ Все новые поля userstates
-   ✅ JSONB поля правильно сериализованы

### 2. Сидер улучшений (`20250701000004-upgrade-nodes.js`)

-   ✅ Динамические ID
-   ✅ JSONB поля правильно сериализованы
-   ✅ Правильные названия таблиц (upgradenodetemplates)

### 3. Сидер заданий (`20250701000005-task-templates.js`)

-   ✅ **Исправлена ошибка BIGINT** - заменены строковые ID на числовые
-   ✅ Добавлено поле `slug` для идентификации
-   ✅ JSONB поля правильно сериализованы
-   ✅ Динамические ID
-   ✅ Правильная структура наград (JSONB объект)

### 4. Сидер пакетов (`20250701000008-package-templates.js`)

-   ✅ JSONB поля правильно сериализованы
-   ✅ Динамические ID (автоинкремент)
-   ✅ Правильная структура данных

### 5. Автоматический скрипт (`setup-with-server.js`)

-   ✅ Ожидание запуска сервера
-   ✅ Создание системного пользователя
-   ✅ Автоматический запуск сидеров

### 6. Скрипт исправления (`fix-all-seeders.js`)

-   ✅ Автоматическое исправление JSONB полей
-   ✅ Замена одинарных кавычек на двойные
-   ✅ Обнаружение файлов с фиксированными ID

## 📊 Структура данных после сидеров

### Пользователи:

-   `system` (ID: 1) - системный пользователь
-   `demo_user` - демо пользователь
-   `admin_user` - админ пользователь
-   `user2` - пустой пользователь

### Шаблоны улучшений:

-   6 шаблонов улучшений (basic_mining, improved_mining, energy_efficiency, advanced_mining, automation, power_optimization)

### Шаблоны заданий:

-   Задания для создания звезд (100, 1000, 10000, 50000, 100000)
-   Задания для добычи ресурсов
-   Задания для галактик
-   Ежедневные задания

### Шаблоны пакетов:

-   Пакеты с различными ресурсами (stardust, darkMatter, stars)
-   Разные валюты (tgStars, tonToken, stardust, darkMatter)

### Состояния пользователей:

-   Все новые поля заполнены
-   Правильные JSONB структуры
-   Корректные значения по умолчанию

## 🚨 Важные моменты

1. **Всегда запускайте сервер перед сидерами**
2. **Системный пользователь должен существовать**
3. **Используйте `npm run setup:with-server` для автоматизации**
4. **Сидеры теперь идемпотентны** - можно запускать многократно
5. **JSONB поля должны быть сериализованы** с помощью `JSON.stringify()`
6. **Используйте динамические ID** вместо фиксированных
7. **ID должны быть числовыми BIGINT** - не строками

## 🔍 Отладка

Если возникают ошибки:

```bash
# Проверить существующих пользователей
psql -d nebulahunt_dev -c "SELECT id, username, role FROM users;"

# Проверить системного пользователя
psql -d nebulahunt_dev -c "SELECT * FROM users WHERE role = 'SYSTEM';"

# Проверить структуру userstates
psql -d nebulahunt_dev -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'userstates';"

# Проверить JSONB поля
psql -d nebulahunt_dev -c "SELECT id, playerParameters FROM userstates LIMIT 1;"

# Проверить шаблоны
psql -d nebulahunt_dev -c "SELECT COUNT(*) as count, 'upgrade' as type FROM upgradenodetemplates UNION ALL SELECT COUNT(*), 'task' FROM tasktemplates UNION ALL SELECT COUNT(*), 'package' FROM packagetemplates;"

# Проверить типы данных в tasktemplates
psql -d nebulahunt_dev -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tasktemplates' AND column_name = 'id';"
```

## 🛠️ Команды для исправления

```bash
# Исправить все сидеры автоматически
npm run fix-seeders

# Очистить базу данных
npm run clear-db

# Автоматическая настройка с сервером
npm run setup:with-server

# Обычные команды
npm run seed
npm run migrate
```

## 📋 Текущие сидеры (4 файла)

1. **20250701000001-demo-users.js** - Пользователи и их состояния (с игровыми данными)
2. **20250701000004-upgrade-nodes.js** - Шаблоны улучшений (10 штук)
3. **20250701000005-task-templates.js** - Шаблоны заданий (11 штук)
4. **20250701000008-package-templates.js** - Шаблоны пакетов

Все остальные сидеры удалены для упрощения процесса.

## 🎮 Структура игровых данных

### Шаблоны (Templates)

-   **UpgradeNodeTemplate** - шаблоны улучшений (10 штук)
-   **TaskTemplate** - шаблоны заданий (11 штук)
-   **PackageTemplate** - шаблоны пакетов (множество)

### Игровые данные в UserState.playerParameters

#### Для demo_user:

```json
{
	"stardustProduction": 2, // Уровень 2 stardust_production
	"starEfficiency": 0, // Уровень 0 star_efficiency
	"cosmicHarmony": 0, // Уровень 0 cosmic_harmony
	"starDiscount": 0, // Уровень 0 star_discount
	"bulkCreation": 0, // Уровень 0 bulk_creation
	"stellarMarket": 0, // Уровень 0 stellar_market
	"darkMatterChance": 0, // Уровень 0 dark_matter_chance
	"quantumInstability": 0, // Уровень 0 quantum_instability
	"voidResonance": 0, // Уровень 0 void_resonance
	"stardustMultiplier": 0, // Уровень 0 stardust_multiplier
	// Дополнительные параметры
	"stardustRate": 1.2, // 1 + 2 * 0.1
	"starCostMultiplier": 1.0,
	"saleChance": 0.0,
	"saleDiscount": 0.2,
	"bulkDiscount": 0.0,
	"darkMatterRate": 1.0,
	"extraDarkMatterChance": 0.0,
	"anomalyChance": 0.0,
	"anomalyBonus": 2,
	"synergy": 1.0
}
```

#### Для admin_user:

```json
{
	"stardustProduction": 5, // Уровень 5 stardust_production
	"starEfficiency": 3, // Уровень 3 star_efficiency
	"cosmicHarmony": 2, // Уровень 2 cosmic_harmony
	"starDiscount": 4, // Уровень 4 star_discount
	"bulkCreation": 2, // Уровень 2 bulk_creation
	"stellarMarket": 1, // Уровень 1 stellar_market
	"darkMatterChance": 2, // Уровень 2 dark_matter_chance
	"quantumInstability": 1, // Уровень 1 quantum_instability
	"voidResonance": 0, // Уровень 0 void_resonance
	"stardustMultiplier": 1, // Уровень 1 stardust_multiplier
	// Дополнительные параметры
	"stardustRate": 1.5, // 1 + 5 * 0.1
	"starEfficiency": 1.24, // 1 + 3 * 0.08
	"synergy": 1.3, // 1 + 2 * 0.15
	"starCostMultiplier": 0.8, // 1 - 4 * 0.05
	"saleChance": 0.08, // 4 * 0.02
	"saleDiscount": 0.2,
	"bulkDiscount": 0.06, // 2 * 0.03
	"darkMatterRate": 2.0, // 1 + 2 * 0.5
	"extraDarkMatterChance": 0.02, // 1 * 0.02
	"anomalyChance": 0.0,
	"anomalyBonus": 2
}
```

#### Для user2:

```json
{
	"stardustProduction": 0, // Уровень 0 stardust_production
	"starEfficiency": 0, // Уровень 0 star_efficiency
	"cosmicHarmony": 0, // Уровень 0 cosmic_harmony
	"starDiscount": 0, // Уровень 0 star_discount
	"bulkCreation": 0, // Уровень 0 bulk_creation
	"stellarMarket": 0, // Уровень 0 stellar_market
	"darkMatterChance": 0, // Уровень 0 dark_matter_chance
	"quantumInstability": 0, // Уровень 0 quantum_instability
	"voidResonance": 0, // Уровень 0 void_resonance
	"stardustMultiplier": 0, // Уровень 0 stardust_multiplier
	// Дополнительные параметры
	"stardustRate": 1.0, // Базовое значение
	"starEfficiency": 1.0,
	"synergy": 1.0,
	"starCostMultiplier": 1.0,
	"saleChance": 0.0,
	"saleDiscount": 0.2,
	"bulkDiscount": 0.0,
	"darkMatterRate": 1.0,
	"extraDarkMatterChance": 0.0,
	"anomalyChance": 0.0,
	"anomalyBonus": 2
}
```

### Логика игровых данных:

-   **demo_user**: Базовые улучшения, начальный прогресс
-   **admin_user**: Продвинутые улучшения, высокий прогресс
-   **user2**: Новый пользователь, базовые значения

## 🎯 Реальные улучшения из игры

### PRODUCTION UPGRADES (Stardust)

-   **stardust_production** - Stardust Collector (⚡)
-   **star_efficiency** - Star Efficiency (🔆)
-   **cosmic_harmony** - Cosmic Harmony (☯️)

### ECONOMY UPGRADES (Stardust)

-   **star_discount** - Star Discount (💰)
-   **bulk_creation** - Bulk Creation (📊)
-   **stellar_market** - Stellar Market (🏪)

### CHANCE UPGRADES (Dark Matter)

-   **dark_matter_chance** - Dark Matter Extractor (🌑)
-   **quantum_instability** - Quantum Instability (⚛️)
-   **void_resonance** - Void Resonance (🌀)

### MULTIPLIER UPGRADES (Dark Matter)

-   **stardust_multiplier** - Quantum Accelerator (✨)

## 📋 Реальные задания из игры

### DAILY TASKS

-   **daily_login** - Daily Explorer (📆)

### STARDUST TASKS

-   **create_stars_100** - First Steps (⭐)
-   **create_stars_1000** - Star Crafter (⭐)
-   **create_stars_10000** - Stellar Engineer (⭐)
-   **create_stars_25000** - Star Architect (⭐)

### COLLECTION TASKS

-   **collect_stardust_5000** - Dust Collector (✨)
-   **collect_stardust_50000** - Dust Master (✨)

### GALAXY TASKS

-   **create_galaxy_1** - Galaxy Creator (🌌)
-   **upgrade_galaxy** - Galaxy Upgrader (🔧)

### UPGRADE TASKS

-   **purchase_upgrade_1** - First Upgrade (⚡)
-   **max_upgrade** - Maximizer (🏆)
