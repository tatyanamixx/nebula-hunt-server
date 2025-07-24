# View связок Template-Ребенок

## Обзор

View связок template-ребенок предоставляют удобный способ получения данных, объединяющих таблицы шаблонов с таблицами пользовательских данных. Это позволяет получать всю необходимую информацию в одном запросе, включая как пользовательские данные, так и свойства соответствующих шаблонов.

## Созданные View

### 1. `user_upgrades_with_template`

Объединяет таблицы `userupgrades` и `upgradenodetemplates`.

**Поля:**

-   Все поля из `userupgrades` (id, userId, upgradeNodeTemplateId, level, progress, targetProgress, completed, progressHistory, lastProgressUpdate, createdAt, updatedAt)
-   Все поля из `upgradenodetemplates` с префиксом `template` (templateSlug, templateName, templateDescription, templateMaxLevel, templateBasePrice, templateEffectPerLevel, templatePriceMultiplier, templateCurrency, templateCategory, templateIcon, templateStability, templateInstability, templateModifiers, templateConditions, templateChildren, templateWeight, templateActive, templateDelayedUntil)

### 2. `user_tasks_with_template`

Объединяет таблицы `usertasks` и `tasktemplates`.

**Поля:**

-   Все поля из `usertasks` (id, userId, taskTemplateId, progress, targetProgress, completed, reward, progressHistory, lastProgressUpdate, active, completedAt, createdAt, updatedAt)
-   Все поля из `tasktemplates` с префиксом `template` (templateSlug, templateTitle, templateDescription, templateReward, templateCondition, templateIcon, templateActive)

### 3. `user_events_with_template`

Объединяет таблицы `userevents` и `eventtemplates`.

**Поля:**

-   Все поля из `userevents` (id, userId, eventTemplateId, status, triggeredAt, expiresAt, effects, progress, completedAt, createdAt, updatedAt)
-   Все поля из `eventtemplates` с префиксом `template` (templateSlug, templateName, templateDescription, templateType, templateTriggerConfig, templateEffect, templateFrequency, templateConditions, templateActive)

### 4. `user_packages_with_template`

Объединяет таблицы `packagestores` и `packagetemplates`.

**Поля:**

-   Все поля из `packagestores` (id, userId, packageTemplateId, amount, resource, price, currency, status, isUsed, isLocked, createdAt, updatedAt)
-   Все поля из `packagetemplates` с префиксом `template` (templateSlug, templateName, templateDescription, templateAmount, templateResource, templatePrice, templateCurrency, templateStatus, templateImageUrl, templateSortOrder, templateCategory, templateIsPromoted, templateValidUntil)

### 5. `user_artifacts_with_template`

Объединяет таблицы `artifacts` и `artifacttemplates`.

**Поля:**

-   Все поля из `artifacts` (id, userId, artifactTemplateId, seed, name, description, tradable, createdAt, updatedAt)
-   Все поля из `artifacttemplates` с префиксом `template` (templateSlug, templateName, templateDescription, templateRarity, templateImage, templateEffects, templateLimited, templateLimitedCount, templateLimitedDuration, templateLimitedDurationType, templateLimitedDurationValue)

## API Endpoints

### Апгрейды

#### Получить все апгрейды пользователя с данными шаблонов

```
GET /api/template-views/upgrades
```

**Query параметры:**

-   `limit` (number) - Лимит записей
-   `offset` (number) - Смещение (по умолчанию 0)
-   `completed` (boolean) - Фильтр по завершенности
-   `category` (string) - Фильтр по категории
-   `templateSlug` (string) - Фильтр по slug шаблона
-   `order` (string) - Сортировка в формате `field:direction,field:direction`

**Пример:**

```
GET /api/template-views/upgrades?limit=10&offset=0&completed=false&category=production&order=createdAt:DESC
```

#### Получить конкретный апгрейд

```
GET /api/template-views/upgrades/:upgradeId
```

#### Получить статистику по апгрейдам

```
GET /api/template-views/upgrades/stats
```

### Задачи

#### Получить все задачи пользователя с данными шаблонов

```
GET /api/template-views/tasks
```

**Query параметры:**

-   `limit` (number) - Лимит записей
-   `offset` (number) - Смещение (по умолчанию 0)
-   `completed` (boolean) - Фильтр по завершенности
-   `active` (boolean) - Фильтр по активности
-   `templateSlug` (string) - Фильтр по slug шаблона
-   `order` (string) - Сортировка

#### Получить конкретную задачу

```
GET /api/template-views/tasks/:taskId
```

#### Получить статистику по задачам

```
GET /api/template-views/tasks/stats
```

