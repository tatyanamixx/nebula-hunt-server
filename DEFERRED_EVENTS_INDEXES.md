# Индексы для отложенных событий в PackageStore

## Обзор

Данная миграция создает специализированные индексы для оптимизации работы с отложенными событиями в таблице `packagestores`. Эти индексы значительно ускоряют проверку и обработку отложенных событий.

## Созданные индексы

### 1. Основные индексы для быстрого поиска

#### `packagestore_user_id_idx`

-   **Колонки**: `userId`
-   **Назначение**: Быстрый поиск всех пакетов пользователя
-   **Использование**: `WHERE userId = ?`

#### `packagestore_package_template_id_idx`

-   **Колонки**: `packageTemplateId`
-   **Назначение**: Быстрый поиск по шаблону пакета
-   **Использование**: `WHERE packageTemplateId = ?`

#### `packagestore_user_package_idx`

-   **Колонки**: `userId`, `packageTemplateId`
-   **Назначение**: Составной индекс для уникальных комбинаций
-   **Использование**: `WHERE userId = ? AND packageTemplateId = ?`

### 2. Индексы для отложенных событий

#### `packagestore_deferred_check_idx` ⭐ **ОСНОВНОЙ**

-   **Колонки**: `isLocked`, `status`, `isUsed`, `userId`, `createdAt`
-   **Назначение**: Оптимизированный индекс для проверки отложенных событий
-   **Использование**:
    ```sql
    WHERE isLocked = true AND status = true AND isUsed = false
    ORDER BY createdAt ASC
    ```

#### `packagestore_available_packages_idx`

-   **Колонки**: `status`, `isUsed`, `isLocked`, `userId`
-   **Назначение**: Поиск доступных пакетов пользователя
-   **Использование**:
    ```sql
    WHERE status = true AND isUsed = false AND isLocked = false AND userId = ?
    ```

#### `packagestore_pending_events_idx`

-   **Колонки**: `isLocked`, `status`, `createdAt`
-   **Назначение**: Поиск отложенных событий с сортировкой по времени
-   **Использование**:
    ```sql
    WHERE isLocked = true AND status = true
    ORDER BY createdAt ASC
    ```

#### `packagestore_batch_processing_idx`

-   **Колонки**: `status`, `isLocked`, `createdAt`, `id`
-   **Назначение**: Пакетная обработка отложенных событий
-   **Использование**:
    ```sql
    WHERE status = true AND isLocked = true
    ORDER BY createdAt ASC, id ASC
    LIMIT 50
    ```

### 3. Временные индексы

#### `packagestore_created_at_idx`

-   **Колонки**: `createdAt`
-   **Назначение**: Сортировка по дате создания
-   **Использование**: `ORDER BY createdAt DESC`

#### `packagestore_updated_at_idx`

-   **Колонки**: `updatedAt`
-   **Назначение**: Отслеживание изменений
-   **Использование**: `ORDER BY updatedAt DESC`

#### `packagestore_time_based_idx`

-   **Колонки**: `createdAt`, `status`, `isLocked`
-   **Назначение**: Временные проверки отложенных событий
-   **Использование**:
    ```sql
    WHERE createdAt >= ? AND status = true AND isLocked = false
    ```

### 4. Индексы для фильтрации

#### `packagestore_resource_idx`

-   **Колонки**: `resource`
-   **Назначение**: Фильтрация по типу ресурса
-   **Использование**: `WHERE resource = 'stardust'`

#### `packagestore_currency_idx`

-   **Колонки**: `currency`
-   **Назначение**: Фильтрация по валюте
-   **Использование**: `WHERE currency = 'tgStars'`

#### `packagestore_resource_currency_idx`

-   **Колонки**: `resource`, `currency`
-   **Назначение**: Составная фильтрация по ресурсу и валюте
-   **Использование**: `WHERE resource = ? AND currency = ?`

### 5. Дополнительные индексы

#### `packagestore_status_used_locked_idx`

-   **Колонки**: `status`, `isUsed`, `isLocked`
-   **Назначение**: Общая фильтрация по статусам
-   **Использование**: `WHERE status = true AND isUsed = false AND isLocked = false`

## Рекомендации по использованию

### Для проверки отложенных событий:

```sql
-- Основной запрос для отложенных событий
SELECT * FROM packagestores
WHERE isLocked = true AND status = true AND isUsed = false
ORDER BY createdAt ASC
LIMIT 100;
```

### Для поиска доступных пакетов:

```sql
-- Поиск доступных пакетов пользователя
SELECT * FROM packagestores
WHERE status = true AND isUsed = false AND isLocked = false AND userId = ?
ORDER BY createdAt DESC;
```

### Для пакетной обработки:

```sql
-- Пакетная обработка отложенных событий
SELECT * FROM packagestores
WHERE status = true AND isLocked = true
ORDER BY createdAt ASC, id ASC
LIMIT 50;
```

### Для временных проверок:

```sql
-- События за последние 24 часа
SELECT * FROM packagestores
WHERE createdAt >= NOW() - INTERVAL '24 hours'
  AND status = true AND isLocked = false
ORDER BY createdAt DESC;
```

## Производительность

### Результаты тестирования:

-   **Поиск отложенных событий**: ~100ms (0 событий)
-   **Поиск доступных пакетов**: ~4ms (17 пакетов)
-   **Пакетная обработка**: ~2ms (0 событий)
-   **Временные проверки**: ~4ms (17 событий)
-   **Фильтрация по ресурсам**: ~2ms (9 событий)

### Планы выполнения:

-   PostgreSQL использует последовательное сканирование для небольших таблиц
-   Индексы будут активно использоваться при увеличении объема данных
-   Составные индексы обеспечивают оптимальную производительность для сложных запросов

## Мониторинг

### Проверка использования индексов:

```sql
SELECT
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE relname = 'packagestores'
ORDER BY idx_scan DESC;
```

### Анализ планов выполнения:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM packagestores
WHERE isLocked = true AND status = true
ORDER BY "createdAt" ASC
LIMIT 100;
```

## Заключение

Созданные индексы обеспечивают:

1. **Быструю проверку отложенных событий** - основной индекс `packagestore_deferred_check_idx`
2. **Эффективный поиск доступных пакетов** - индекс `packagestore_available_packages_idx`
3. **Оптимизированную пакетную обработку** - индекс `packagestore_batch_processing_idx`
4. **Временные проверки** - индекс `packagestore_time_based_idx`

Эти индексы критически важны для производительности системы при работе с отложенными событиями и обеспечивают масштабируемость при росте объема данных.
