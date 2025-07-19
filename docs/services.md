# Сервисы

## Обзор

Сервисы в Nebulahant Server реализуют бизнес-логику приложения и обеспечивают взаимодействие между контроллерами и моделями данных. Каждый сервис отвечает за определенную область функциональности и инкапсулирует соответствующую логику.

## Архитектура сервисов

### Принципы проектирования

1. **Единственная ответственность** - каждый сервис отвечает за одну область
2. **Инкапсуляция** - бизнес-логика скрыта внутри сервисов
3. **Переиспользование** - сервисы могут использоваться в разных контроллерах
4. **Тестируемость** - сервисы легко тестируются изолированно
5. **Зависимость от абстракций** - сервисы зависят от интерфейсов, а не от конкретных реализаций

### Структура сервиса

```javascript
class ServiceName {
	// Основные методы
	async methodName(params) {
		// Валидация входных данных
		// Бизнес-логика
		// Взаимодействие с моделями
		// Обработка ошибок
		// Возврат результата
	}

	// Вспомогательные методы
	_helperMethod() {
		// Внутренняя логика
	}
}

module.exports = new ServiceName();
```

## Детальное описание сервисов

### UserService

Сервис управления пользователями. При регистрации и логине создает и обновляет UserState. Все игровые состояния пользователя теперь только в UserState.

**Назначение**: Управление пользователями, регистрация, аутентификация.

**Автоматическая инициализация**: Создание системного пользователя при запуске сервера.

**Основные методы:**

#### `registration(id, username, referral, reqUserState, galaxies)`

Регистрирует нового пользователя в системе.

```javascript
async registration(id, username, referral, reqUserState, galaxies) {
  // Валидация входных данных
  // Создание системного пользователя при первой регистрации
  // Создание пользователя
  // Инициализация состояния
  // Создание галактик
  // Инициализация апгрейдов
  // Инициализация событий
  // Генерация токенов
}
```

#### `login(id)`

Вход существующего пользователя в систему.

```javascript
async login(id) {
  // Проверка существования пользователя
  // Проверка блокировки
  // Получение состояния и галактик
  // Проверка и инициализация событий
  // Активация апгрейдов
  // Генерация новых токенов
}
```

#### `logout(refreshToken)`

Выход пользователя из системы.

```javascript
async logout(refreshToken) {
  // Удаление refresh токена
  // Очистка сессии
}
```

#### `refresh(refreshToken)`

Обновление access токена.

```javascript
async refresh(refreshToken) {
  // Валидация refresh токена
  // Проверка существования в БД
  // Генерация новых токенов
}
```

#### `getFriends(id)`

Получение списка друзей (рефералов).

```javascript
async getFriends(id) {
  // Поиск пользователей с указанным referral
  // Получение их состояний
  // Форматирование ответа
}
```

#### `createSystemUser()`

Создание системного пользователя.

```javascript
async createSystemUser() {
  // Проверка существования
  // Создание пользователя с ролью SYSTEM
  // Транзакционное выполнение
}
```

#### `getSystemUser()`

Получение системного пользователя.

```javascript
async getSystemUser() {
  // Поиск пользователя с id = -1
  // Проверка существования
  // Возврат данных
}
```

### StateService

Сервис для работы с состоянием пользователя. Все игровые состояния (события, задачи, апгрейды) централизованы в UserState.

**Назначение**: Управление состоянием пользователя в игре.

**Основные методы:**

#### `createUserState(userId, userStateData, transaction)`

Создание начального состояния пользователя.

```javascript
async createUserState(userId, userStateData, transaction) {
  // Валидация данных состояния
  // Создание записи в БД
  // Инициализация всех полей
  // Возврат созданного состояния
}
```

#### `getUserState(userId)`

Получение состояния пользователя.

```javascript
async getUserState(userId) {
  // Поиск состояния по userId
  // Проверка существования
  // Возврат данных
}
```

#### `updateUserState(userId, updates)`

Обновление состояния пользователя.

```javascript
async updateUserState(userId, updates) {
  // Валидация обновлений
  // Применение изменений
  // Обновление истории
  // Возврат обновленного состояния
}
```

#### `addStateHistoryEntry(userId, entry)`

Добавление записи в историю состояний.

```javascript
async addStateHistoryEntry(userId, entry) {
  // Создание записи истории
  // Добавление в JSONB массив
  // Обновление lastUpdate
}
```

### GalaxyService

**Назначение**: Управление галактиками пользователя.

**Основные методы:**

#### `getUserGalaxies(userId)`

Получение галактик пользователя.

```javascript
async getUserGalaxies(userId) {
  // Поиск галактик по userId
  // Проверка существования пользователя
  // Возврат списка галактик
}
```

