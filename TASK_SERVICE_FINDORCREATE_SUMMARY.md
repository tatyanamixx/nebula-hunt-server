# TaskService.initializeUserTasks - Рефакторинг с findOrCreate

## Обзор изменений

Метод `initializeUserTasks` в `TaskService` был переписан для использования `findOrCreate` вместо `findOne` + `create`, а также интегрирован с системой кодов ошибок `error-codes.js`.

## Основные улучшения

### 1. Использование findOrCreate

-   **Было**: `findOne` + проверка существования + `create`
-   **Стало**: `findOrCreate` с автоматической проверкой дубликатов
-   **Преимущества**:
    -   Атомарная операция
    -   Предотвращение race conditions
    -   Более чистый код

### 2. Интеграция с error-codes.js

-   Добавлен импорт `ERROR_CODES` из `config/error-codes.js`
-   Использование специфичных кодов ошибок:
    -   `ERROR_CODES.TASK.TASK_TEMPLATE_NOT_FOUND` - для ошибок создания задач
    -   `ERROR_CODES.SYSTEM.DATABASE_ERROR` - для общих ошибок БД

### 3. Улучшенное логирование

-   Детальное логирование каждого этапа
-   Логирование успешных операций и ошибок
-   Контекстная информация для отладки

### 4. Обработка ошибок

-   Try-catch блоки для каждой критической операции
-   Graceful degradation для некритичных ошибок
-   Сохранение транзакционной целостности

## Изменения в коде

### Импорты

```javascript
// Добавлен импорт кодов ошибок
const { ERROR_CODES } = require('../config/error-codes');
```

### Основная логика

```javascript
// Было:
let userTask = await UserTask.findOne({ where: { userId, slug: task.slug } });
if (!userTask) {
    userTask = await UserTask.create({ ... });
}

// Стало:
const [userTask, created] = await UserTask.findOrCreate({
    where: { userId, taskTemplateId: taskTemplate.id },
    defaults: { ... },
    transaction: t,
});
```

### Обработка ошибок

```javascript
// Было:
throw ApiError.Internal(`Failed to initialize user tasks: ${err.message}`);

// Стало:
throw ApiError.Internal(
	`Failed to initialize user tasks: ${err.message}`,
	ERROR_CODES.SYSTEM.DATABASE_ERROR
);
```

## Новые возможности

### 1. Обновление счетчиков UserState

-   Автоматическое обновление `activeTasksCount` и `ownedTasksCount`
-   Обработка случаев, когда `state` не существует

### 2. Расчет наград

-   Безопасный расчет общей награды за выполненные задачи
-   Обработка некорректных данных наград

### 3. Транзакционная безопасность

-   Поддержка внешних транзакций
-   Правильная обработка commit/rollback

## Тестирование

Создан тестовый файл `test-task-service-findorcreate.js` для проверки:

-   Создания задач при первом вызове
-   Отсутствия дубликатов при повторных вызовах
-   Обновления UserState
-   Работы с транзакциями

## Обратная совместимость

Метод сохраняет ту же сигнатуру и возвращаемые данные, что обеспечивает обратную совместимость с существующим кодом.

## Производительность

-   Уменьшение количества запросов к БД за счет `findOrCreate`
-   Параллельное выполнение операций с `Promise.all`
-   Оптимизированные запросы для подсчета задач

## Безопасность

-   Валидация входных данных
-   Защита от SQL-инъекций через Sequelize
-   Правильная обработка BigInt значений
