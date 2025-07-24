# View связок Template-Ребенок

## Описание

Система view связок template-ребенок предоставляет удобный способ получения данных, объединяющих таблицы шаблонов с таблицами пользовательских данных. Это позволяет получать всю необходимую информацию в одном запросе, включая как пользовательские данные, так и свойства соответствующих шаблонов.

## Что создано

### 1. Миграция

-   `migrations/20250101000008-create-template-views.js` - Создает 4 view в базе данных

### 2. Модели Sequelize

-   `models/template-views.js` - Модели для работы с view

### 3. Сервис

-   `service/template-view-service.js` - Бизнес-логика для работы с view

### 4. Контроллер

-   `controllers/template-view-controller.js` - API endpoints

### 5. Роутер

-   `routes/template-view-router.js` - Маршруты API

### 6. Тесты

-   `tests/service/template-view-service.test.js` - Unit тесты

### 7. Документация

-   `docs/template-views.md` - Подробная документация API

## Созданные View

### 1. `user_upgrades_with_template`

Объединяет `userupgrades` и `upgradenodetemplates`

### 2. `user_tasks_with_template`

Объединяет `usertasks` и `tasktemplates`

### 3. `user_events_with_template`

Объединяет `userevents` и `eventtemplates`

### 4. `user_packages_with_template`

Объединяет `packagestores` и `packagetemplates`

### 5. `user_artifacts_with_template`

Объединяет `artifacts` и `artifacttemplates`

## Установка и настройка

### 1. Запуск миграции

```bash
npx sequelize-cli db:migrate
```

### 2. Проверка создания view

```sql
-- Проверить, что view созданы
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE '%template%';
```

### 3. Тестирование

```bash
npm test -- tests/service/template-view-service.test.js
```

## Использование

### API Endpoints

Все endpoints доступны по базовому пути `/api/template-views/`

#### Апгрейды

-   `GET /api/template-views/upgrades` - Все апгрейды пользователя
-   `GET /api/template-views/upgrades/:upgradeId` - Конкретный апгрейд
-   `GET /api/template-views/upgrades/stats` - Статистика по апгрейдам

#### Задачи

-   `GET /api/template-views/tasks` - Все задачи пользователя
-   `GET /api/template-views/tasks/:taskId` - Конкретная задача
-   `GET /api/template-views/tasks/stats` - Статистика по задачам

#### События

-   `GET /api/template-views/events` - Все события пользователя
-   `GET /api/template-views/events/:eventId` - Конкретное событие
-   `GET /api/template-views/events/stats` - Статистика по событиям

#### Пакеты

-   `GET /api/template-views/packages` - Все пакеты пользователя
-   `GET /api/template-views/packages/:packageId` - Конкретный пакет
-   `GET /api/template-views/packages/stats` - Статистика по пакетам

#### Артифакты

-   `GET /api/template-views/artifacts` - Все артифакты пользователя
-   `GET /api/template-views/artifacts/:artifactId` - Конкретный артифакт
-   `GET /api/template-views/artifacts/stats` - Статистика по артифактам

#### Общая статистика

-   `GET /api/template-views/stats` - Полная статистика пользователя

### Примеры запросов

#### Получение активных апгрейдов

```javascript
const response = await fetch(
	'/api/template-views/upgrades?completed=false&order=level:DESC'
);
const data = await response.json();
console.log(data.data); // Массив апгрейдов с данными шаблонов
```

#### Получение статистики

```javascript
const response = await fetch('/api/template-views/stats');
const data = await response.json();
console.log(data.data); // Полная статистика пользователя
```

#### Фильтрация по шаблону

```javascript
const response = await fetch(
	'/api/template-views/tasks?templateSlug=daily-login&active=true'
);
const data = await response.json();
console.log(data.data); // Активные задачи с шаблоном daily-login
```

#### Получение торговых артифактов

```javascript
const response = await fetch(
	'/api/template-views/artifacts?tradable=true&templateRarity=RARE&order=createdAt:DESC'
);
const data = await response.json();
console.log(data.data); // Редкие торговые артифакты
```

## Структура данных

Каждый элемент в ответе содержит:

### Поля из таблицы пользовательских данных

-   `id`, `userId`, `progress`, `completed`, и т.д.

### Поля из таблицы шаблона (с префиксом `template`)

-   `templateSlug`, `templateName`, `templateDescription`, и т.д.

### Пример ответа

```json
{
	"success": true,
	"data": [
		{
			"id": 1,
			"userId": 123,
			"level": 5,
			"progress": 75,
			"completed": false,
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
		"count": 1
	}
}
```

## Преимущества

1. **Производительность** - Один запрос вместо нескольких
2. **Удобство** - Все данные в одном месте
3. **Консистентность** - Данные всегда актуальны
4. **Гибкость** - Фильтрация и сортировка по любым полям
5. **Статистика** - Встроенные методы агрегации

## Безопасность

-   Все endpoints требуют аутентификации
-   Валидация Telegram WebApp данных
-   Пользователи получают только свои данные

## Откат изменений

Если нужно удалить view:

```bash
npx sequelize-cli db:migrate:undo
```

## Поддержка

Для вопросов и проблем обращайтесь к документации в `docs/template-views.md` или создавайте issue в репозитории.