#### `createGalaxy(userId, galaxyData)`

Создание новой галактики.

```javascript
async createGalaxy(userId, galaxyData) {
  // Валидация данных галактики
  // Проверка уникальности seed
  // Создание записи в БД
  // Возврат созданной галактики
}
```

#### `updateGalaxy(galaxyId, updates)`

Обновление галактики.

```javascript
async updateGalaxy(galaxyId, updates) {
  // Поиск галактики
  // Валидация обновлений
  // Применение изменений
  // Возврат обновленной галактики
}
```

#### `deleteGalaxy(galaxyId)`

Удаление галактики.

```javascript
async deleteGalaxy(galaxyId) {
  // Поиск галактики
  // Проверка прав доступа
  // Удаление записи
  // Возврат подтверждения
}
```

#### `createSystemGalaxyWithOffer(galaxyData, offerData)`

Создание галактики от SYSTEM с автоматическим созданием оферты и инвойса.

```javascript
async createSystemGalaxyWithOffer(galaxyData, offerData) {
  // Создание галактики от SYSTEM
  // Создание оферты
  // Создание транзакции
  // Создание платежа
  // Транзакционное выполнение
}
```

### ArtifactService

**Назначение**: Управление артефактами пользователя.

**Основные методы:**

#### `getUserArtifacts(userId)`

Получение артефактов пользователя.

```javascript
async getUserArtifacts(userId) {
  // Поиск артефактов по userId
  // Проверка существования пользователя
  // Возврат списка артефактов
}
```

#### `createArtifact(userId, artifactData)`

Создание нового артефакта.

```javascript
async createArtifact(userId, artifactData) {
  // Валидация данных артефакта
  // Проверка уникальности seed
  // Создание записи в БД
  // Возврат созданного артефакта
}
```

#### `createSystemArtifactWithOffer(artifactData, offerData)`

Создание артефакта от SYSTEM с автоматическим созданием оферты и инвойса.

```javascript
async createSystemArtifactWithOffer(artifactData, offerData) {
  // Создание артефакта от SYSTEM
  // Создание оферты
  // Создание транзакции
  // Создание платежа
  // Транзакционное выполнение
}
```

### MarketService

**Назначение**: Управление маркетом, офертами, транзакциями и платежами.

**Автоматическая инициализация**: Инициализация комиссий маркета при запуске сервера из `config/market.config.js`.

**Основные методы:**

#### `getAllOffers()`

Получение всех активных оферт.

```javascript
async getAllOffers() {
  // Поиск активных оферт
  // Включение связанных данных
  // Возврат списка оферт
}
```

#### `getOffersByType(itemType)`

Получение оферт по типу предмета.

```javascript
async getOffersByType(itemType) {
  // Валидация типа предмета
  // Поиск оферт по типу
  // Специальная логика для пакетов
  // Возврат отфильтрованных оферт
}
```

#### `createOffer(sellerId, itemType, itemId, price, currency, expiresAt)`

Создание новой оферты.

```javascript
async createOffer(sellerId, itemType, itemId, price, currency, expiresAt) {
  // Валидация данных оферты
  // Проверка существования предмета
  // Проверка прав продавца
  // Создание записи в БД
  // Возврат созданной оферты
}
```

#### `createInvoice(buyerId, offerId)`

Создание инвойса для покупки.

```javascript
async createInvoice(buyerId, offerId) {
  // Проверка существования оферты
  // Проверка баланса покупателя
  // Создание транзакции
  // Создание платежа
  // Транзакционное выполнение
}
```

#### `processDeal(transactionId, blockchainTxId)`

Подтверждение сделки.

```javascript
async processDeal(transactionId, blockchainTxId) {
  // Поиск транзакции
  // Подтверждение платежа
  // Передача предмета покупателю
  // Начисление средств продавцу
  // Обновление статусов
  // Транзакционное выполнение
}
```

#### `buyPackage(buyerId, offerId)`

Покупка пакета от SYSTEM.

```javascript
async buyPackage(buyerId, offerId) {
  // Проверка типа оферты
  // Проверка баланса
  // Создание транзакции
  // Создание платежа
  // Транзакционное выполнение
}
```

#### `processPackageDeal(transactionId, blockchainTxId)`

Подтверждение покупки пакета.

```javascript
async processPackageDeal(transactionId, blockchainTxId) {
  // Поиск транзакции
  // Подтверждение платежа
  // Начисление игровой валюты
  // Обновление статусов
  // Транзакционное выполнение
}
```

#### `cancelOffer(offerId, reason)`

Отмена оферты.

