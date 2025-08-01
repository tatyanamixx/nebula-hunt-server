# PackageStoreService - Полная интеграция с ERROR_CODES

## Обзор изменений

Все методы в `PackageStoreService` были обновлены для использования системы кодов ошибок `error-codes.js`, `findOrCreate` и улучшенного логирования.

## Обновленные методы

### 1. initializePackageStore

-   **Переписано**: Использование `findOrCreate` вместо `findOne` + `create`
-   **Добавлено**: Специфичные коды ошибок:
    -   `ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND` - шаблон пакета не найден
    -   `ERROR_CODES.SYSTEM.DATABASE_ERROR` - общие ошибки БД
-   **Улучшено**: Детальное логирование каждого этапа
-   **Исправлено**: Обработка случаев, когда нет активных шаблонов

### 2. getUserPackages

-   **Добавлено**: Include для PackageTemplate с полной информацией
-   **Добавлено**: Использование `ERROR_CODES.SYSTEM.DATABASE_ERROR`
-   **Улучшено**: Логирование количества полученных пакетов
-   **Улучшено**: Возврат структурированных данных с информацией о шаблоне

### 3. getUserPackageById

-   **Добавлено**: Специфичные коды ошибок:
    -   `ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND` - шаблон пакета не найден
    -   `ERROR_CODES.PACKAGE.PACKAGE_NOT_FOUND` - пакет пользователя не найден
-   **Добавлено**: Include для PackageTemplate
-   **Улучшено**: Детальное логирование
-   **Исправлено**: Убраны лишние `rollback()` вызовы

### 4. usePackage

-   **Добавлено**: Специфичные коды ошибок:
    -   `ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND` - шаблон пакета не найден
    -   `ERROR_CODES.PACKAGE.PACKAGE_NOT_FOUND` - пакет не найден или недоступен
    -   `ERROR_CODES.USER_STATE.STATE_NOT_FOUND` - состояние пользователя не найдено
    -   `ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS` - неверный тип ресурса
-   **Улучшено**: Логирование изменений ресурсов пользователя
-   **Добавлено**: Отслеживание старых и новых значений ресурсов
-   **Исправлено**: Убраны лишние `rollback()` вызовы

## Используемые коды ошибок

### PACKAGE коды

-   `ERROR_CODES.PACKAGE.PACKAGE_NOT_FOUND` - пакет пользователя не найден
-   `ERROR_CODES.PACKAGE.PACKAGE_TEMPLATE_NOT_FOUND` - шаблон пакета не найден
-   `ERROR_CODES.PACKAGE.PACKAGE_ALREADY_PURCHASED` - пакет уже куплен (не используется, но доступен)
-   `ERROR_CODES.PACKAGE.PACKAGE_EXPIRED` - пакет истек (не используется, но доступен)

### USER_STATE коды

-   `ERROR_CODES.USER_STATE.STATE_NOT_FOUND` - состояние пользователя не найдено

### VALIDATION коды

-   `ERROR_CODES.VALIDATION.MISSING_REQUIRED_FIELDS` - неверный тип ресурса

### SYSTEM коды

-   `ERROR_CODES.SYSTEM.DATABASE_ERROR` - ошибки базы данных

## Улучшения логирования

### Структурированные логи

Все методы теперь используют структурированное логирование с контекстной информацией:

```javascript
logger.debug('methodName on start', { userId, slug });
logger.debug('methodName completed successfully', { userId, result });
logger.error('Failed to methodName', {
	userId,
	error: err.message,
	stack: err.stack,
});
```

### Контекстная информация

-   `userId` - ID пользователя во всех логах
-   `slug` - идентификатор пакета где применимо
-   `templateId` - ID шаблона пакета
-   `packageId` - ID пакета пользователя
-   `resource` - тип ресурса
-   `amount` - количество ресурса
-   `oldValues` - старые значения ресурсов пользователя
-   `newValues` - новые значения ресурсов пользователя
-   `error` - сообщение об ошибке
-   `stack` - стек ошибки для отладки

## Обработка ошибок

### Единообразный подход

Все методы используют единообразный подход к обработке ошибок:

```javascript
try {
	// Основная логика
} catch (err) {
	// Логирование ошибки
	logger.error('Failed to methodName', {
		userId,
		error: err.message,
		stack: err.stack,
	});

	// Проверка типа ошибки
	if (err instanceof ApiError) {
		throw err; // Перебрасываем уже созданные ApiError
	}

	// Создание новой ошибки с кодом
	throw ApiError.Internal(
		`Failed to methodName: ${err.message}`,
		ERROR_CODES.SYSTEM.DATABASE_ERROR
	);
}
```

### Graceful degradation

-   Некритичные ошибки не прерывают выполнение
-   Подробная информация об ошибках для отладки
-   Сохранение транзакционной целостности

## Производительность

### Оптимизации

-   Использование `findOrCreate` для атомарных операций
-   Include для PackageTemplate в запросах
-   Параллельные операции с `Promise.all`
-   Оптимизированные запросы

### Мониторинг

-   Логирование времени выполнения операций
-   Подсчет количества обработанных записей
-   Отслеживание изменений ресурсов пользователя
-   Отслеживание успешных и неуспешных операций

## Безопасность

### Валидация данных

-   Проверка существования шаблонов пакетов
-   Валидация типов ресурсов
-   Проверка доступности пакетов (не использован, не заблокирован)
-   Валидация входных параметров

### Транзакционная безопасность

-   Правильная обработка commit/rollback
-   Поддержка внешних транзакций
-   Изоляция операций
-   Атомарность операций с ресурсами

## Новые возможности

### 1. Детальное отслеживание ресурсов

В методе `usePackage` добавлено логирование изменений ресурсов:

```javascript
const oldValues = {
	stardust: userState.stardust,
	darkMatter: userState.darkMatter,
	tgStars: userState.tgStars,
};
// ... изменение ресурсов ...
logger.debug('usePackage completed successfully', {
	userId,
	slug,
	packageId: packageItem.id,
	resource: packageItem.resource,
	amount: packageItem.amount,
	oldValues,
	newValues: {
		/* новые значения */
	},
});
```

### 2. Структурированные возвращаемые данные

Методы `getUserPackages` и `getUserPackageById` теперь возвращают данные с полной информацией о шаблоне пакета:

```javascript
{
    ...packageItem.toJSON(),
    package: packageItem.packagetemplate?.toJSON(),
}
```

### 3. Улучшенная обработка ошибок

Специфичные коды ошибок для разных типов проблем:

-   Отсутствие шаблона пакета
-   Отсутствие пакета пользователя
-   Отсутствие состояния пользователя
-   Неверный тип ресурса

## Обратная совместимость

Все методы сохраняют:

-   Тот же интерфейс (сигнатуры методов)
-   Те же возвращаемые данные (с дополнительной информацией)
-   Тот же функционал

Изменения касаются только внутренней реализации и улучшения обработки ошибок.

## Тестирование

Создан тестовый файл `test-package-store-service-findorcreate.js` для проверки:

-   Создания пакетов при первом вызове
-   Отсутствия дубликатов при повторных вызовах
-   Работы всех методов сервиса
-   Обработки ошибок
-   Работы с транзакциями

Рекомендуется обновить существующие тесты для проверки:

-   Правильности кодов ошибок
-   Структурированного логирования
-   Обработки различных сценариев ошибок
-   Транзакционной целостности
-   Изменений в возвращаемых данных
