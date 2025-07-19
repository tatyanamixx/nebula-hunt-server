# Быстрый запуск Nebulahunt Server

## 🚀 Автоматическая настройка

```bash
# Клонируйте репозиторий (если еще не сделали)
git clone <repository-url>
cd nebulahunt-server

# Запустите автоматическую настройку
node setup-server.js
```

## 📋 Ручная настройка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка базы данных PostgreSQL

```bash
# Создайте базу данных
createdb nebulahunt_dev

# Или через psql
psql -U postgres -c "CREATE DATABASE nebulahunt_dev;"
```

### 3. Настройка переменных окружения

```bash
# Скопируйте пример конфигурации
cp env.example .env

# Отредактируйте .env файл
# Минимальные настройки для разработки:
```

```env
NODE_ENV=development
PORT=3001
DB_HOST_DEV=localhost
DB_PORT_DEV=5432
DB_NAME_DEV=nebulahunt_dev
DB_USER_DEV=postgres
DB_PASSWORD_DEV=postgres
DB_LOGGING=true
JWT_ACCESS_SECRET=dev_access_secret_key_change_in_production_64_chars_min
JWT_REFRESH_SECRET=dev_refresh_secret_key_change_in_production_64_chars_min
BOT_TOKEN=your_telegram_bot_token_here
ADMIN_IDS=123456789
ADMIN_INIT_SECRET=dev_admin_secret_change_in_production
CORS_ORIGIN=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002
```

### 4. Запуск миграций и сидеров

```bash
# Создание таблиц
npm run migrate

# Заполнение тестовыми данными
npm run seed
```

### 5. Запуск сервера

```bash
# Режим разработки
npm run dev

# Или продакшен
npm start
```

## ✅ Проверка работы

1. **Health check**: http://localhost:3001/health
2. **API документация**: http://localhost:3001/api-docs
3. **Prometheus метрики**: http://localhost:3001/metrics

## 🔧 Настройка Telegram бота

1. Создайте бота через @BotFather
2. Получите токен бота
3. Добавьте токен в `.env` файл:
    ```env
    BOT_TOKEN=your_telegram_bot_token_here
    ```

## 🎯 Инициализация админа

```bash
# Через API (замените YOUR_ADMIN_ID на ваш Telegram ID)
curl -X POST http://localhost:3001/api/admin/init \
  -H "Content-Type: application/json" \
  -d '{
    "adminId": YOUR_ADMIN_ID,
    "secret": "dev_admin_secret_change_in_production"
  }'
```

## 📱 Подключение фронтенда

Фронтенд должен быть настроен для работы с сервером:

```env
# В .env файле фронтенда
VITE_API_URL=http://localhost:3001/api
VITE_DEV_MODE=true
VITE_MOCK_API=false
```

## 🐛 Troubleshooting

### Проверка переменных окружения

```bash
# Проверьте загрузку переменных окружения
npm run env:check

# Проверьте подключение к базе данных
node test-db-connection.js
```

### Ошибка подключения к БД

```bash
# Проверьте статус PostgreSQL
sudo systemctl status postgresql

# Проверьте подключение
psql -U postgres -d nebulahunt_dev

# Проверьте настройки в .env
npm run env:check
```

### Ошибки CORS

-   Убедитесь, что `CORS_ORIGIN` и `ALLOWED_ORIGINS` содержат правильные URL
-   Проверьте, что фронтенд работает на указанном порту

### Ошибки Telegram WebApp

-   Проверьте `BOT_TOKEN` в `.env`
-   Убедитесь, что бот настроен правильно
-   Проверьте webhook URL

### Проблемы с загрузкой .env

-   Убедитесь, что файл `.env` существует в корне проекта
-   Проверьте синтаксис файла (нет ли лишних пробелов, кавычек)
-   Убедитесь, что переменные не содержат специальных символов

## 📚 Дополнительная документация

-   [Полная документация](SERVER_CONFIG.md)
-   [API документация](docs/api.md)
-   [Архитектура](docs/architecture.md)
-   [Безопасность](docs/security.md)
