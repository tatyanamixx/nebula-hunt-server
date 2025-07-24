# Telegram initData - Руководство по работе

## Обзор

Telegram WebApp передает данные пользователя через `initData` - подписанную строку, содержащую информацию о пользователе и времени авторизации. Наш middleware поддерживает несколько форматов передачи этих данных.

## Форматы initData

### 1. Authorization с префиксом tma (рекомендуется)

```
dXNlcj0lN0IlMjJpZCUyMiUzQTEyMzQ1Njc4OSUyQyUyMmZpcnN0X25hbWUlMjIlM0ElMjJKb2huJTIyJTJDJTIydXNlcm5hbWUlMjIlM0ElMjJqb2huX2RvZSUyMiU3RCZhX2RhdGU9MTY0MDk5NTIwMCZoYXNoPWFiYzEyMy4uLg==
```

**Заголовок:** `Authorization: tma <base64_data>`

**Приоритет:** Высший (рекомендуется для всех запросов)

### 2. URL-encoded формат (прямой)

```
user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22John%22%2C%22username%22%3A%22john_doe%22%7D&auth_date=1640995200&hash=abc123...
```

**Заголовок:** `x-telegram-init-data`

### 3. Base64 encoded формат

```
dXNlcj0lN0IlMjJpZCUyMiUzQTEyMzQ1Njc4OSUyQyUyMmZpcnN0X25hbWUlMjIlM0ElMjJKb2huJTIyJTJDJTIydXNlcm5hbWUlMjIlM0ElMjJqb2huX2RvZSUyMiU3RCZhX2RhdGU9MTY0MDk5NTIwMCZoYXNoPWFiYzEyMy4uLg==
```

**Заголовок:** `x-telegram-init-data-raw`

## Структура initData

После декодирования initData содержит:

```json
{
	"user": {
		"id": 123456789,
		"first_name": "John",
		"last_name": "Doe",
		"username": "john_doe",
		"language_code": "en",
		"is_premium": false,
		"photo_url": "https://t.me/i/userpic/320/john_doe.jpg"
	},
	"receiver": {
		"id": 987654321
	},
	"chat": {
		"id": 987654321,
		"type": "private",
		"title": "Test Chat"
	},
	"chat_type": "sender",
	"chat_instance": "123456789",
	"start_param": "start_param_value",
	"can_send_after": 1640995200,
	"auth_date": 1640995200,
	"hash": "abc123..."
}
```

## Middleware

Наш `telegram-auth-middleware.js` автоматически:

1. **Определяет формат** данных
2. **Декодирует** base64 если необходимо
3. **Валидирует** подпись с помощью токена бота
4. **Парсит** данные и сохраняет в `req.initdata`

### Использование в коде

```javascript
// В любом route после middleware
app.get('/api/user/profile', telegramAuthMiddleware, (req, res) => {
	const user = req.initdata; // Данные пользователя

	console.log('User ID:', user.id);
	console.log('Username:', user.username);
	console.log('First Name:', user.first_name);

	res.json({ user });
});
```

## Утилиты для отладки

### Декодер initData

```bash
# Показать тестовые данные
npm run decode:initdata -- --test

# Декодировать URL-encoded данные
npm run decode:initdata -- "user=...&auth_date=...&hash=..."

# Декодировать base64 данные
npm run decode:initdata -- --base64 "dXNlcj0..."
```

### Примеры использования

```bash
# Рекомендуемый способ (Authorization: tma)
curl -H "Authorization: tma dXNlcj0..." \
     http://localhost:5000/api/auth/login

# Альтернативные способы
curl -H "x-telegram-init-data: user=...&auth_date=...&hash=..." \
     http://localhost:5000/api/auth/login

curl -H "x-telegram-init-data-raw: dXNlcj0..." \
     http://localhost:5000/api/auth/login
```

## Безопасность

### Валидация подписи

Middleware автоматически проверяет подпись initData:

```javascript
// Внутри middleware
validate(initData, botToken); // Выбрасывает ошибку если подпись неверна
```

### Проверка времени

initData содержит `auth_date` - время создания. Рекомендуется проверять:

```javascript
const authDate = new Date(parsedData.auth_date * 1000);
const now = new Date();
const diffHours = (now - authDate) / (1000 * 60 * 60);

if (diffHours > 24) {
	throw new Error('initData is too old');
}
```

## Обработка ошибок

### Типичные ошибки

1. **"initData not found in headers"** - данные не переданы
2. **"invalid signature"** - неверная подпись (проверьте BOT_TOKEN)
3. **"parsing error"** - ошибка парсинга данных

### Логирование

Middleware логирует:

-   Источник данных (`x-telegram-init-data`, `authorization-tma`, etc.)
-   Длину данных
-   Успешность валидации
-   ID и username пользователя

## Интеграция с фронтендом

### Telegram WebApp

```javascript
// В Telegram WebApp
const initData = window.Telegram.WebApp.initData;

// Рекомендуемый способ (Authorization: tma)
fetch('/api/auth/login', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		Authorization: 'tma ' + btoa(initData), // Base64 encode
	},
});

// Альтернативный способ
fetch('/api/auth/login', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'x-telegram-init-data': initData,
	},
});
```

### Мобильное приложение

```javascript
// В мобильном приложении
const initData = await getTelegramInitData(); // Получение от Telegram SDK

// Рекомендуемый способ (Authorization: tma)
fetch('/api/auth/login', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		Authorization: 'tma ' + btoa(initData), // Base64 encode
	},
});

// Альтернативный способ
fetch('/api/auth/login', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'x-telegram-init-data-raw': btoa(initData), // Base64 encode
	},
});
```

## Тестирование

### Unit тесты

```javascript
// tests/middlewares/telegram-auth-middleware.test.js
describe('Telegram Auth Middleware', () => {
	test('should parse URL-encoded initData', () => {
		const req = {
			headers: {
				'x-telegram-init-data': 'user=...&auth_date=...&hash=...',
			},
		};

		telegramAuthMiddleware(req, {}, () => {});
		expect(req.initdata).toBeDefined();
	});

	test('should parse base64 encoded initData', () => {
		const req = {
			headers: {
				'x-telegram-init-data-raw': 'dXNlcj0...',
			},
		};

		telegramAuthMiddleware(req, {}, () => {});
		expect(req.initdata).toBeDefined();
	});
});
```

### Интеграционные тесты

```javascript
// tests/integration/api/auth-api.test.js
describe('Auth API with Telegram', () => {
	test('should authenticate with valid initData', async () => {
		const response = await request(app)
			.post('/api/auth/login')
			.set('x-telegram-init-data', validInitData)
			.expect(200);

		expect(response.body.user).toBeDefined();
	});
});
```

## Troubleshooting

### Проблема: "invalid signature"

**Решение:**

1. Проверьте `BOT_TOKEN` в переменных окружения
2. Убедитесь, что токен соответствует боту, который создал initData
3. Проверьте, что initData не был изменен

### Проблема: "initData not found"

**Решение:**

1. Проверьте заголовки запроса
2. Убедитесь, что фронтенд отправляет данные в правильном формате
3. Проверьте логи middleware для диагностики

### Проблема: "parsing error"

**Решение:**

1. Используйте декодер для проверки формата данных
2. Убедитесь, что данные не повреждены при передаче
3. Проверьте кодировку (UTF-8)

## Дополнительные ресурсы

-   [Telegram WebApp Documentation](https://core.telegram.org/bots/webapps)
-   [@telegram-apps/init-data-node](https://www.npmjs.com/package/@telegram-apps/init-data-node)
-   [Telegram Bot API](https://core.telegram.org/bots/api)