```javascript
async cancelOffer(offerId, reason) {
  // Поиск оферты
  // Проверка прав
  // Отмена связанных транзакций
  // Обновление статуса
  // Транзакционное выполнение
}
```

#### `cancelDeal(transactionId, reason)`

Отмена сделки.

```javascript
async cancelDeal(transactionId, reason) {
  // Поиск транзакции
  // Возврат средств покупателю
  // Отмена платежа
  // Обновление статусов
  // Транзакционное выполнение
}
```

#### `cancelSystemDeal(transactionId, reason)`

Отмена SYSTEM сделки с удалением объектов.

```javascript
async cancelSystemDeal(transactionId, reason) {
  // Поиск транзакции
  // Определение типа объекта
  // Удаление объекта
  // Возврат средств
  // Отмена платежей
  // Транзакционное выполнение
}
```

#### `getUserTransactions(userId)`

Получение транзакций пользователя.

```javascript
async getUserTransactions(userId) {
  // Поиск транзакций как покупатель
  // Поиск транзакций как продавец
  // Объединение результатов
  // Сортировка по дате
  // Возврат списка транзакций
}
```

**Основные методы:**

#### `createGalaxy(userId, galaxyData, transaction)`

Создание новой галактики.

```javascript
async createGalaxy(userId, galaxyData, transaction) {
  // Валидация данных галактики
  // Генерация уникального seed
  // Создание записи в БД
  // Обновление счетчика галактик
  // Возврат созданной галактики
}
```

#### `getUserGalaxies(userId)`

Получение всех галактик пользователя.

```javascript
async getUserGalaxies(userId) {
  // Поиск галактик по userId
  // Фильтрация активных
  // Сортировка по дате создания
  // Возврат списка
}
```

#### `updateGalaxy(galaxyId, updates, userId)`

Обновление галактики.

```javascript
async updateGalaxy(galaxyId, updates, userId) {
  // Проверка принадлежности пользователю
  // Валидация обновлений
  // Применение изменений
  // Возврат обновленной галактики
}
```

#### `deleteGalaxy(galaxyId, userId)`

Удаление галактики.

```javascript
async deleteGalaxy(galaxyId, userId) {
  // Проверка принадлежности
  // Проверка возможности удаления
  // Удаление записи
  // Обновление счетчиков
}
```

### UpgradeService

Сервис для работы с апгрейдами. Все пользовательские апгрейды и прогресс хранятся в UserState (userUpgrades, completedUpgrades, activeUpgrades, upgradeTree, upgradeMultipliers). UpgradeNodeTemplate — глобальный шаблон.

**Назначение**: Система апгрейдов и дерева прогрессии.

**Основные методы:**

#### `initializeUserUpgradeTree(userId, transaction)`

Инициализация дерева апгрейдов для пользователя.

```javascript
async initializeUserUpgradeTree(userId, transaction) {
  // Получение всех доступных апгрейдов
  // Определение начальных узлов
  // Создание структуры дерева
  // Активация доступных апгрейдов
  // Возврат активных узлов
}
```

#### `activateUserUpgradeNodeTemplates(userId, transaction)`

Активация новых доступных апгрейдов.

```javascript
async activateUserUpgradeNodeTemplates(userId, transaction) {
  // Проверка условий для новых апгрейдов
  // Активация подходящих узлов
  // Обновление дерева
  // Возврат новых активных узлов
}
```

#### `purchaseUpgrade(userId, upgradeId, level)`

Покупка апгрейда.

```javascript
async purchaseUpgrade(userId, upgradeId, level) {
  // Проверка доступности апгрейда
  // Валидация уровня
  // Расчет стоимости
  // Проверка ресурсов
  // Применение эффектов
  // Обновление прогресса
  // Активация новых узлов
}
```

#### `getAvailableUpgrades(userId)`

Получение доступных апгрейдов.

```javascript
async getAvailableUpgrades(userId) {
  // Получение состояния пользователя
  // Фильтрация по условиям
  // Расчет прогресса
  // Форматирование ответа
}
```

#### `getUpgradeTree(userId)`

Получение полного дерева апгрейдов.

```javascript
async getUpgradeTree(userId) {
  // Получение всех апгрейдов
  // Построение структуры дерева
  // Добавление прогресса пользователя
  // Форматирование связей
}
```

### EventService

Сервис для работы с игровыми событиями пользователя. Теперь все методы работают только с UserState (activeEvents, eventHistory, eventMultipliers и др.).

**Назначение**: Управление игровыми событиями.

**Основные методы:**

#### `initializeUserEvents(userId)`

Инициализация событий для пользователя.

