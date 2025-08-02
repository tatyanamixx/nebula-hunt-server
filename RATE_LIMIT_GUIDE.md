# Rate Limit Guide

## Обзор

В проекте используется `rateLimitMiddleware` для ограничения количества запросов к API. Второй параметр указывается в **минутах**.

## Синтаксис

```javascript
rateLimitMiddleware(maxRequests, windowMinutes);
```

-   `maxRequests` - максимальное количество запросов
-   `windowMinutes` - временное окно в минутах

## Примеры использования

### Базовые примеры

```javascript
// 5 запросов в минуту
rateLimitMiddleware(5, 1);

// 30 запросов в час
rateLimitMiddleware(30, 60);

// 100 запросов в день
rateLimitMiddleware(100, 1440);

// 10 запросов в 2.5 дня
rateLimitMiddleware(10, 3600);
```

### Распространенные паттерны

| Запросы | Временное окно | Описание              | Пример                           |
| ------- | -------------- | --------------------- | -------------------------------- |
| 5       | 1 минута       | 5 запросов в минуту   | `rateLimitMiddleware(5, 1)`      |
| 30      | 60 минут       | 30 запросов в час     | `rateLimitMiddleware(30, 60)`    |
| 100     | 1440 минут     | 100 запросов в день   | `rateLimitMiddleware(100, 1440)` |
| 10      | 3600 минут     | 10 запросов в 2.5 дня | `rateLimitMiddleware(10, 3600)`  |

## Использование в роутерах

### Game Router

```javascript
// Фарминг наград - 30 запросов в час
rateLimitMiddleware(30, 60), // 30 requests per hour

// Создание галактики - 20 запросов в час
rateLimitMiddleware(20, 60), // 20 requests per hour

// Ежедневные награды - 5 запросов в час
rateLimitMiddleware(5, 60), // 5 requests per hour
```

### Admin Router

```javascript
// Аутентификация - 100 запросов в час
rateLimitMiddleware(100, 60), // 100 requests per hour

// Инициализация супервизора - 10 запросов в 2.5 дня
rateLimitMiddleware(10, 3600), // 10 requests per 60 hours (2.5 days)

// Управление паролями - 50 запросов в час
rateLimitMiddleware(50, 60), // 50 requests per hour
```

### Artifact Router

```javascript
// Получение артефактов - 60 запросов в час
rateLimitMiddleware(60, 60), // 60 requests per hour

// Генерация артефактов - 10 запросов в час
rateLimitMiddleware(10, 60), // 10 requests per hour

// Активация артефактов - 30 запросов в час
rateLimitMiddleware(30, 60), // 30 requests per hour
```

## Рекомендации

### Для разных типов операций

1. **Чтение данных (GET)**: 60-100 запросов в час
2. **Запись данных (POST/PUT)**: 20-50 запросов в час
3. **Критические операции**: 5-10 запросов в час
4. **Аутентификация**: 100 запросов в час
5. **Административные функции**: 50-100 запросов в час

### Примеры для разных сценариев

```javascript
// Часто используемые операции (просмотр данных)
rateLimitMiddleware(60, 60), // 60 requests per hour

// Умеренно используемые операции (создание/обновление)
rateLimitMiddleware(30, 60), // 30 requests per hour

// Редко используемые операции (удаление, критические действия)
rateLimitMiddleware(10, 60), // 10 requests per hour

// Очень редкие операции (регистрация, инициализация)
rateLimitMiddleware(5, 60), // 5 requests per hour
```

## Отладка

Для отключения rate limit во время разработки установите переменную окружения:

```bash
DISABLE_RATE_LIMIT=true
```

## Примечания

-   Второй параметр всегда указывается в **минутах**
-   `rateLimitMiddleware(5, 60)` означает **5 запросов в час**, а не в минуту
-   Для получения запросов в минуту используйте `rateLimitMiddleware(5, 1)`
-   Комментарии в коде должны точно отражать временные интервалы
