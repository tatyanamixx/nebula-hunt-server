# Развертывание

## Обзор

Документация по развертыванию Nebulahunt Server включает различные способы деплоя, конфигурацию окружения, мониторинг и поддержку системы в продакшене.

## Требования к окружению

### Системные требования

-   **Node.js**: 18.x или выше
-   **PostgreSQL**: 12.x или выше
-   **RAM**: минимум 512MB, рекомендуется 1GB+
-   **CPU**: минимум 1 ядро, рекомендуется 2+ ядра
-   **Диск**: минимум 10GB свободного места
-   **Сеть**: стабильное интернет-соединение

### Зависимости

```bash
# Основные зависимости
npm install

# Продакшн зависимости
npm ci --only=production
```

## Конфигурация окружения

### Переменные окружения

Создайте файл `.env` в корне проекта на основе файла `env.example`:

```bash
# Server Configuration
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-client-url.com

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=nebulahunt
DB_USER=postgres
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_ACCESS_SECRET=your_very_long_and_random_access_secret_key_here
JWT_REFRESH_SECRET=your_very_long_and_random_refresh_secret_key_here

# Telegram Configuration
BOT_TOKEN=your_telegram_bot_token

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Logging
LOG_LEVEL=info

# Security
CORS_ORIGIN=https://your-client-url.com
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=1000
```

### Генерация секретов

```bash
# Генерация JWT секретов
openssl rand -base64 64

# Или через Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Автоматическая инициализация

При первом запуске сервера автоматически выполняются следующие операции:

1. **Синхронизация базы данных**

    - Создание всех необходимых таблиц
    - Применение миграций схемы

2. **Инициализация комиссий маркета**

    - Загрузка комиссий из `config/market.config.js`
    - Создание записей в таблице `marketcommission`
    - Автоматическое обновление при изменении конфигурации

3. **Создание системного пользователя**
    - ID: -1 (или из переменной окружения `SYSTEM_USER_ID`)
    - Username: 'SYSTEM'
    - Role: 'SYSTEM'
    - Создание UserState с нулевыми балансами

**Примечание:** Все операции выполняются автоматически. Ручная инициализация не требуется.

## Способы развертывания

### 1. Docker (Рекомендуется)

Проект поставляется с полным набором Docker-конфигураций для различных сценариев использования.

#### Структура Docker-файлов

-   `Dockerfile` - Основной файл для продакшн-сборки
-   `Dockerfile.dev` - Файл для разработки с hot-reload
-   `docker-compose.yml` - Основная конфигурация для продакшена
-   `docker-compose.dev.yml` - Конфигурация для разработки
-   `docker-compose.migrate.yml` - Конфигурация для запуска миграций
-   `.dockerignore` - Файлы, исключаемые из Docker-контекста
-   `docker-scripts.sh` - Вспомогательные скрипты для работы с Docker
-   `env.example` - Пример файла с переменными окружения

#### Продакшн-окружение

Продакшн-сборка использует многоэтапную сборку для оптимизации размера образа:

```dockerfile
# Этап сборки
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Этап продакшена
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
COPY --from=builder /app ./

# Создание непривилегированного пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000
CMD ["npm", "start"]
```

#### Docker Compose для продакшена

```yaml
version: '3.8'

services:
    app:
        build:
            context: .
            dockerfile: Dockerfile
        restart: always
        ports:
            - '5000:5000'
        env_file: .env
        depends_on:
            - postgres
            - redis
        networks:
            - nebulahunt-network
        healthcheck:
            test:
                [
                    'CMD',
                    'wget',
                    '--no-verbose',
                    '--tries=1',
                    '--spider',
                    'http://localhost:5000/health',
                ]
            interval: 30s
            timeout: 10s
            retries: 3
            start_period: 10s

    postgres:
        image: postgres:15-alpine
        restart: always
        environment:
            POSTGRES_DB: ${DB_NAME:-nebulahunt}
            POSTGRES_USER: ${DB_USER:-postgres}
            POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
        volumes:
            - postgres_data:/var/lib/postgresql/data
        ports:
            - '5432:5432'
        networks:
            - nebulahunt-network
        healthcheck:
            test: ['CMD-SHELL', 'pg_isready -U postgres']
            interval: 10s
            timeout: 5s
            retries: 5

    redis:
        image: redis:7-alpine
        restart: always
        command: redis-server --requirepass ${REDIS_PASSWORD:-redis}
        volumes:
            - redis_data:/data
        ports:
            - '6379:6379'
        networks:
            - nebulahunt-network
        healthcheck:
            test: ['CMD', 'redis-cli', 'ping']
            interval: 10s
            timeout: 5s
            retries: 5

    pgadmin:
        image: dpage/pgadmin4
        restart: always
        environment:
            PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@nebulahunt.com}
            PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin}
        ports:
            - '5050:80'
        volumes:
            - pgadmin_data:/var/lib/pgadmin
        depends_on:
            - postgres
        networks:
            - nebulahunt-network

