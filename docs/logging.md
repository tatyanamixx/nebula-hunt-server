# Система логирования Nebulahunt Server

## Обзор

Проект использует [Pino](https://getpino.io/) - высокопроизводительный JSON логгер для Node.js. Логирование настроено для разных окружений с возможностью гибкой настройки уровней.

## Уровни логирования

### Доступные уровни (от менее к более детальным):

1. **`error`** - только ошибки
2. **`warn`** - предупреждения и ошибки
3. **`info`** - основная информация, предупреждения и ошибки
4. **`debug`** - отладочная информация (по умолчанию для разработки)
5. **`trace`** - максимальная детализация

### Рекомендуемые настройки по окружениям:

-   **Development**: `debug` - полная отладочная информация
-   **Test**: `error` - только ошибки для быстрых тестов
-   **Production**: `info` - основная информация без отладочных данных

## Конфигурация

### Автоматическое переключение уровней

```bash
# Установить уровень debug
npm run log:debug

# Установить уровень info
npm run log:info

# Установить уровень error
npm run log:error

# Показать текущий уровень
npm run log:current
```

### Ручная настройка

#### Через переменные окружения:

```bash
# В .env файле
LOG_LEVEL=debug
```

#### Через конфигурацию:

```javascript
// config/logger.config.js
const development = {
	level: process.env.LOG_LEVEL || 'debug',
	// ...
};
```

## Использование в коде

### Основной логгер

```javascript
const logger = require('../service/logger-service');

// Разные уровни логирования
logger.error('Критическая ошибка', { error: err, userId: 123 });
logger.warn('Предупреждение', { warning: 'Rate limit exceeded' });
logger.info('Информация', { action: 'user_login', userId: 123 });
logger.debug('Отладочная информация', {
	request: req.body,
	headers: req.headers,
});
```

### Структурированное логирование

```javascript
// Логирование с контекстом
logger.info('User registered successfully', {
	userId: user.id,
	username: user.username,
	referral: referral,
	timestamp: new Date().toISOString(),
});

// Логирование ошибок
logger.error('Database connection failed', {
	error: err.message,
	stack: err.stack,
	database: process.env.DB_HOST,
	timestamp: new Date().toISOString(),
});
```

### Логирование в middleware

```javascript
// middlewares/telegram-auth-middleware.js
logger.debug('Processing initData', {
	source: 'x-telegram-init-data',
	initDataLength: initData.length,
	initDataPreview: initData.substring(0, 100) + '...',
});
```

## Форматы вывода

### Development (с pino-pretty)

```
[12:34:56.789] INFO (12345): User registered successfully
    userId: 123456789
    username: "john_doe"
    referral: "ABC123"
    timestamp: "2025-01-15T12:34:56.789Z"
```

### Production (JSON формат)

```json
{
	"level": 30,
	"time": 1642236896789,
	"pid": 12345,
	"hostname": "server-1",
	"msg": "User registered successfully",
	"userId": 123456789,
	"username": "john_doe",
	"referral": "ABC123",
	"timestamp": "2025-01-15T12:34:56.789Z"
}
```

## Файлы логов

### Расположение

-   **Development**: `logs/app-dev.log`
-   **Test**: `logs/app-test.log`
-   **Production**: `logs/app-prod.log`

### Ротация логов

Логи автоматически ротируются и архивируются:

```bash
# Просмотр текущих логов
tail -f logs/app-dev.log

# Просмотр логов за последний час
grep "$(date -d '1 hour ago' '+%Y-%m-%d %H')" logs/app-dev.log

# Поиск ошибок
grep '"level":50' logs/app-prod.log
```

## Безопасность

### Скрытие чувствительных данных

Автоматически скрываются:

```javascript
redact: [
	'req.headers.authorization', // JWT токены
	'req.headers.cookie', // Сессионные куки
	'req.body.password', // Пароли
	'req.body.token', // Другие токены
];
```

### Пример безопасного логирования

```javascript
// ❌ Небезопасно
logger.info('User login', { password: req.body.password });

// ✅ Безопасно
logger.info('User login', {
	username: req.body.username,
	userId: user.id,
});
```

## Мониторинг и алерты

### Prometheus метрики

```javascript
// service/prometheus-service.js
const logLevelCounter = new prometheus.Counter({
	name: 'app_log_messages_total',
	help: 'Total number of log messages by level',
	labelNames: ['level'],
});

// В логгере
logLevelCounter.inc({ level: 'error' });
```

### Алерты на ошибки

```javascript
// При критических ошибках
logger.error('Critical system error', {
	error: err.message,
	component: 'database',
	severity: 'critical',
	alert: true,
});
```

## Отладка

### Включение детального логирования

```bash
# Временно установить trace уровень
LOG_LEVEL=trace npm run dev

# Или через скрипт
npm run log:debug
```

### Фильтрация логов

```bash
# Только ошибки
grep '"level":50' logs/app-dev.log

# Только запросы к API
grep '"msg":"HTTP request completed"' logs/app-dev.log

# Логи конкретного пользователя
grep '"userId":123456789' logs/app-dev.log
```

### Анализ производительности

```bash
# Подсчет логов по уровням
grep -o '"level":[0-9]*' logs/app-prod.log | sort | uniq -c

# Поиск медленных запросов
grep '"duration":[0-9][0-9][0-9][0-9]' logs/app-prod.log
```

## Интеграция с внешними системами

### ELK Stack (Elasticsearch, Logstash, Kibana)

```javascript
// Настройка для отправки в Elasticsearch
const pinoElastic = require('pino-elasticsearch');

const stream = pinoElastic({
	index: 'nebulahunt-logs',
	consistency: 'one',
	node: 'http://localhost:9200',
});
```

### Cloud Logging (AWS CloudWatch, Google Cloud Logging)

```javascript
// AWS CloudWatch
const pinoCloudWatch = require('pino-cloudwatch');

const stream = pinoCloudWatch({
	logGroupName: 'nebulahunt-server',
	logStreamName: 'app-logs',
	region: 'us-east-1',
});
```

## Troubleshooting

### Проблема: Слишком много логов

**Решение:**

```bash
# Увеличить уровень логирования
npm run log:info
# или
npm run log:error
```

### Проблема: Логи не записываются

**Решение:**

1. Проверить права на запись в папку `logs/`
2. Проверить свободное место на диске
3. Проверить конфигурацию в `config/logger.config.js`

### Проблема: Медленная работа из-за логирования

**Решение:**

```bash
# Уменьшить детализацию
npm run log:error

# Или отключить pretty printing в development
LOG_LEVEL=error npm run dev
```

## Лучшие практики

### 1. Используйте правильные уровни

```javascript
// ✅ Правильно
logger.error('Database connection failed', { error: err.message });
logger.warn('Rate limit exceeded', { ip: req.ip });
logger.info('User registered', { userId: user.id });
logger.debug('Processing request', { method: req.method, url: req.url });

// ❌ Неправильно
logger.info('Database connection failed', { error: err.message }); // Должно быть error
logger.debug('User registered', { userId: user.id }); // Должно быть info
```

### 2. Структурируйте данные

```javascript
// ✅ Хорошо структурировано
logger.info('Payment processed', {
	userId: user.id,
	amount: payment.amount,
	currency: payment.currency,
	status: payment.status,
	timestamp: new Date().toISOString(),
});

// ❌ Плохо структурировано
logger.info(
	`Payment processed: ${payment.amount} ${payment.currency} for user ${user.id}`
);
```

### 3. Не логируйте чувствительные данные

```javascript
// ❌ Небезопасно
logger.info('User login', {
	username: req.body.username,
	password: req.body.password, // Не логировать!
	token: req.headers.authorization, // Не логировать!
});

// ✅ Безопасно
logger.info('User login', {
	username: req.body.username,
	userId: user.id,
	success: true,
});
```

## Дополнительные ресурсы

-   [Pino Documentation](https://getpino.io/)
-   [Pino Best Practices](https://getpino.io/#/docs/best-practices)
-   [Structured Logging](https://www.thoughtworks.com/insights/blog/structured-logging)
