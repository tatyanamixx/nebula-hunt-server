# Безопасность

## Обзор

Nebulahant Server реализует многоуровневую систему безопасности для защиты пользователей, данных и инфраструктуры. Безопасность обеспечивается на всех уровнях приложения - от аутентификации до защиты от атак.

## Аутентификация

### Telegram Mini Apps Integration

Система использует официальную интеграцию с Telegram Mini Apps для безопасной аутентификации пользователей.

#### Принцип работы

1. **Инициализация в Telegram** - пользователь открывает приложение в Telegram
2. **Генерация initData** - Telegram создает подписанные данные пользователя
3. **Верификация на сервере** - сервер проверяет подпись данных
4. **Создание сессии** - при успешной проверке создается JWT сессия

#### Верификация данных

```javascript
// middlewares/tma-middleware.js
const { validate } = require('@telegram-apps/init-data-node');

module.exports = async function (req, res, next) {
	try {
		const initData = req.headers['x-telegram-init-data'];

		if (!initData) {
			return next(
				ApiError.UnauthorizedError('Telegram init data required')
			);
		}

		// Верификация подписи Telegram
		const validatedData = validate(initData, process.env.BOT_TOKEN);

		if (!validatedData) {
			return next(
				ApiError.UnauthorizedError('Invalid Telegram signature')
			);
		}

		req.initdata = validatedData;
		next();
	} catch (error) {
		return next(ApiError.UnauthorizedError('TMA validation failed'));
	}
};
```

#### Преимущества TMA аутентификации

-   **Безопасность** - криптографическая подпись Telegram
-   **Простота** - не требует паролей
-   **Надежность** - официальная интеграция
-   **Защита от подделки** - невозможно сфальсифицировать данные

### JWT Токены

Система использует JWT (JSON Web Tokens) для управления сессиями.

#### Структура токенов

**Access Token:**

```javascript
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "id": 123456,
    "username": "player1",
    "role": "USER",
    "iat": 1640995200,
    "exp": 1640998800
  }
}
```

**Refresh Token:**

```javascript
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "id": 123456,
    "type": "refresh",
    "iat": 1640995200,
    "exp": 1641081600
  }
}
```

#### Генерация токенов

```javascript
// service/token-service.js
const jwt = require('jsonwebtoken');

generateTokens(payload) {
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '1h'
  });

  const refreshToken = jwt.sign(
    { id: payload.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
}
```

#### Валидация токенов

```javascript
validateAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    throw ApiError.UnauthorizedError('Invalid access token');
  }
}

validateRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw ApiError.UnauthorizedError('Invalid refresh token');
  }
}
```

#### Безопасность токенов

-   **Короткий срок действия** - access token истекает через 1 час
-   **Долгий срок действия** - refresh token истекает через 30 дней
-   **Разные секреты** - отдельные секреты для access и refresh токенов
-   **Хранение в БД** - refresh токены сохраняются в базе данных
-   **Автоматическое обновление** - токены обновляются при каждом запросе

## Авторизация

### Ролевая модель

Система использует ролевую модель для управления доступом.

#### Роли пользователей

1. **USER** - обычный пользователь игры
2. **ADMIN** - администратор с расширенными правами
3. **SYSTEM** - системный пользователь для внутренних операций

#### Middleware авторизации

```javascript
// middlewares/admin-middleware.js
module.exports = async function (req, res, next) {
	try {
		const id = req.initdata.id;

		if (!id) {
			return next(ApiError.UnauthorizedError('User ID not found'));
		}

		const user = await User.findOne({ where: { id } });

		if (!user) {
			return next(ApiError.UnauthorizedError('User not found'));
		}

		if (user.role !== 'ADMIN') {
			return next(ApiError.ForbiddenError('Admin role required'));
		}

		next();
	} catch (error) {
		return next(ApiError.UnauthorizedError('Authorization failed'));
	}
};
```

#### Проверка прав доступа

```javascript
// Проверка роли в сервисах
async adminOnlyMethod(userId) {
  const user = await User.findByPk(userId);

  if (!user || user.role !== 'ADMIN') {
    throw ApiError.ForbiddenError('Admin access required');
  }

  // Выполнение административной операции
}
```

### Защита ресурсов

#### Проверка владения

```javascript
// Проверка принадлежности галактики пользователю
async updateGalaxy(galaxyId, updates, userId) {
  const galaxy = await Galaxy.findOne({
    where: { id: galaxyId, userId }
  });

  if (!galaxy) {
    throw ApiError.ForbiddenError('Galaxy not found or access denied');
  }

  // Обновление галактики
}
```

#### Валидация входных данных

```javascript
// Валидация в контроллерах
const { body } = require('express-validator');

const validateRegistration = [
	body('referral').isNumeric().withMessage('Referral must be a number'),
	body('userState.state.totalStars')
		.isInt({ min: 0 })
		.withMessage('Invalid stars count'),
	body('galaxies').isArray().withMessage('Galaxies must be an array'),
];
```

## Защита от атак

### Rate Limiting

Система использует rate limiting для защиты от DDoS атак и злоупотреблений.