networks:
    nebulahunt-network:
        driver: bridge

volumes:
    postgres_data:
    redis_data:
    pgadmin_data:
```

#### Разработка с Docker

Для разработки предусмотрен отдельный Docker Compose файл с hot-reload и дополнительными инструментами:

```yaml
version: '3.8'

services:
    app:
        build:
            context: .
            dockerfile: Dockerfile.dev
        restart: always
        ports:
            - '5000:5000'
        env_file: .env.dev
        volumes:
            - .:/app
            - /app/node_modules
        depends_on:
            - postgres
            - redis
        networks:
            - nebulahunt-network-dev
        healthcheck:
            test:
                [
                    'CMD',
                    'wget',
                    '--no-verbose',
                    '--tries=1',
                    '--spider',
                    'http://localhost:5000/health',
                ]
            interval: 10s
            timeout: 5s
            retries: 3
            start_period: 5s

    postgres:
        image: postgres:15-alpine
        restart: always
        environment:
            POSTGRES_DB: ${DB_NAME:-nebulahunt_dev}
            POSTGRES_USER: ${DB_USER:-postgres}
            POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
        volumes:
            - postgres_data_dev:/var/lib/postgresql/data
        ports:
            - '5432:5432'
        networks:
            - nebulahunt-network-dev

    redis:
        image: redis:7-alpine
        restart: always
        command: redis-server --requirepass ${REDIS_PASSWORD:-redis}
        volumes:
            - redis_data_dev:/data
        ports:
            - '6379:6379'
        networks:
            - nebulahunt-network-dev

    pgadmin:
        image: dpage/pgadmin4
        restart: always
        environment:
            PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@nebulahunt.com}
            PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin}
        ports:
            - '5050:80'
        volumes:
            - pgadmin_data_dev:/var/lib/pgadmin
        depends_on:
            - postgres
        networks:
            - nebulahunt-network-dev

networks:
    nebulahunt-network-dev:
        driver: bridge

volumes:
    postgres_data_dev:
    redis_data_dev:
    pgadmin_data_dev:
```

#### Запуск миграций

Для запуска миграций используется отдельный Docker Compose файл:

```yaml
version: '3.8'

services:
    migrations:
        build:
            context: .
            dockerfile: Dockerfile
        command: npx sequelize-cli db:migrate
        env_file: .env
        depends_on:
            - postgres
        networks:
            - nebulahunt-network

    postgres:
        image: postgres:15-alpine
        environment:
            POSTGRES_DB: ${DB_NAME:-nebulahunt}
            POSTGRES_USER: ${DB_USER:-postgres}
            POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
        volumes:
            - postgres_data:/var/lib/postgresql/data
        networks:
            - nebulahunt-network

networks:
    nebulahunt-network:
        external: true

volumes:
    postgres_data:
        external: true
```

#### Вспомогательные скрипты

Для удобства работы с Docker созданы вспомогательные скрипты в файле `docker-scripts.sh`:

```bash
#!/bin/bash

# Функция для вывода справки
show_help() {
  echo "Использование: ./docker-scripts.sh [команда]"
  echo ""
  echo "Доступные команды:"
  echo "  start-prod     - Запуск продакшн-окружения"
  echo "  start-dev      - Запуск окружения для разработки"
  echo "  stop-prod      - Остановка продакшн-окружения"
  echo "  stop-dev       - Остановка окружения для разработки"
  echo "  build-prod     - Сборка продакшн-образа"
  echo "  build-dev      - Сборка образа для разработки"
  echo "  migrate        - Запуск миграций"
  echo "  logs           - Просмотр логов продакшн-окружения"
  echo "  logs-dev       - Просмотр логов окружения для разработки"
  echo "  clean          - Удаление всех контейнеров и образов"
  echo "  help           - Показать эту справку"
}