```javascript
async initializeUserEvents(userId) {
  // Создание начальных настроек событий
  // Инициализация множителей
  // Установка времени последней проверки
}
```

#### `checkAndTriggerEvents(userId)`

Проверка и запуск событий.

```javascript
async checkAndTriggerEvents(userId) {
  // Получение активных событий
  // Проверка условий триггеров
  // Запуск подходящих событий
  // Обновление множителей
  // Возврат состояния событий
}
```

#### `triggerEvent(eventId, userId)`

Принудительный запуск события.

```javascript
async triggerEvent(eventId, userId) {
  // Проверка существования события
  // Валидация условий
  // Применение эффектов
  // Обновление состояния
  // Логирование
}
```

#### `getActiveEvents(userId)`

Получение активных событий.

```javascript
async getActiveEvents(userId) {
  // Получение событий пользователя
  // Фильтрация активных
  // Расчет прогресса
  // Форматирование ответа
}
```

### TaskService

Сервис для работы с задачами. Все пользовательские задачи и прогресс хранятся в UserState (userTasks, completedTasks, activeTasks, taskMultipliers). Task — глобальный шаблон.

**Назначение**: Система задач и достижений.

**Основные методы:**

#### `getAvailableTasks(userId)`

Получение доступных задач.

```javascript
async getAvailableTasks(userId) {
  // Получение всех активных задач
  // Проверка условий доступности
  // Расчет прогресса
  // Фильтрация по статусу
  // Форматирование ответа
}
```

#### `completeTask(userId, taskId)`

Завершение задачи.

```javascript
async completeTask(userId, taskId) {
  // Проверка существования задачи
  // Валидация условий завершения
  // Выдача наград
  // Обновление прогресса
  // Активация новых задач
}
```

#### `checkTaskProgress(userId)`

Проверка прогресса задач.

```javascript
async checkTaskProgress(userId) {
  // Получение состояния пользователя
  // Проверка всех активных задач
  // Обновление прогресса
  // Выявление завершенных
}
```

### TokenService

**Назначение**: Управление JWT токенами.

**Основные методы:**

#### `generateTokens(payload)`

Генерация access и refresh токенов.

```javascript
generateTokens(payload) {
  // Создание access токена
  // Создание refresh токена
  // Возврат пары токенов
}
```

#### `validateAccessToken(token)`

Валидация access токена.

```javascript
validateAccessToken(token) {
  // Проверка подписи
  // Проверка срока действия
  // Возврат данных пользователя
}
```

#### `validateRefreshToken(token)`

Валидация refresh токена.

```javascript
validateRefreshToken(token) {
  // Проверка подписи
  // Проверка срока действия
  // Возврат данных пользователя
}
```

#### `saveToken(userId, refreshToken, transaction)`

Сохранение refresh токена.

```javascript
async saveToken(userId, refreshToken, transaction) {
  // Удаление старых токенов
  // Создание нового токена
  // Сохранение в БД
}
```

#### `findToken(refreshToken, transaction)`

Поиск токена в базе данных.

```javascript
async findToken(refreshToken, transaction) {
  // Поиск по refreshToken
  // Проверка существования
  // Возврат записи
}
```

#### `removeToken(refreshToken, transaction)`

Удаление токена.

```javascript
async removeToken(refreshToken, transaction) {
  // Поиск токена
  // Удаление записи
  // Возврат результата
}
```

### LoggerService

**Назначение**: Централизованное логирование.

**Основные методы:**

#### `info(message, data)`

Логирование информационных сообщений.

```javascript
info(message, data = {}) {
  // Создание лог-записи
  // Добавление метаданных
  // Запись в лог
}
```

#### `error(message, data)`

Логирование ошибок.

```javascript
error(message, data = {}) {
  // Создание лог-записи
  // Добавление стека ошибки
  // Запись в лог
}
```

#### `warn(message, data)`

Логирование предупреждений.

```javascript
warn(message, data = {}) {
  // Создание лог-записи
  // Запись в лог
}
```

#### `debug(message, data)`

Логирование отладочной информации.

```javascript
debug(message, data = {}) {
  // Проверка уровня логирования
  // Создание лог-записи
  // Запись в лог
}
```

## Взаимодействие сервисов

### Схема зависимостей

```
UserService
├── TokenService
├── GalaxyService
├── StateService
├── EventService
└── UpgradeService

StateService
├── LoggerService
└── UserService

GalaxyService
├── StateService
└── LoggerService

UpgradeService
├── StateService
└── LoggerService

EventService
├── StateService
└── LoggerService

TaskService
├── StateService
└── LoggerService

TokenService
└── LoggerService
```

### Примеры взаимодействия

