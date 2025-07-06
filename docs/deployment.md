# Развертывание

## Обзор

Документация по развертыванию Nebulahant Server включает различные способы деплоя, конфигурацию окружения, мониторинг и поддержку системы в продакшене.

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

Создайте файл `.env` в корне проекта:

```bash
# Server Configuration
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-client-url.com

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nebulahant
DB_USER=postgres
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_ACCESS_SECRET=your_very_long_and_random_access_secret_key_here
JWT_REFRESH_SECRET=your_very_long_and_random_refresh_secret_key_here

# Telegram Configuration
BOT_TOKEN=your_telegram_bot_token

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

#### Dockerfile

```dockerfile
# Используем официальный Node.js образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Меняем владельца файлов
RUN chown -R nodejs:nodejs /app
USER nodejs

# Открываем порт
EXPOSE 5000

# Запускаем приложение
CMD ["npm", "start"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
    app:
        build: .
        ports:
            - '5000:5000'
        environment:
            - NODE_ENV=production
            - DB_HOST=postgres
            - DB_PORT=5432
            - DB_NAME=nebulahant
            - DB_USER=postgres
            - DB_PASSWORD=your_password
            - JWT_ACCESS_SECRET=your_access_secret
            - JWT_REFRESH_SECRET=your_refresh_secret
            - BOT_TOKEN=your_bot_token
        depends_on:
            - postgres
        restart: unless-stopped
        networks:
            - nebulahant-network

    postgres:
        image: postgres:15-alpine
        environment:
            - POSTGRES_DB=nebulahant
            - POSTGRES_USER=postgres
            - POSTGRES_PASSWORD=your_password
        volumes:
            - postgres_data:/var/lib/postgresql/data
            - ./init.sql:/docker-entrypoint-initdb.d/init.sql
        ports:
            - '5432:5432'
        restart: unless-stopped
        networks:
            - nebulahant-network

    nginx:
        image: nginx:alpine
        ports:
            - '80:80'
            - '443:443'
        volumes:
            - ./nginx.conf:/etc/nginx/nginx.conf
            - ./ssl:/etc/nginx/ssl
        depends_on:
            - app
        restart: unless-stopped
        networks:
            - nebulahant-network

volumes:
    postgres_data:

networks:
    nebulahant-network:
        driver: bridge
```

#### Запуск с Docker

```bash
# Сборка и запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f app

# Остановка
docker-compose down

# Пересборка
docker-compose up -d --build
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
			name: 'nebulahant-server',
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
				DB_NAME: 'nebulahant',
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
pm2 logs nebulahant-server

# Перезапуск
pm2 restart nebulahant-server

# Остановка
pm2 stop nebulahant-server

# Удаление из PM2
pm2 delete nebulahant-server

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
# /etc/nginx/sites-available/nebulahant
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
    access_log /var/log/nginx/nebulahant_access.log;
    error_log /var/log/nginx/nebulahant_error.log;

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
        alias /var/www/nebulahant/static/;
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
sudo ln -s /etc/nginx/sites-available/nebulahant /etc/nginx/sites-enabled/

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
```

### 4. Systemd Service

#### Создание сервиса

Создайте файл `/etc/systemd/system/nebulahant.service`:

```ini
[Unit]
Description=Nebulahant Server
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=nebulahant
Group=nebulahant
WorkingDirectory=/var/www/nebulahant
Environment=NODE_ENV=production
Environment=PORT=5000
Environment=DB_HOST=localhost
Environment=DB_PORT=5432
Environment=DB_NAME=nebulahant
Environment=DB_USER=nebulahant
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
sudo systemctl enable nebulahant

# Запуск сервиса
sudo systemctl start nebulahant

# Проверка статуса
sudo systemctl status nebulahant

# Просмотр логов
sudo journalctl -u nebulahant -f

# Перезапуск
sudo systemctl restart nebulahant

# Остановка
sudo systemctl stop nebulahant
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
CREATE USER nebulahant WITH PASSWORD 'your_secure_password';
CREATE DATABASE nebulahant OWNER nebulahant;
GRANT ALL PRIVILEGES ON DATABASE nebulahant TO nebulahant;

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
local   nebulahant      nebulahant                              md5
host    nebulahant      nebulahant      127.0.0.1/32            md5
host    nebulahant      nebulahant      ::1/128                 md5
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
# /etc/logrotate.d/nebulahant
/var/log/nebulahant/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nebulahant nebulahant
    postrotate
        systemctl reload nebulahant
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
# /usr/local/bin/backup-nebulahant.sh

BACKUP_DIR="/var/backups/nebulahant"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="nebulahant"
DB_USER="nebulahant"

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
0 2 * * * /usr/local/bin/backup-nebulahant.sh
```

### Восстановление из бэкапа

```bash
# Восстановление базы данных
gunzip -c /var/backups/nebulahant/db_backup_20240101_020000.sql.gz | psql -h localhost -U nebulahant -d nebulahant
```

## Обновление приложения

### Процесс обновления

```bash
#!/bin/bash
# /usr/local/bin/update-nebulahant.sh

APP_DIR="/var/www/nebulahant"
BACKUP_DIR="/var/backups/nebulahant"

# Создание бэкапа перед обновлением
/usr/local/bin/backup-nebulahant.sh

# Остановка приложения
sudo systemctl stop nebulahant

# Переход в директорию приложения
cd $APP_DIR

# Получение обновлений
git pull origin main

# Установка зависимостей
npm ci --only=production

# Запуск миграций
npx sequelize-cli db:migrate

# Запуск приложения
sudo systemctl start nebulahant

# Проверка статуса
sleep 10
if sudo systemctl is-active --quiet nebulahant; then
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
psql -h localhost -U nebulahant -d nebulahant

# Проверка логов PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

#### 2. Проблемы с памятью

```bash
# Мониторинг использования памяти
free -h
top

# Проверка логов приложения
sudo journalctl -u nebulahant -f
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
sudo journalctl -u nebulahant -f

# Логи Nginx
sudo tail -f /var/log/nginx/nebulahant_error.log

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

Этот документ предоставляет полное руководство по развертыванию Nebulahant Server в различных окружениях, от простой установки до высоконагруженных продакшн систем.
