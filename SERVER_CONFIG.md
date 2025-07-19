# Настройки сервера Nebulahunt

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка базы данных

```bash
# Создание базы данных PostgreSQL
createdb nebulahunt_dev

# Запуск миграций
npm run migrate

# Заполнение тестовыми данными (опционально)
npm run seed
```

### 3. Настройка переменных окружения

Создайте файл `.env` на основе `env.example`

### 4. Запуск сервера

```bash
# Режим разработки
npm run dev

# Продакшен
npm start
```

## Конфигурация окружений

### Development (.env.development)

```env
# =============================================================================
# APPLICATION SETTINGS
# =============================================================================
NODE_ENV=development
PORT=3001

# =============================================================================
# LOGGING
# =============================================================================
LOG_LEVEL=debug
LOG_FILE_PATH=logs/app.log

# =============================================================================
# DATABASE - DEVELOPMENT
# =============================================================================
DB_HOST_DEV=localhost
DB_PORT_DEV=5432
DB_NAME_DEV=nebulahunt_dev
DB_USER_DEV=postgres
DB_PASSWORD_DEV=your_dev_password
DB_LOGGING=true

# =============================================================================
# JWT TOKENS
# =============================================================================
JWT_ACCESS_SECRET=dev_access_secret_key_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_key_change_in_production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# =============================================================================
# TELEGRAM BOT
# =============================================================================
BOT_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_URL=http://localhost:3001/webhook

# =============================================================================
# SECURITY
# =============================================================================
ADMIN_IDS=123456789
SYSTEM_USER_ID=-1
ADMIN_INIT_SECRET=dev_admin_secret

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=1000

# CORS настройки
CORS_ORIGIN=http://localhost:3000
CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000

# IP безопасность
ADMIN_IP_RESTRICTION=false

# =============================================================================
# MONITORING
# =============================================================================
PROMETHEUS_PORT=9090
METRICS_ENABLED=true

# =============================================================================
# EXTERNAL SERVICES
# =============================================================================
TON_NETWORK=testnet
TON_API_KEY=your_ton_api_key
TON_WALLET_ADDRESS=your_ton_wallet_address

# =============================================================================
# MIGRATIONS
# =============================================================================
RUN_MIGRATIONS=true
```

### Production (.env.production)

```env
# =============================================================================
# APPLICATION SETTINGS
# =============================================================================
NODE_ENV=production
PORT=3001

# =============================================================================
# LOGGING
# =============================================================================
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log

# =============================================================================
# DATABASE - PRODUCTION
# =============================================================================
DB_HOST_PROD=your-production-db-host.com
DB_PORT_PROD=5432
DB_NAME_PROD=nebulahunt_prod
DB_USER_PROD=nebulahunt_user
DB_PASSWORD_PROD=your_secure_production_password
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

# =============================================================================
# REDIS
# =============================================================================
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# =============================================================================
# JWT TOKENS
# =============================================================================
JWT_ACCESS_SECRET=your_very_secure_access_secret_key_64_chars_min
JWT_REFRESH_SECRET=your_very_secure_refresh_secret_key_64_chars_min
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# =============================================================================
# TELEGRAM BOT
# =============================================================================
BOT_TOKEN=your_real_telegram_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook

# =============================================================================
# SECURITY
# =============================================================================
ADMIN_IDS=123456789,987654321
SYSTEM_USER_ID=-1
ADMIN_INIT_SECRET=your_secure_admin_init_secret

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# CORS настройки
CORS_ORIGIN=https://your-domain.com
CLIENT_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com

# IP безопасность
BLACKLISTED_IPS=192.168.1.100,10.0.0.50
ADMIN_WHITELISTED_IPS=192.168.1.1,10.0.0.1
ADMIN_IP_RESTRICTION=true

# =============================================================================
# MONITORING
# =============================================================================
PROMETHEUS_PORT=9090
METRICS_ENABLED=true

# =============================================================================
# EXTERNAL SERVICES
# =============================================================================
TON_NETWORK=mainnet
TON_API_KEY=your_ton_api_key
TON_WALLET_ADDRESS=your_ton_wallet_address

# =============================================================================
# MIGRATIONS
# =============================================================================
RUN_MIGRATIONS=false
```

## Структура проекта

```
nebulahunt-server/
├── config/                 # Конфигурационные файлы
│   ├── database.js        # Настройки базы данных
│   ├── constants.js       # Константы приложения
│   └── logger.config.js   # Настройки логирования
├── controllers/           # Контроллеры API
├── middlewares/          # Middleware функции
├── models/              # Модели Sequelize
├── routes/              # Маршруты API
├── service/             # Бизнес-логика
├── migrations/          # Миграции базы данных
├── seeders/            # Сидеры для тестовых данных
├── tests/              # Тесты
├── logs/               # Логи приложения
├── app.js              # Основной файл приложения
├── index.js            # Точка входа
└── package.json        # Зависимости и скрипты
```

