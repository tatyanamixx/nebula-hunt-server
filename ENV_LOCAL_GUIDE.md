# Руководство по использованию .env.local

## 🎯 Что такое .env.local?

Файл `.env.local` предназначен для локальных настроек разработки, которые:

-   **НЕ попадают в git** (добавлен в .gitignore)
-   **Имеют высший приоритет** над переменными из `.env`
-   **Содержат персональные настройки** каждого разработчика

## 📁 Приоритет загрузки переменных окружения

1. **`.env.local`** (высший приоритет) - локальные настройки
2. **`.env`** - основные настройки проекта
3. **Системные переменные окружения** - системные настройки

## 🚀 Как использовать .env.local

### 1. Создание файла .env.local

```bash
# Автоматическое создание при настройке
npm run setup

# Или вручную
cp env.local.example .env.local
```

### 2. Настройка локальных переменных

Отредактируйте файл `.env.local`:

```env
# Локальные настройки базы данных
DB_HOST_DEV=localhost
DB_PORT_DEV=5432
DB_NAME_DEV=nebulahunt_dev_local
DB_USER_DEV=postgres
DB_PASSWORD_DEV=your_local_password

# Локальные секреты
JWT_ACCESS_SECRET=local_access_secret_key_change_this_in_production_64_chars_min
JWT_REFRESH_SECRET=local_refresh_secret_key_change_this_in_production_64_chars_min

# Google OAuth credentials (для администраторов)
GOOGLE_CLIENT_ID=your_local_google_client_id
GOOGLE_CLIENT_SECRET=your_local_google_client_secret

# Telegram Bot token (для пользователей игры)
BOT_TOKEN=your_local_telegram_bot_token

# Локальные настройки CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002,http://localhost:3003

# Локальные настройки логирования
LOG_LEVEL=debug
LOG_FILE_PATH=logs/app-local.log
```

### 3. Проверка загрузки переменных

```bash
# Проверка всех переменных окружения
npm run env:check

# Запуск сервера с выводом информации о переменных
npm run dev
```

## 🔧 Примеры использования

### Переопределение порта

```env
# В .env.local
PORT=3001

# В .env
PORT=5000

# Результат: сервер запустится на порту 3001
```

### Локальная база данных

```env
# В .env.local
DB_NAME_DEV=nebulahunt_dev_local
DB_PASSWORD_DEV=my_local_password

# В .env
DB_NAME_DEV=nebulahunt_dev
DB_PASSWORD_DEV=default_password

# Результат: используется локальная БД nebulahunt_dev_local
```

### Локальные секреты

```env
# В .env.local
JWT_ACCESS_SECRET=my_local_secret_key_for_development_only
GOOGLE_CLIENT_ID=my_local_google_client_id
GOOGLE_CLIENT_SECRET=my_local_google_client_secret
BOT_TOKEN=my_local_bot_token

# В .env
JWT_ACCESS_SECRET=default_secret_key
BOT_TOKEN=default_bot_token

# Результат: используются локальные секреты
```

## 📋 Типичные настройки для .env.local

### Для разработки

```env
# База данных
DB_HOST_DEV=localhost
DB_PORT_DEV=5432
DB_NAME_DEV=nebulahunt_dev_local
DB_USER_DEV=postgres
DB_PASSWORD_DEV=postgres
DB_LOGGING=true

# Секреты
JWT_ACCESS_SECRET=dev_access_secret_local_64_chars_min
JWT_REFRESH_SECRET=dev_refresh_secret_local_64_chars_min
GOOGLE_CLIENT_ID=your_local_google_client_id
GOOGLE_CLIENT_SECRET=your_local_google_client_secret
BOT_TOKEN=your_local_bot_token

# Безопасность
ADMIN_IDS=123456789
ADMIN_INIT_SECRET=local_admin_secret

# CORS
CORS_ORIGIN=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002

# Логирование
LOG_LEVEL=debug
LOG_FILE_PATH=logs/app-local.log

# Мониторинг
PROMETHEUS_PORT=9091
METRICS_ENABLED=true
```

### Для тестирования

```env
# База данных
DB_HOST_TEST=localhost
DB_PORT_TEST=5432
DB_NAME_TEST=nebulahunt_test_local
DB_USER_TEST=postgres
DB_PASSWORD_TEST=postgres

# Секреты
JWT_ACCESS_SECRET=test_access_secret_local_64_chars_min
JWT_REFRESH_SECRET=test_refresh_secret_local_64_chars_min
BOT_TOKEN=test_bot_token

# Логирование
LOG_LEVEL=error
LOG_FILE_PATH=logs/app-test.log
```

## 🔍 Диагностика проблем

### Проверка загрузки переменных

```bash
npm run env:check
```

Вывод покажет:

-   Какие файлы загружены
-   Какие переменные установлены
-   Какие переменные отсутствуют
-   Рекомендации по исправлению

### Проверка приоритета

```bash
# Создайте тестовые переменные
echo "TEST_VAR=from_env" >> .env
echo "TEST_VAR=from_env_local" >> .env.local

# Запустите проверку
npm run env:check

# Результат: TEST_VAR будет иметь значение "from_env_local"
```

## ⚠️ Важные моменты

### Безопасность

1. **Никогда не коммитьте .env.local** - файл уже в .gitignore
2. **Используйте разные секреты** для каждого окружения
3. **Не используйте продакшен секреты** в локальных файлах

### Совместимость

1. **Все переменные из .env** должны быть доступны в .env.local
2. **Новые переменные** добавляйте сначала в .env, затем в .env.local
3. **Проверяйте совместимость** при обновлении переменных

### Рекомендации

1. **Документируйте изменения** в .env.local
2. **Используйте понятные имена** для локальных переменных
3. **Регулярно проверяйте** загрузку переменных
4. **Создавайте резервные копии** важных настроек

## 🚀 Команды для работы с .env.local

```bash
# Создание .env.local
cp env.local.example .env.local

# Проверка переменных
npm run env:check

# Запуск с выводом информации
npm run dev

# Тестирование подключения к БД
node test-db-connection.js

# Запуск миграций
npm run migrate
```

## 📚 Связанная документация

-   [Настройки сервера](SERVER_CONFIG.md)
-   [Быстрый запуск](QUICK_START.md)
-   [Исправления переменных окружения](ENV_FIXES.md)
