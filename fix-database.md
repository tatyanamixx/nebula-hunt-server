# Исправление базы данных

## Проблема

В базе данных есть множество дублирующихся записей супервизоров с одним email `tatyanamixx@gmail.com`.

## Решение

### 1. Подключитесь к PostgreSQL

```bash
psql -U postgres -d nebulahunt_dev
```

### 2. Выполните SQL-команды для очистки

```sql
-- Очистка дублирующихся записей супервизоров
DELETE FROM admins
WHERE id NOT IN (
    SELECT MIN(id)
    FROM admins
    WHERE email = 'tatyanamixx@gmail.com' AND role = 'SUPERVISOR'
    GROUP BY email
);

-- Добавляем уникальный индекс на поле email
CREATE UNIQUE INDEX IF NOT EXISTS admins_email_unique ON admins(email);

-- Проверяем результат
SELECT id, email, role, is_2fa_enabled, name
FROM admins
WHERE email = 'tatyanamixx@gmail.com' AND role = 'SUPERVISOR';
```

### 3. Выход из psql

```sql
\q
```

### 4. Перезапустите сервер

```bash
npm run dev
```

## Результат

После выполнения этих команд:

-   В базе данных останется только один супервизор с email `tatyanamixx@gmail.com`
-   Будет создан уникальный индекс на поле `email`, который предотвратит создание дубликатов в будущем
-   Сервер будет корректно инициализировать супервизора при запуске
