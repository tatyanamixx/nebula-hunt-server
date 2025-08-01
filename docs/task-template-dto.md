# TaskTemplate DTO Documentation

## Обзор

`TaskTemplateDTO` - это Data Transfer Object для преобразования JSONB полей модели `TaskTemplate` между форматом базы данных и форматом, удобным для веб-форм.

## Основные методы

### `toFormFormat(taskTemplate)`

Преобразует объект `TaskTemplate` из базы данных в формат для веб-форм.

**Возвращает:**

```javascript
{
  ...taskTemplate,
  title: { en: 'English Title', ru: 'Русский заголовок' },
  description: { en: 'English Description', ru: 'Русское описание' },
  reward: { type: 'stardust', amount: 1000, multiplier: 1.0 },
  condition: { type: 'resource_threshold', days: [], amount: 100, operator: '>=', resource: 'stars', resetTime: '00:00' },
  rewardDisplay: '1000 stardust' // Новое поле для отображения в списке
}
```

### `fromFormFormat(formData)`

Преобразует данные из веб-формы обратно в формат для базы данных.

### `toFormFormatArray(taskTemplates)`

Преобразует массив объектов `TaskTemplate` в формат для веб-форм.

## Новое поле: `rewardDisplay`

Добавлено поле `rewardDisplay` для краткого отображения награды в списке Task Templates.

**Примеры:**

-   `"500 stardust"` - для обычной награды
-   `"100 darkMatter (x1.5)"` - для награды с множителем
-   `"1000 stars (x2)"` - для награды с большим множителем

## Форматы JSONB полей

### Title

```javascript
// База данных
{ "en": "English Title", "ru": "Русский заголовок" }

// Веб-форма
{ en: "English Title", ru: "Русский заголовок" }
```

### Description

```javascript
// База данных
{ "en": "English Description", "ru": "Русское описание" }

// Веб-форма
{ en: "English Description", ru: "Русское описание" }
```

### Reward

```javascript
// База данных
{ "type": "stardust", "amount": 1000, "multiplier": 1.5 }

// Веб-форма
{ type: "stardust", amount: 1000, multiplier: 1.5 }

// Отображение в списке
"1000 stardust (x1.5)"
```

### Condition

```javascript
// База данных
{
  "type": "resource_threshold",
  "days": [1, 2, 3, 4, 5, 6, 7],
  "amount": 100,
  "operator": ">=",
  "resource": "stars",
  "resetTime": "00:00"
}

// Веб-форма
{
  type: "resource_threshold",
  days: [1, 2, 3, 4, 5, 6, 7],
  amount: 100,
  operator: ">=",
  resource: "stars",
  resetTime: "00:00"
}
```

## Валидация

Метод `validateJsonbFields(formData)` проверяет корректность структуры JSONB полей и возвращает объект с ошибками валидации.

## Использование в контроллерах

```javascript
// Получение списка Task Templates
const tasks = await taskTemplateService.getTaskTemplates();
const formattedTasks = TaskTemplateDTO.toFormFormatArray(tasks);
// Теперь каждый task имеет поле rewardDisplay для отображения в списке

// Обновление Task Template
const formattedTaskData = TaskTemplateDTO.fromFormFormat(req.body);
const result = await taskTemplateService.updateTaskTemplate(formattedTaskData);
```