# Проверка наличия аргумента
if [ $# -eq 0 ]; then
  show_help
  exit 1
fi

# Обработка команд
case "$1" in
  start-prod)
    echo "Запуск продакшн-окружения..."
    docker-compose -f docker-compose.yml up -d
    ;;
  start-dev)
    echo "Запуск окружения для разработки..."
    docker-compose -f docker-compose.dev.yml up -d
    ;;
  stop-prod)
    echo "Остановка продакшн-окружения..."
    docker-compose -f docker-compose.yml down
    ;;
  stop-dev)
    echo "Остановка окружения для разработки..."
    docker-compose -f docker-compose.dev.yml down
    ;;
  build-prod)
    echo "Сборка продакшн-образа..."
    docker-compose -f docker-compose.yml build
    ;;
  build-dev)
    echo "Сборка образа для разработки..."
    docker-compose -f docker-compose.dev.yml build
    ;;
  migrate)
    echo "Запуск миграций..."
    docker-compose -f docker-compose.migrate.yml up --abort-on-container-exit
    ;;
  logs)
    echo "Просмотр логов продакшн-окружения..."
    docker-compose -f docker-compose.yml logs -f
    ;;
  logs-dev)
    echo "Просмотр логов окружения для разработки..."
    docker-compose -f docker-compose.dev.yml logs -f
    ;;
  clean)
    echo "Удаление всех контейнеров и образов..."
    docker-compose -f docker-compose.yml down -v
    docker-compose -f docker-compose.dev.yml down -v
    docker system prune -af --volumes
    ;;
  help)
    show_help
    ;;
  *)
    echo "Неизвестная команда: $1"
    show_help
    exit 1
    ;;
esac
```

#### Запуск с Docker

```bash
# Запуск продакшн-окружения
./docker-scripts.sh start-prod

# Запуск окружения для разработки
./docker-scripts.sh start-dev

# Запуск миграций
./docker-scripts.sh migrate

# Просмотр логов
./docker-scripts.sh logs

# Остановка окружения
./docker-scripts.sh stop-prod
```

### 2. PM2 (Process Manager)

#### Установка PM2

```bash
npm install -g pm2
```

#### Конфигурация PM2

Создайте файл `ecosystem.config.js`:

```javascript
module.exports = {
	apps: [
		{
			name: 'nebulahunt-server',
			script: 'index.js',
			instances: 'max',
			exec_mode: 'cluster',
			env: {
				NODE_ENV: 'development',
				PORT: 5000,
			},
			env_production: {
				NODE_ENV: 'production',
				PORT: 5000,
				DB_HOST: 'localhost',
				DB_PORT: 5432,
				DB_NAME: 'nebulahunt',
				DB_USER: 'postgres',
				DB_PASSWORD: 'your_password',
				JWT_ACCESS_SECRET: 'your_access_secret',
				JWT_REFRESH_SECRET: 'your_refresh_secret',
				BOT_TOKEN: 'your_bot_token',
			},
			error_file: './logs/err.log',
			out_file: './logs/out.log',
			log_file: './logs/combined.log',
			time: true,
			max_memory_restart: '1G',
			node_args: '--max-old-space-size=1024',
		},
	],
};
```

#### Команды PM2

```bash
# Запуск в продакшене
pm2 start ecosystem.config.js --env production

# Просмотр процессов
pm2 list

# Просмотр логов
pm2 logs nebulahunt-server

# Перезапуск
pm2 restart nebulahunt-server

# Остановка
pm2 stop nebulahunt-server

# Удаление из PM2
pm2 delete nebulahunt-server

# Мониторинг
pm2 monit

# Сохранение конфигурации
pm2 save

