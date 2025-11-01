# Обновление структуры пакетов

## Обзор изменений

Структура пакетов была обновлена для поддержки более гибких типов действий, основанных на примере из `examples/request-package.json`.

## Новая структура

### Новые поля в таблицах

#### `packagetemplates` и `packagestore`

-   **`category`** - Категория пакета (например, `resourcePurchase`, `gameObject`)
-   **`actionType`** - Тип действия (например, `fixedAmount`, `variableAmount`, `updateField`)
-   **`actionTarget`** - Цель действия (например, `reward`, `entity`)
-   **`actionData`** - JSONB поле с данными действия (например, `{ resource: "stardust", amount: 1000 }`)
-   **`costData`** - JSONB поле с данными о стоимости (например, `{ price: 99, currency: "tgStars" }`)

### Legacy поля

Для обратной совместимости сохранены старые поля:

-   **`amount`** - Количество ресурса
-   **`resource`** - Тип ресурса
-   **`price`** - Цена
-   **`currency`** - Валюта

## Типы пакетов

### 1. Resource Purchase (`resourcePurchase`)

Пакеты для покупки ресурсов (stardust, dark matter).

**Пример:**

```json
{
	"slug": "tiny_stardust",
	"name": "Tiny package",
	"description": "10000 stardust",
	"category": "resourcePurchase",
	"action": {
		"type": "fixedAmount",
		"target": "reward",
		"reward": {
			"resource": "stardust",
			"amount": 10000
		},
		"cost": {
			"price": 99,
			"currency": "tgStars"
		}
	}
}
```

### 2. Game Object (`gameObject`)

Пакеты для изменения игровых объектов.

**Пример:**

```json
{
	"slug": "update_galaxy_name",
	"name": "Update galaxy name",
	"description": "Update galaxy name",
	"category": "gameObject",
	"action": {
		"type": "updateField",
		"target": "entity",
		"entity": {
			"table": "galaxy",
			"seed": "{{seed}}",
			"field": "name",
			"value": "{{value}}"
		},
		"cost": {
			"price": 99,
			"currency": "tgStars"
		}
	}
}
```

### 3. Variable Amount (`variableAmount`)

Пакеты с переменным количеством ресурсов.

**Пример:**

```json
{
	"slug": "variable_stardust",
	"name": "Variable package",
	"description": "Variable stardust",
	"category": "resourcePurchase",
	"action": {
		"type": "variableAmount",
		"target": "reward",
		"reward": {
			"resource": "stardust",
			"amount": "{{amount}}"
		},
		"cost": {
			"price": "{{price}}",
			"currency": "tgStars"
		}
	}
}
```

## Миграции

### 1. `20250101000003-init-template-tables.js`

-   Добавлены новые поля в таблицу `packagetemplates`
-   Созданы индексы для новых полей

### 2. `20250101000004-init-user-data-tables.js`

-   Добавлены новые поля в таблицу `packagestore`
-   Созданы индексы для новых полей

### 3. `20250701000009-updated-package-templates.js`

-   Обновлены существующие пакеты под новый формат
-   Добавлены новые пакеты из `examples/request-package.json`

## Обновленные сервисы

### `package-template-service.js`

-   Метод `getAllTemplates` теперь поддерживает фильтрацию по `category` и `actionType`
-   Метод `createOfferFromTemplate` использует новые поля для цены и валюты
-   Метод `createPackageFromTemplate` создает пакеты с новыми полями

### `package-store-service.js`

-   Метод `usePackage` использует новые поля для создания оферт

### `market-service.js`

-   Метод `getPackageOffers` поддерживает параметры фильтрации

### `market-controller.js`

-   Контроллер `getPackageOffers` поддерживает query параметры для фильтрации

## Обратная совместимость

Все существующие пакеты продолжают работать благодаря:

1. Сохранению legacy полей
2. Fallback логике в сервисах (используются новые поля, если доступны, иначе legacy)
3. Автоматическому заполнению новых полей значениями по умолчанию

## Использование

### Получение пакетов по категории

```javascript
// Получить все пакеты для покупки ресурсов
const resourcePackages = await packageTemplateService.getAllTemplates({
	category: "resourcePurchase",
});

// Получить все пакеты для изменения игровых объектов
const gameObjectPackages = await packageTemplateService.getAllTemplates({
	category: "gameObject",
});
```

### Получение пакетов по типу действия

```javascript
// Получить все пакеты с фиксированным количеством
const fixedAmountPackages = await packageTemplateService.getAllTemplates({
	actionType: "fixedAmount",
});

// Получить все пакеты с переменным количеством
const variableAmountPackages = await packageTemplateService.getAllTemplates({
	actionType: "variableAmount",
});
```

### API endpoints

```bash
# Получить все пакеты
GET /api/market/package-offers

# Получить пакеты по категории
GET /api/market/package-offers?category=resourcePurchase

# Получить пакеты по типу действия
GET /api/market/package-offers?actionType=fixedAmount

# Комбинированная фильтрация
GET /api/market/package-offers?category=resourcePurchase&actionType=fixedAmount
```

## Тестирование

Создан тест `package-template-service-new-format.test.js` для проверки:

-   Фильтрации по категории
-   Фильтрации по типу действия
-   Обратной совместимости legacy полей

## Следующие шаги

1. Запустить миграции для обновления структуры БД
2. Запустить сидер для обновления существующих пакетов
3. Обновить клиентскую часть для работы с новым форматом
4. Добавить поддержку новых типов действий в игровую логику