#### Конфигурация лимитов

```javascript
// middlewares/rate-limit-middleware.js
const rateLimit = require('express-rate-limit');

module.exports = function (limit, windowMs) {
	return rateLimit({
		windowMs: windowMs * 1000, // окно времени в миллисекундах
		max: limit, // максимальное количество запросов
		message: {
			error: 'Too many requests, please try again later.',
		},
		standardHeaders: true,
		legacyHeaders: false,
		handler: (req, res) => {
			res.status(429).json({
				success: false,
				error: {
					code: 'RATE_LIMIT_EXCEEDED',
					message: 'Too many requests. Try again later.',
					details: {
						retryAfter: Math.ceil(windowMs / 1000),
					},
				},
			});
		},
	});
};
```

#### Лимиты по эндпоинтам

-   **Регистрация**: 10 запросов в минуту
-   **Логин**: 30 запросов в минуту
-   **Логаут**: 20 запросов в минуту
-   **Обновление токенов**: 30 запросов в минуту
-   **Друзья**: 60 запросов в минуту
-   **Системный пользователь**: 10 запросов в минуту
-   **Административные функции**: 100 запросов в минуту
-   **Остальные эндпоинты**: 1000 запросов в минуту

### CORS (Cross-Origin Resource Sharing)

Настройка CORS для защиты от несанкционированных запросов.

```javascript
// index.js
app.use(
	cors({
		credentials: true,
		origin: process.env.CLIENT_URL, // только разрешенный домен
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
		allowedHeaders: [
			'Content-Type',
			'Authorization',
			'x-telegram-init-data',
		],
	})
);
```

### Валидация данных

#### Express-validator

```javascript
const { body, param, query } = require('express-validator');

// Валидация тела запроса
const validateGalaxyCreation = [
	body('starMin').isInt({ min: 1 }).withMessage('Invalid star minimum'),
	body('starCurrent').isInt({ min: 0 }).withMessage('Invalid current stars'),
	body('seed')
		.isString()
		.isLength({ min: 1 })
		.withMessage('Seed is required'),
	body('particleCount')
		.isInt({ min: 1 })
		.withMessage('Invalid particle count'),
];

// Валидация параметров
const validateGalaxyId = [
	param('id').isInt({ min: 1 }).withMessage('Invalid galaxy ID'),
];

// Валидация запросов
const validatePagination = [
	query('page')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Invalid page number'),
	query('limit')
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage('Invalid limit'),
];
```

#### Санитизация данных

```javascript
const { escape, trim } = require('express-validator');

// Санитизация строковых данных
const sanitizeString = [
	body('username').trim().escape().isLength({ min: 1, max: 50 }),
];
```

### SQL Injection Protection

Sequelize ORM автоматически защищает от SQL injection атак.

```javascript
// Безопасный запрос
const user = await User.findOne({
	where: { id: userId }, // параметризованный запрос
});

// Защита от инъекций в JSONB
const galaxies = await Galaxy.findAll({
	where: sequelize.literal("galaxy_properties->>'type' = ?", ['spiral']),
});
```

### XSS Protection

#### Заголовки безопасности

```javascript
// Добавление заголовков безопасности
app.use((req, res, next) => {
	res.setHeader('X-Content-Type-Options', 'nosniff');
	res.setHeader('X-Frame-Options', 'DENY');
	res.setHeader('X-XSS-Protection', '1; mode=block');
	res.setHeader(
		'Strict-Transport-Security',
		'max-age=31536000; includeSubDomains'
	);
	next();
});
```

#### Валидация JSONB данных

```javascript
// Валидация JSONB структур
const validateStateData = (state) => {
	if (!state || typeof state !== 'object') {
		throw new Error('Invalid state data');
	}

	if (typeof state.totalStars !== 'number' || state.totalStars < 0) {
		throw new Error('Invalid totalStars value');
	}

	if (typeof state.stardustCount !== 'number' || state.stardustCount < 0) {
		throw new Error('Invalid stardustCount value');
	}

	return true;
};
```

## Шифрование и хранение секретов

### Переменные окружения

```bash
# .env
# Server
PORT=5000
CLIENT_URL=https://your-client-url.com

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nebulahant
DB_USER=postgres
DB_PASSWORD=your_secure_password

# JWT Secrets (должны быть длинными и случайными)
JWT_ACCESS_SECRET=your_very_long_and_random_access_secret_key_here
JWT_REFRESH_SECRET=your_very_long_and_random_refresh_secret_key_here

# Telegram
BOT_TOKEN=your_telegram_bot_token

# Security
NODE_ENV=production
LOG_LEVEL=info
```

### Генерация секретов

```bash
# Генерация случайных секретов
openssl rand -base64 64
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Безопасное хранение

-   **Не хранить секреты в коде** - использовать переменные окружения
-   **Использовать менеджеры секретов** - HashiCorp Vault, AWS Secrets Manager
-   **Регулярно ротировать секреты** - обновлять JWT секреты
-   **Ограничить доступ** - минимальные права для доступа к секретам

## Логирование безопасности

### Структурированное логирование

```javascript
// Логирование событий безопасности
loggerService.warn('Failed login attempt', {
	userId: req.initdata?.id,
	ip: req.ip,
	userAgent: req.get('User-Agent'),
	timestamp: new Date().toISOString(),
});

