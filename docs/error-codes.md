# Коды ошибок API

## Обзор

Система кодов ошибок NebulaHunt API предоставляет структурированный способ обработки и классификации ошибок. Каждый код ошибки имеет уникальный идентификатор, описание и уровень серьезности.

## Структура кодов ошибок

Коды ошибок имеют формат: `XXX_YYY`, где:

-   `XXX` - категория ошибки (AUTH, VAL, GAL, MKT, etc.)
-   `YYY` - порядковый номер ошибки в категории

## Категории ошибок

### AUTH - Аутентификация и авторизация

-   `AUTH_001` - User not found in the system
-   `AUTH_002` - User with this ID already exists
-   `AUTH_003` - Invalid authentication token provided
-   `AUTH_004` - Authentication token has expired
-   `AUTH_005` - User does not have sufficient permissions for this action
-   `AUTH_006` - Telegram authentication failed
-   `AUTH_007` - User account is blocked

### VAL - Валидация данных

-   `VAL_001` - Invalid username format
-   `VAL_002` - Invalid referral code format
-   `VAL_003` - Invalid galaxy data provided
-   `VAL_004` - Invalid offer data provided
-   `VAL_005` - Missing required fields in request
-   `VAL_006` - Invalid galaxy seed format
-   `VAL_007` - Invalid price format
-   `VAL_008` - Invalid currency specified

### GAL - Галактики

-   `GAL_001` - Galaxy not found
-   `GAL_002` - Galaxy with this seed already exists
-   `GAL_003` - Duplicate galaxy seed detected
-   `GAL_004` - Invalid galaxy properties provided
-   `GAL_005` - Galaxy is not owned by the user
-   `GAL_006` - Insufficient stars for this operation
-   `GAL_007` - Failed to create galaxy

### MKT - Маркет и транзакции

-   `MKT_001` - Market offer not found
-   `MKT_002` - Market offer already exists
-   `MKT_003` - Insufficient funds for transaction
-   `MKT_004` - Transaction failed to complete
-   `MKT_005` - Invalid offer type specified
-   `MKT_006` - Market offer has expired
-   `MKT_007` - Payment processing failed

### ART - Артефакты

-   `ART_001` - Artifact not found
-   `ART_002` - Artifact already exists
-   `ART_003` - Invalid artifact template
-   `ART_004` - Artifact is not owned by the user
-   `ART_005` - Artifact is not tradable

### USR - Пользовательское состояние

-   `USR_001` - User state not found
-   `USR_002` - Failed to create user state
-   `USR_003` - Insufficient resources for operation
-   `USR_004` - Daily bonus already claimed today
-   `USR_005` - Failed to update user streak

### UPG - Апгрейды

-   `UPG_001` - Upgrade not found
-   `UPG_002` - Upgrade already completed
-   `UPG_003` - Insufficient progress for upgrade
-   `UPG_004` - Upgrade template not found
-   `UPG_005` - Maximum upgrade level reached

### TSK - Задачи

-   `TSK_001` - Task not found
-   `TSK_002` - Task already completed
-   `TSK_003` - Task template not found
-   `TSK_004` - Invalid task progress

### EVT - События

-   `EVT_001` - Event not found
-   `EVT_002` - Event already active
-   `EVT_003` - Event template not found
-   `EVT_004` - Event has expired

### PKG - Пакеты

-   `PKG_001` - Package not found
-   `PKG_002` - Package already purchased
-   `PKG_003` - Package template not found
-   `PKG_004` - Package has expired

### SYS - Системные ошибки

-   `SYS_001` - Database operation failed
-   `SYS_002` - Internal server error occurred
-   `SYS_003` - Service temporarily unavailable
-   `SYS_004` - Rate limit exceeded
-   `SYS_005` - System is in maintenance mode
-   `SYS_006` - Configuration error

### EXT - Внешние сервисы

-   `EXT_001` - TON API service error
-   `EXT_002` - Telegram API service error
-   `EXT_003` - Payment gateway error
-   `EXT_004` - External service unavailable

## Уровни серьезности

-   **LOW** - Незначительные ошибки, не влияющие на функциональность
-   **MEDIUM** - Ошибки, которые могут повлиять на пользовательский опыт
-   **HIGH** - Критические ошибки, требующие внимания
-   **CRITICAL** - Критические системные ошибки

## Формат ответа с ошибкой

```json
{
	"message": "Описание ошибки",
	"errorCode": "XXX_YYY",
	"severity": "MEDIUM",
	"errors": []
}
```

## Использование в коде

### Создание ошибки с кодом

```javascript
const ApiError = require('../exceptions/api-error');
const { ERROR_CODES } = require('../config/error-codes');

// Использование предопределенных методов
throw ApiError.UserNotFound('User with ID 123 not found');

// Использование универсального метода
throw ApiError.withCode(
	400,
	'Custom error message',
	ERROR_CODES.VALIDATION.INVALID_USERNAME
);

// Использование с кастомным кодом
throw ApiError.withCode(409, 'Duplicate resource', 'CUSTOM_001');
```

### Обработка ошибок в middleware

```javascript
if (err instanceof ApiError) {
	const errorResponse = {
		message: err.message,
		errors: err.errors,
	};

	if (err.errorCode) {
		errorResponse.errorCode = err.errorCode;
	}

	if (err.severity) {
		errorResponse.severity = err.severity;
	}

	return res.status(err.status).json(errorResponse);
}
```

## Лучшие практики

1. **Всегда используйте коды ошибок** для структурированной обработки ошибок
2. **Выбирайте подходящий уровень серьезности** для правильной классификации
3. **Предоставляйте понятные сообщения** для пользователей
4. **Логируйте ошибки** с контекстом для отладки
5. **Не раскрывайте внутреннюю информацию** в сообщениях об ошибках

## Добавление новых кодов ошибок

1. Добавьте код в `config/error-codes.js`
2. Добавьте описание в `ERROR_DESCRIPTIONS`
3. Установите уровень серьезности в `ERROR_SEVERITY_MAPPING`
4. Создайте соответствующий метод в `ApiError` (опционально)
5. Обновите документацию

## Примеры использования

### Валидация данных

```javascript
if (!galaxyData.seed) {
	throw ApiError.withCode(
		400,
		'Galaxy seed is required',
		ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS
	);
}
```

### Проверка существования ресурса

```javascript
if (!galaxy) {
	throw ApiError.GalaxyNotFound();
}
```

### Проверка прав доступа

```javascript
if (galaxy.userId !== userId) {
	throw ApiError.GalaxyNotOwned();
}
```

### Обработка дублирования

```javascript
if (existingGalaxy) {
	throw ApiError.DuplicateGalaxySeed();
}
```