### События

#### Получить все события пользователя с данными шаблонов

```
GET /api/template-views/events
```

**Query параметры:**

-   `limit` (number) - Лимит записей
-   `offset` (number) - Смещение (по умолчанию 0)
-   `status` (string) - Фильтр по статусу (ACTIVE, COMPLETED, EXPIRED, CANCELLED)
-   `templateType` (string) - Фильтр по типу шаблона
-   `templateSlug` (string) - Фильтр по slug шаблона
-   `order` (string) - Сортировка

#### Получить конкретное событие

```
GET /api/template-views/events/:eventId
```

#### Получить статистику по событиям

```
GET /api/template-views/events/stats
```

### Пакеты

#### Получить все пакеты пользователя с данными шаблонов

```
GET /api/template-views/packages
```

**Query параметры:**

-   `limit` (number) - Лимит записей
-   `offset` (number) - Смещение (по умолчанию 0)
-   `isUsed` (boolean) - Фильтр по использованию
-   `isLocked` (boolean) - Фильтр по блокировке
-   `resource` (string) - Фильтр по ресурсу
-   `templateSlug` (string) - Фильтр по slug шаблона
-   `order` (string) - Сортировка

#### Получить конкретный пакет

```
GET /api/template-views/packages/:packageId
```

#### Получить статистику по пакетам

```
GET /api/template-views/packages/stats
```

### Артифакты

#### Получить все артифакты пользователя с данными шаблонов

```
GET /api/template-views/artifacts
```

**Query параметры:**

-   `limit` (number) - Лимит записей
-   `offset` (number) - Смещение (по умолчанию 0)
-   `tradable` (boolean) - Фильтр по торговости
-   `templateRarity` (string) - Фильтр по редкости шаблона (COMMON, UNCOMMON, RARE, EPIC, LEGENDARY)
-   `templateSlug` (string) - Фильтр по slug шаблона
-   `order` (string) - Сортировка

#### Получить конкретный артифакт

```
GET /api/template-views/artifacts/:artifactId
```

#### Получить статистику по артифактам

```
GET /api/template-views/artifacts/stats
```

### Общая статистика

#### Получить полную статистику пользователя

```
GET /api/template-views/stats
```

## Примеры использования

### Получение активных апгрейдов пользователя

```javascript
const response = await fetch(
	'/api/template-views/upgrades?completed=false&active=true&order=level:DESC'
);
const data = await response.json();
console.log(data.data); // Массив апгрейдов с данными шаблонов
```

### Получение статистики по задачам

```javascript
const response = await fetch('/api/template-views/tasks/stats');
const data = await response.json();
console.log(data.data); // Статистика по задачам
```

### Фильтрация по шаблону

```javascript
const response = await fetch(
	'/api/template-views/events?templateSlug=daily-bonus&status=ACTIVE'
);
const data = await response.json();
console.log(data.data); // Активные события с шаблоном daily-bonus
```

### Получение торговых артифактов

```javascript
const response = await fetch(
	'/api/template-views/artifacts?tradable=true&templateRarity=RARE&order=createdAt:DESC'
);
const data = await response.json();
console.log(data.data); // Редкие торговые артифакты
```

## Структура ответа

Все endpoints возвращают данные в следующем формате:

```json
{
	"success": true,
	"data": [
		{
			// Поля из таблицы пользовательских данных
			"id": 1,
			"userId": 123,
			"level": 5,
			"progress": 75,
			"completed": false,

			// Поля из таблицы шаблона с префиксом template
			"templateSlug": "production-boost",
			"templateName": "Production Boost",
			"templateMaxLevel": 10,
			"templateBasePrice": 100,
			"templateEffectPerLevel": 0.1,
			"templateCategory": "production"
		}
	],
	"pagination": {
		"limit": 10,
		"offset": 0,
		"count": 5
	}
}
```

## Преимущества использования View

1. **Производительность** - Получение всех необходимых данных в одном запросе
2. **Удобство** - Не нужно делать дополнительные запросы для получения данных шаблонов
3. **Консистентность** - Данные всегда актуальны и синхронизированы
4. **Гибкость** - Возможность фильтрации и сортировки по полям как пользовательских данных, так и шаблонов
5. **Статистика** - Встроенные методы для получения агрегированной статистики

## Миграция

Для создания view выполните миграцию:

```bash
npx sequelize-cli db:migrate
```

Для отката:

```bash
npx sequelize-cli db:migrate:undo
```

## Безопасность

Все endpoints требуют аутентификации и валидации Telegram WebApp данных. Пользователи могут получать только свои собственные данные.