loggerService.error('Security violation', {
	type: 'unauthorized_access',
	userId: req.initdata?.id,
	endpoint: req.path,
	method: req.method,
	ip: req.ip,
	timestamp: new Date().toISOString(),
});
```

### Мониторинг безопасности

```javascript
// Отслеживание подозрительной активности
class SecurityMonitor {
	constructor() {
		this.failedAttempts = new Map();
		this.blockedIPs = new Set();
	}

	trackFailedAttempt(ip) {
		const attempts = this.failedAttempts.get(ip) || 0;
		this.failedAttempts.set(ip, attempts + 1);

		if (attempts >= 10) {
			this.blockedIPs.add(ip);
			loggerService.error('IP blocked due to multiple failed attempts', {
				ip,
			});
		}
	}

	isIPBlocked(ip) {
		return this.blockedIPs.has(ip);
	}
}
```

## Обработка ошибок

### Безопасная обработка ошибок

```javascript
// middlewares/error-middleware.js
module.exports = function (err, req, res, next) {
	// Не раскрывать внутренние детали в продакшене
	if (process.env.NODE_ENV === 'production') {
		loggerService.error('Application error', {
			error: err.message,
			stack: err.stack,
			path: req.path,
			method: req.method,
			ip: req.ip,
		});

		return res.status(500).json({
			success: false,
			error: {
				code: 'INTERNAL_ERROR',
				message: 'Internal server error',
			},
		});
	}

	// В разработке показывать полные детали
	return res.status(err.status || 500).json({
		success: false,
		error: {
			code: err.code || 'UNKNOWN_ERROR',
			message: err.message,
			stack: err.stack,
		},
	});
};
```

### Кастомные исключения

```javascript
// exceptions/api-error.js
class ApiError extends Error {
	constructor(status, message, code = 'UNKNOWN_ERROR') {
		super(message);
		this.status = status;
		this.code = code;
	}

	static BadRequest(message, code = 'BAD_REQUEST') {
		return new ApiError(400, message, code);
	}

	static UnauthorizedError(message = 'Unauthorized', code = 'UNAUTHORIZED') {
		return new ApiError(401, message, code);
	}

	static ForbiddenError(message = 'Forbidden', code = 'FORBIDDEN') {
		return new ApiError(403, message, code);
	}

	static NotFound(message = 'Not found', code = 'NOT_FOUND') {
		return new ApiError(404, message, code);
	}

	static Internal(
		message = 'Internal server error',
		code = 'INTERNAL_ERROR'
	) {
		return new ApiError(500, message, code);
	}
}
```

## Аудит безопасности

### Регулярные проверки

1. **Аудит кода** - регулярный анализ кода на уязвимости
2. **Тестирование на проникновение** - периодические тесты безопасности
3. **Обновление зависимостей** - регулярное обновление npm пакетов
4. **Мониторинг логов** - анализ логов на подозрительную активность

### Инструменты безопасности

```bash
# Проверка уязвимостей в зависимостях
npm audit

# Обновление зависимостей
npm audit fix

# Проверка безопасности кода
npm install -g eslint-plugin-security
```

### Чек-лист безопасности

-   [ ] Все секреты хранятся в переменных окружения
-   [ ] JWT токены имеют короткий срок действия
-   [ ] Включен rate limiting
-   [ ] Настроен CORS
-   [ ] Валидация всех входных данных
-   [ ] Логирование событий безопасности
-   [ ] Регулярное обновление зависимостей
-   [ ] HTTPS в продакшене
-   [ ] Безопасные заголовки HTTP
-   [ ] Мониторинг подозрительной активности

## Соответствие стандартам

### GDPR (General Data Protection Regulation)

-   **Право на забвение** - возможность удаления данных пользователя
-   **Право на доступ** - получение копии данных пользователя
-   **Согласие** - явное согласие на обработку данных
-   **Минимизация данных** - сбор только необходимых данных

### OWASP Top 10

Система защищена от основных уязвимостей OWASP:

1. **Injection** - защита через Sequelize ORM
2. **Broken Authentication** - безопасная аутентификация через TMA
3. **Sensitive Data Exposure** - шифрование и безопасное хранение
4. **XML External Entities** - не используется XML
5. **Broken Access Control** - ролевая модель и проверки
6. **Security Misconfiguration** - безопасная конфигурация
7. **Cross-Site Scripting** - валидация и санитизация
8. **Insecure Deserialization** - безопасная сериализация JSON
9. **Using Components with Known Vulnerabilities** - регулярные обновления
10. **Insufficient Logging & Monitoring** - структурированное логирование

---

Система безопасности Nebulahant Server обеспечивает многоуровневую защиту на всех этапах работы приложения, от аутентификации до обработки данных, обеспечивая безопасность пользователей и целостность системы.
