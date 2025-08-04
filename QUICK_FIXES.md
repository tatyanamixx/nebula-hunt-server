# Исправления документации Nebulahunt Server

## 🚨 Основные исправления

### 1. Порт сервера

**Было:** `PORT=3001`  
**Стало:** `PORT=5000`

### 2. Файл окружения

**Было:** `cp env.example .env`  
**Стало:** `cp env.development.example .env`

### 3. Эндпоинт аутентификации

**Было:** `POST /api/auth/register` и `POST /api/auth/login`  
**Стало:** `POST /api/auth/login` (универсальный вход/регистрация через Telegram)

### 4. Эндпоинт профиля

**Было:** `GET /api/user/profile`  
**Стало:** `GET /api/state` (состояние пользователя)

### 5. Эндпоинт дерева улучшений

**Было:** `GET /api/upgrades` (дерево улучшений)  
**Стало:** `GET /api/upgrades` (список улучшений пользователя) и `GET /api/upgrades/tree` (дерево улучшений)

## 🔗 Актуальные URL для проверки

-   **Health check:** http://localhost:5000/health
-   **API документация:** http://localhost:5000/api-docs
-   **Prometheus метрики:** http://localhost:5000/metrics

## 📋 Минимальная конфигурация .env

```env
NODE_ENV=development
PORT=5000
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

## 🚀 Быстрый старт (исправленный)

```bash
# 1. Установка зависимостей
npm install

# 2. Создание базы данных
createdb nebulahunt_dev

# 3. Настройка окружения
cp env.development.example .env
# Отредактируйте .env файл

# 4. Запуск миграций
npm run migrate

# 5. Заполнение демо-данными (опционально)
npm run seed

# 6. Запуск сервера
npm run dev
```

## 🔧 Инициализация админа

```bash
curl -X POST http://localhost:5000/api/admin/init \
  -H "Content-Type: application/json" \
  -d '{
    "adminId": YOUR_TELEGRAM_ID,
    "secret": "dev_admin_secret_change_in_production"
  }'
```

## 📱 Настройка фронтенда

```env
VITE_API_URL=http://localhost:5000/api
VITE_DEV_MODE=true
VITE_MOCK_API=false
```

## 📚 Обновленные файлы документации

-   ✅ `README.md` - обновлен с актуальными эндпоинтами
-   ✅ `QUICK_START.md` - исправлен порт и эндпоинты
-   ✅ `API_ENDPOINTS.md` - новый файл с полным списком эндпоинтов

## 🐛 Частые ошибки

### Ошибка подключения к БД

```bash
# Проверьте, что PostgreSQL запущен
sudo systemctl status postgresql

# Проверьте подключение
psql -U postgres -d nebulahunt_dev
```

### Ошибка CORS

-   Убедитесь, что `CORS_ORIGIN` и `ALLOWED_ORIGINS` содержат правильные URL
-   Проверьте, что фронтенд работает на указанном порту

### Ошибка Telegram WebApp

-   Проверьте `BOT_TOKEN` в `.env`
-   Убедитесь, что бот настроен правильно

### Ошибка загрузки .env

-   Убедитесь, что файл `.env` существует в корне проекта
-   Проверьте синтаксис файла
-   Убедитесь, что переменные не содержат специальных символов