# Автозапуск при перезагрузке
pm2 startup
```

### 3. Nginx как Reverse Proxy

#### Конфигурация Nginx

```nginx
# /etc/nginx/sites-available/nebulahunt
server {
    listen 80;
    server_name your-domain.com;

    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL конфигурация
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Безопасные заголовки
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Логирование
    access_log /var/log/nginx/nebulahunt_access.log;
    error_log /var/log/nginx/nebulahunt_error.log;

    # Проксирование к приложению
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Статические файлы (если есть)
    location /static/ {
        alias /var/www/nebulahunt/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
```

#### Активация конфигурации

```bash
# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/nebulahunt /etc/nginx/sites-enabled/

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
```

### 4. Systemd Service

#### Создание сервиса

Создайте файл `/etc/systemd/system/nebulahunt.service`:

```ini
[Unit]
Description=Nebulahunt Server
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=nebulahunt
Group=nebulahunt
WorkingDirectory=/var/www/nebulahunt
Environment=NODE_ENV=production
Environment=PORT=5000
Environment=DB_HOST=localhost
Environment=DB_PORT=5432
Environment=DB_NAME=nebulahunt
Environment=DB_USER=nebulahunt
Environment=DB_PASSWORD=your_password
Environment=JWT_ACCESS_SECRET=your_access_secret
Environment=JWT_REFRESH_SECRET=your_refresh_secret
Environment=BOT_TOKEN=your_bot_token
ExecStart=/usr/bin/node index.js
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Управление сервисом

```bash
# Перезагрузка systemd
sudo systemctl daemon-reload

# Включение автозапуска
sudo systemctl enable nebulahunt

# Запуск сервиса
sudo systemctl start nebulahunt

# Проверка статуса
sudo systemctl status nebulahunt

# Просмотр логов
sudo journalctl -u nebulahunt -f

# Перезапуск
sudo systemctl restart nebulahunt

# Остановка
sudo systemctl stop nebulahunt
```

## Настройка базы данных

### PostgreSQL

#### Установка PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Создание базы данных

```bash
# Подключение к PostgreSQL
sudo -u postgres psql

# Создание пользователя и базы данных
CREATE USER nebulahunt WITH PASSWORD 'your_secure_password';
CREATE DATABASE nebulahunt OWNER nebulahunt;
GRANT ALL PRIVILEGES ON DATABASE nebulahunt TO nebulahunt;

# Выход
\q
```

#### Настройка PostgreSQL

Отредактируйте `/etc/postgresql/15/main/postgresql.conf`:

```conf
# Настройки производительности
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Настройки логирования
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = -1
log_autovacuum_min_duration = 0
log_error_verbosity = verbose

# Настройки безопасности
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
```

#### Настройка аутентификации

Отредактируйте `/etc/postgresql/15/main/pg_hba.conf`:

```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   nebulahunt      nebulahunt                              md5
host    nebulahunt      nebulahunt      127.0.0.1/32            md5
host    nebulahunt      nebulahunt      ::1/128                 md5
host    all             all             0.0.0.0/0               reject
```

### Инициализация базы данных

```bash
# Запуск миграций
npm run migrate

# Или вручную через Sequelize
npx sequelize-cli db:migrate

# Создание системного пользователя
node -e "require('./service/user-service').ensureSystemUserExists()"
```

## SSL/TLS сертификаты

### Let's Encrypt (Бесплатно)

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com

# Автоматическое обновление
sudo crontab -e
# Добавить строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Самоподписанный сертификат (для разработки)

```bash
# Генерация ключа
openssl genrsa -out key.pem 2048

# Генерация сертификата
openssl req -new -x509 -key key.pem -out cert.pem -days 365
```

## Мониторинг и логирование

### Логирование

#### Структура логов

```javascript
// config/logger.config.js
module.exports = {
	level: process.env.LOG_LEVEL || 'info',
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true,
			translateTime: 'SYS:standard',
			ignore: 'pid,hostname',
		},
	},
	serializers: {
		req: (req) => ({
			method: req.method,
			url: req.url,
			headers: req.headers,
			remoteAddress: req.connection.remoteAddress,
		}),
		res: (res) => ({
			statusCode: res.statusCode,
		}),
	},
};
```

#### Ротация логов

```bash
# /etc/logrotate.d/nebulahunt
/var/log/nebulahunt/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nebulahunt nebulahunt
    postrotate
        systemctl reload nebulahunt
    endscript
}
```

### Мониторинг

#### Health Check эндпоинт

```javascript
// routes/health-router.js
router.get('/health', (req, res) => {
	const health = {
		status: 'OK',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		memory: process.memoryUsage(),
		database: 'connected',
	};

	res.json(health);
});
```

#### Prometheus метрики

```javascript
const prometheus = require('prom-client');

// Создание метрик
const httpRequestDuration = new prometheus.Histogram({
	name: 'http_request_duration_seconds',
	help: 'Duration of HTTP requests in seconds',
	labelNames: ['method', 'route', 'status_code'],
});

// Middleware для сбора метрик
app.use((req, res, next) => {
	const start = Date.now();

	res.on('finish', () => {
		const duration = (Date.now() - start) / 1000;
		httpRequestDuration
			.labels(req.method, req.route?.path || req.path, res.statusCode)
			.observe(duration);
	});

	next();
});

// Эндпоинт для метрик
app.get('/metrics', async (req, res) => {
	res.set('Content-Type', prometheus.register.contentType);
	res.end(await prometheus.register.metrics());
});
```

## Резервное копирование

### Автоматические бэкапы

```bash
#!/bin/bash
# /usr/local/bin/backup-nebulahunt.sh

BACKUP_DIR="/var/backups/nebulahunt"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="nebulahunt"
DB_USER="nebulahunt"

# Создание директории для бэкапов
mkdir -p $BACKUP_DIR

# Бэкап базы данных
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Сжатие бэкапа
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

# Логирование
echo "Backup completed: db_backup_$DATE.sql.gz" >> $BACKUP_DIR/backup.log
```

#### Cron для автоматических бэкапов

```bash
# Добавить в crontab
0 2 * * * /usr/local/bin/backup-nebulahunt.sh
```

### Восстановление из бэкапа

```bash
# Восстановление базы данных
gunzip -c /var/backups/nebulahunt/db_backup_20240101_020000.sql.gz | psql -h localhost -U nebulahunt -d nebulahunt
```

## Обновление приложения

### Процесс обновления

```bash
#!/bin/bash
# /usr/local/bin/update-nebulahunt.sh

APP_DIR="/var/www/nebulahunt"
BACKUP_DIR="/var/backups/nebulahunt"

# Создание бэкапа перед обновлением
/usr/local/bin/backup-nebulahunt.sh

# Остановка приложения
sudo systemctl stop nebulahunt

# Переход в директорию приложения
cd $APP_DIR

# Получение обновлений
git pull origin main

# Установка зависимостей
npm ci --only=production

# Запуск миграций
npx sequelize-cli db:migrate

# Запуск приложения
sudo systemctl start nebulahunt

# Проверка статуса
sleep 10
if sudo systemctl is-active --quiet nebulahunt; then
    echo "Update completed successfully"
else
    echo "Update failed, rolling back..."
    # Логика отката
fi
```

## Troubleshooting

### Частые проблемы

#### 1. Проблемы с подключением к БД

```bash
# Проверка статуса PostgreSQL
sudo systemctl status postgresql

# Проверка подключения
psql -h localhost -U nebulahunt -d nebulahunt

# Проверка логов PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

#### 2. Проблемы с памятью

```bash
# Мониторинг использования памяти
free -h
top

# Проверка логов приложения
sudo journalctl -u nebulahunt -f
```

#### 3. Проблемы с сетью

```bash
# Проверка портов
netstat -tlnp | grep :5000

# Проверка firewall
sudo ufw status

# Проверка Nginx
sudo nginx -t
sudo systemctl status nginx
```

### Логи для диагностики

```bash
# Логи приложения
sudo journalctl -u nebulahunt -f

# Логи Nginx
sudo tail -f /var/log/nginx/nebulahunt_error.log

# Логи PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Логи системы
sudo dmesg | tail
```

## Производительность

### Оптимизация Node.js

```javascript
// Настройки для продакшена
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
	// Создание воркеров
	for (let i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	cluster.on('exit', (worker, code, signal) => {
		console.log(`Worker ${worker.process.pid} died`);
		cluster.fork();
	});
} else {
	// Код воркера
	require('./index.js');
}
```

### Оптимизация PostgreSQL

```sql
-- Анализ производительности
ANALYZE;

-- Создание индексов
CREATE INDEX CONCURRENTLY idx_users_referral ON users(referral);
CREATE INDEX CONCURRENTLY idx_userstates_user_id ON userstates(user_id);

-- Настройка автовакуума
ALTER TABLE users SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE userstates SET (autovacuum_vacuum_scale_factor = 0.1);
```

---

Этот документ предоставляет полное руководство по развертыванию Nebulahunt Server в различных окружениях, от простой установки до высоконагруженных продакшн систем.
