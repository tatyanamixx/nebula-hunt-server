# Безопасность - Переменные окружения

## ⚠️ ВАЖНО: Безопасность переменных окружения

Этот файл содержит полный список всех переменных окружения, используемых в проекте Nebulahunt Server.
**НИКОГДА не коммитьте реальные значения этих переменных в git репозиторий!**

## Полный список переменных окружения

### Основные настройки приложения

```bash
# Окружение выполнения
NODE_ENV=development|test|production

# Порт сервера
PORT=5000

# Уровень логирования
LOG_LEVEL=debug|info|warn|error

# Путь к файлу логов
LOG_FILE_PATH=logs/app.log
```

### База данных

#### Общие настройки (fallback для всех окружений)

```bash
# Основные настройки БД
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nebulahunt
DB_USER=postgres
DB_PASSWORD=postgres
```

#### Development окружение

```bash
# Development специфичные настройки БД
DB_HOST_DEV=localhost
DB_PORT_DEV=5432
DB_NAME_DEV=nebulahunt_dev
DB_USER_DEV=postgres
DB_PASSWORD_DEV=your_dev_password
DB_LOGGING=true
```

#### Test окружение

```bash
# Test специфичные настройки БД
DB_HOST_TEST=localhost
DB_PORT_TEST=5432
DB_NAME_TEST=nebulahunt_test
DB_USER_TEST=postgres
DB_PASSWORD_TEST=your_test_password
```

#### Production окружение

```bash
# Production специфичные настройки БД
DB_HOST_PROD=your-production-db-host.com
DB_PORT_PROD=5432
DB_NAME_PROD=nebulahunt_prod
DB_USER_PROD=nebulahunt_user
DB_PASSWORD_PROD=your_secure_production_password
```

#### SSL настройки для БД

```bash
# SSL конфигурация (для production)
DB_SSL=true|false
DB_SSL_CA_PATH=/path/to/ca-certificate.crt
DB_SSL_CERT_PATH=/path/to/client-certificate.crt
DB_SSL_KEY_PATH=/path/to/client-key.key
DB_SSL_REJECT_UNAUTHORIZED=true|false
```

### Redis

```bash
# Redis настройки
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### JWT токены

```bash
# JWT секреты (ОБЯЗАТЕЛЬНО измените в production!)
JWT_ACCESS_SECRET=your_very_secure_access_secret_key
JWT_REFRESH_SECRET=your_very_secure_refresh_secret_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
JWT_ISSUER=nebulahunt-server
JWT_ACCESS_AUDIENCE=nebulahunt-users
JWT_REFRESH_AUDIENCE=nebulahunt-users
```

### Telegram Bot

```bash
# Telegram Bot токен
BOT_TOKEN=your_telegram_bot_token

# Webhook URL для Telegram
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook
```

### Безопасность

```bash
# ID администраторов (через запятую)
ADMIN_IDS=123456789,987654321

# ID системного пользователя
SYSTEM_USER_ID=555666777

# Секрет для инициализации админа
ADMIN_INIT_SECRET=your_admin_init_secret

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# CORS настройки
CORS_ORIGIN=http://localhost:3000
CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com

# IP безопасность
BLACKLISTED_IPS=192.168.1.100,10.0.0.50
ADMIN_WHITELISTED_IPS=192.168.1.1,10.0.0.1
ADMIN_IP_RESTRICTION=true|false
```

### Мониторинг

```bash
# Prometheus метрики
PROMETHEUS_PORT=9090
METRICS_ENABLED=true|false
```

### Внешние сервисы

```bash
# TON Network
TON_NETWORK=mainnet|testnet
TON_API_KEY=your_ton_api_key
TON_WALLET_ADDRESS=your_ton_wallet_address
```

### Миграции

```bash
# Запуск миграций
RUN_MIGRATIONS=true|false
```

## Рекомендации по безопасности

### 1. Секретные ключи

-   **НИКОГДА** не используйте значения по умолчанию в production
-   Используйте криптографически стойкие случайные строки для JWT секретов
-   Регулярно ротируйте секретные ключи

### 2. База данных

-   Используйте отдельные пользователей БД для каждого окружения
-   В production используйте SSL соединения
-   Ограничьте права доступа пользователей БД

### 3. Telegram Bot

-   Храните токен бота в безопасном месте
-   Не публикуйте токен в публичных репозиториях
-   Используйте webhook только в production

### 4. Сетевая безопасность

-   Настройте firewall для ограничения доступа к БД
-   Используйте VPN для доступа к production серверам
-   Ограничьте доступ к административным функциям по IP

### 5. Мониторинг

-   Включите логирование всех важных событий
-   Настройте алерты для подозрительной активности
-   Регулярно проверяйте логи на предмет аномалий

## Примеры файлов окружения

### .env.development

```bash
NODE_ENV=development
PORT=5000
DB_HOST_DEV=localhost
DB_PORT_DEV=5432
DB_NAME_DEV=nebulahunt_dev
DB_USER_DEV=postgres
DB_PASSWORD_DEV=your_dev_password
DB_LOGGING=true
JWT_ACCESS_SECRET=dev_access_secret_key_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_key_change_in_production
BOT_TOKEN=your_telegram_bot_token_dev
ADMIN_IDS=123456789,987654321
SYSTEM_USER_ID=555666777
LOG_LEVEL=debug
TON_NETWORK=testnet
```

### .env.production

```bash
NODE_ENV=production
PORT=5000
DB_HOST_PROD=your-production-db-host.com
DB_PORT_PROD=5432
DB_NAME_PROD=nebulahunt_prod
DB_USER_PROD=nebulahunt_user
DB_PASSWORD_PROD=your_secure_production_password
DB_SSL=true
JWT_ACCESS_SECRET=your_very_secure_access_secret_key_production
JWT_REFRESH_SECRET=your_very_secure_refresh_secret_key_production
BOT_TOKEN=your_production_telegram_bot_token
ADMIN_IDS=123456789,987654321
SYSTEM_USER_ID=555666777
LOG_LEVEL=info
TON_NETWORK=mainnet
TON_API_KEY=your_ton_api_key_production
TON_WALLET_ADDRESS=your_ton_wallet_address_production
```

## Проверка безопасности

Перед деплоем в production убедитесь, что:

1. ✅ Все секретные ключи изменены с значений по умолчанию
2. ✅ SSL настроен для всех соединений с БД
3. ✅ Rate limiting настроен адекватно
4. ✅ CORS настроен только для разрешенных доменов
5. ✅ Логирование настроено на соответствующий уровень
6. ✅ IP ограничения настроены для административных функций
7. ✅ Все внешние API ключи валидны и имеют минимальные права доступа

## Экстренные меры

В случае компрометации:

1. Немедленно ротируйте все JWT секреты
2. Измените пароли БД
3. Перегенерируйте Telegram Bot токен
4. Проверьте логи на предмет несанкционированного доступа
5. Обновите все внешние API ключи
6. Проведите аудит безопасности