#### Регистрация пользователя

```javascript
// UserService.registration()
├── StateService.createUserState()
├── GalaxyService.createGalaxy()
├── UpgradeService.initializeUserUpgradeTree()
├── EventService.initializeUserEvents()
└── TokenService.generateTokens()
```

#### Вход в систему

```javascript
// UserService.login()
├── StateService.getUserState()
├── GalaxyService.getUserGalaxies()
├── EventService.checkAndTriggerEvents()
├── UpgradeService.activateUserUpgradeNodeTemplates()
└── TokenService.generateTokens()
```

## Обработка ошибок

### Стратегия обработки ошибок

1. **Валидация входных данных** - проверка на уровне сервиса
2. **Бизнес-логика валидация** - проверка бизнес-правил
3. **Обработка исключений** - try-catch блоки
4. **Логирование ошибок** - запись в лог
5. **Возврат понятных ошибок** - структурированные сообщения

### Пример обработки ошибок

```javascript
async methodName(params) {
  try {
    // Валидация
    if (!params.required) {
      throw ApiError.BadRequest('Required parameter missing');
    }

    // Бизнес-логика
    const result = await this.processData(params);

    // Логирование успеха
    loggerService.info('Operation completed', { params, result });

    return result;
  } catch (error) {
    // Логирование ошибки
    loggerService.error('Operation failed', {
      params,
      error: error.message,
      stack: error.stack
    });

    // Переброс ошибки
    throw error;
  }
}
```

## Транзакции

### Управление транзакциями

```javascript
async methodWithTransaction() {
  const transaction = await sequelize.transaction();

  try {
    // Операции в транзакции
    await this.operation1(transaction);
    await this.operation2(transaction);

    // Подтверждение транзакции
    await transaction.commit();

    return result;
  } catch (error) {
    // Откат транзакции
    await transaction.rollback();
    throw error;
  }
}
```

## Кэширование

### Стратегии кэширования

1. **In-memory кэш** - для часто используемых данных
2. **Кэш запросов** - для результатов сложных запросов
3. **Кэш вычислений** - для дорогих вычислений

### Пример кэширования

```javascript
class CachedService {
	constructor() {
		this.cache = new Map();
		this.cacheTimeout = 5 * 60 * 1000; // 5 минут
	}

	async getCachedData(key) {
		const cached = this.cache.get(key);

		if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
			return cached.data;
		}

		const data = await this.fetchData(key);

		this.cache.set(key, {
			data,
			timestamp: Date.now(),
		});

		return data;
	}
}
```

## Тестирование сервисов

### Unit тесты

```javascript
describe('UserService', () => {
	describe('registration', () => {
		it('should create new user successfully', async () => {
			// Arrange
			const userData = {
				/* test data */
			};

			// Act
			const result = await userService.registration(userData);

			// Assert
			expect(result.user).toBeDefined();
			expect(result.userState).toBeDefined();
		});

		it('should throw error for invalid data', async () => {
			// Arrange
			const invalidData = {
				/* invalid data */
			};

			// Act & Assert
			await expect(userService.registration(invalidData)).rejects.toThrow(
				ApiError.BadRequest
			);
		});
	});
});
```

### Mocking зависимостей

```javascript
jest.mock('../service/token-service');
jest.mock('../service/state-service');

describe('UserService', () => {
	beforeEach(() => {
		tokenService.generateTokens.mockClear();
		stateService.createUserState.mockClear();
	});

	it('should call dependencies correctly', async () => {
		// Arrange
		const userData = {
			/* test data */
		};

		// Act
		await userService.registration(userData);

		// Assert
		expect(tokenService.generateTokens).toHaveBeenCalled();
		expect(stateService.createUserState).toHaveBeenCalled();
	});
});
```

## Производительность

### Оптимизации

1. **Асинхронные операции** - использование async/await
2. **Пакетные операции** - группировка запросов к БД
3. **Ленивая загрузка** - загрузка данных по требованию
4. **Кэширование** - сохранение часто используемых данных

### Мониторинг производительности

```javascript
async methodWithMonitoring() {
  const startTime = Date.now();

  try {
    const result = await this.expensiveOperation();

    const duration = Date.now() - startTime;
    loggerService.info('Operation completed', {
      duration,
      operation: 'methodName'
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    loggerService.error('Operation failed', {
      duration,
      operation: 'methodName',
      error: error.message
    });

    throw error;
  }
}
```

---

Сервисы обеспечивают надежную, тестируемую и масштабируемую архитектуру для Nebulahant Server, инкапсулируя бизнес-логику и обеспечивая четкое разделение ответственности между компонентами системы.