## API Endpoints

### Аутентификация

-   `POST /api/admin/login` - Вход через Telegram WebApp
-   `POST /api/admin/2fa/verify` - Проверка 2FA
-   `POST /api/admin/logout` - Выход
-   `POST /api/admin/init` - Инициализация админа

### Пользователи

-   `GET /api/admin/users` - Список пользователей
-   `POST /api/admin/users/:id/block` - Блокировка пользователя
-   `POST /api/admin/users/:id/unblock` - Разблокировка пользователя

### Настройки

-   `GET /api/admin/settings` - Получение настроек игры
-   `PUT /api/admin/settings` - Обновление настроек

### Статистика

-   `GET /api/admin/stats` - Статистика игры

### Мониторинг

-   `GET /health` - Проверка здоровья сервера
-   `GET /metrics` - Prometheus метрики
-   `/api-docs` - Swagger документация

## Безопасность

### Middleware

-   **Helmet** - Заголовки безопасности
-   **CORS** - Настройки CORS
-   **Rate Limiting** - Ограничение запросов
-   **IP Security** - Блокировка IP адресов
-   **Request Validation** - Валидация запросов
-   **Telegram Auth** - Аутентификация через Telegram

### Настройки безопасности

```javascript
// Пример настроек безопасности
const securityConfig = {
	rateLimit: {
		windowMs: 15 * 60 * 1000, // 15 минут
		max: 100, // максимум 100 запросов
	},
	cors: {
		origin: process.env.ALLOWED_ORIGINS.split(','),
		credentials: true,
	},
	helmet: {
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				scriptSrc: ["'self'"],
			},
		},
	},
};
```

## Мониторинг и логирование

### Логирование

```javascript
// Уровни логирования
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
}

// Формат логов
{
  timestamp: '2024-01-01T00:00:00.000Z',
  level: 'info',
  message: 'Server started',
  service: 'nebulahunt-server',
  version: '1.0.0'
}
```

### Prometheus метрики

-   HTTP запросы (количество, время ответа)
-   Ошибки базы данных
-   Использование памяти
-   Активные соединения

## Развертывание

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'
services:
    app:
        build: .
        ports:
            - '3001:3001'
        environment:
            - NODE_ENV=production
        depends_on:
            - postgres
            - redis

    postgres:
        image: postgres:15
        environment:
            POSTGRES_DB: nebulahunt
            POSTGRES_USER: nebulahunt_user
            POSTGRES_PASSWORD: your_password
        volumes:
            - postgres_data:/var/lib/postgresql/data

    redis:
        image: redis:7-alpine
        command: redis-server --requirepass your_redis_password

volumes:
    postgres_data:
```

### PM2

```javascript
// ecosystem.config.js
module.exports = {
	apps: [
		{
			name: 'nebulahunt-server',
			script: 'index.js',
			instances: 'max',
			exec_mode: 'cluster',
			env: {
				NODE_ENV: 'production',
				PORT: 3001,
			},
			error_file: './logs/err.log',
			out_file: './logs/out.log',
			log_file: './logs/combined.log',
			time: true,
		},
	],
};
```

## Скрипты

### package.json scripts

```json
{
	"scripts": {
		"start": "node index.js",
		"dev": "nodemon index.js",
		"test": "jest",
		"test:watch": "jest --watch",
		"migrate": "node run-migrations.js",
		"seed": "node seeders/index.js",
		"lint": "eslint .",
		"lint:fix": "eslint . --fix"
	}
}
```

## Troubleshooting

### Частые проблемы

1. **Ошибка подключения к БД**

    - Проверьте настройки DB_HOST, DB_PORT, DB_NAME
    - Убедитесь, что PostgreSQL запущен
    - Проверьте права доступа пользователя

2. **Ошибки CORS**

    - Проверьте CORS_ORIGIN в настройках
    - Убедитесь, что клиент отправляет правильные заголовки

3. **Ошибки Telegram WebApp**

    - Проверьте BOT_TOKEN
    - Убедитесь, что бот настроен правильно
    - Проверьте webhook URL

4. **Проблемы с JWT**
    - Проверьте JWT_ACCESS_SECRET и JWT_REFRESH_SECRET
    - Убедитесь, что токены не истекли

### Логи

```bash
# Просмотр логов
tail -f logs/app.log

# Поиск ошибок
grep "ERROR" logs/app.log

# Мониторинг в реальном времени
pm2 logs nebulahunt-server
```
