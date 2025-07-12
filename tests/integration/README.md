# Интеграционные тесты

Этот раздел содержит интеграционные тесты для `nebulahunt-server`, которые проверяют взаимодействие между различными компонентами системы.

## Структура тестов

```
tests/integration/
├── api/                    # Тесты API endpoints
│   └── user-api.test.js    # Тесты API пользователей
├── service/                # Тесты сервисов
│   └── market-service.test.js # Тесты сервиса рынка
├── database/               # Тесты операций с БД
│   └── db-operations.test.js # Тесты БД операций
├── external/               # Тесты внешних API
│   └── ton-api.test.js     # Тесты TON API
├── scenarios/              # Полные сценарии
│   └── game-flow.test.js   # Игровые сценарии
└── README.md              # Эта документация
```

## Типы интеграционных тестов

### 1. API тесты (`api/`)

-   Тестируют HTTP endpoints
-   Проверяют валидацию запросов
-   Тестируют аутентификацию и авторизацию
-   Проверяют корректность ответов

### 2. Сервисные тесты (`service/`)

-   Тестируют бизнес-логику сервисов
-   Проверяют взаимодействие между сервисами
-   Тестируют обработку ошибок
-   Проверяют транзакции

### 3. Тесты базы данных (`database/`)

-   Тестируют CRUD операции
-   Проверяют связи между таблицами
-   Тестируют сложные запросы
-   Проверяют целостность данных

### 4. Внешние API тесты (`external/`)

-   Тестируют интеграцию с внешними сервисами
-   Проверяют обработку ошибок сети
-   Тестируют таймауты и повторные попытки

### 5. Сценарийные тесты (`scenarios/`)

-   Тестируют полные пользовательские сценарии
-   Проверяют end-to-end функциональность
-   Симулируют реальное использование

## Запуск тестов

### Все интеграционные тесты

```bash
npm run test:integration
```

### Конкретные типы тестов

```bash
# Только API тесты
npm run test:integration:api

# Только сервисные тесты
npm run test:integration:service

# Только тесты базы данных
npm run test:integration:database

# Только внешние API тесты
npm run test:integration:external
```

### С покрытием кода

```bash
npm run test:integration -- --coverage
```

## Настройка тестового окружения

### Переменные окружения

Интеграционные тесты используют следующие переменные:

-   `NODE_ENV=test` - тестовое окружение
-   `RUN_MIGRATIONS=true` - выполнение миграций

### База данных

-   Используется SQLite в памяти для быстрого выполнения
-   Миграции выполняются автоматически
-   Данные очищаются между тестами

### Мокирование

-   Внешние сервисы мокируются для изоляции тестов
-   Telegram API мокируется
-   Платежные системы мокируются

## Лучшие практики

### 1. Изоляция тестов

-   Каждый тест должен быть независимым
-   Данные очищаются в `beforeEach`
-   Используются уникальные идентификаторы

### 2. Проверка состояния

-   Проверяйте изменения в базе данных
-   Валидируйте ответы API
-   Проверяйте побочные эффекты

### 3. Обработка ошибок

-   Тестируйте как успешные, так и неуспешные сценарии
-   Проверяйте корректность сообщений об ошибках
-   Тестируйте граничные случаи

### 4. Производительность

-   Используйте короткие таймауты для внешних API
-   Ограничивайте количество параллельных тестов
-   Избегайте избыточных запросов к БД

## Примеры тестов

### API тест

```javascript
test('should register user and create user state', async () => {
	const response = await request(app)
		.post('/api/auth/register')
		.send(userData)
		.expect(201);

	expect(response.body).toHaveProperty('user');
	expect(response.body).toHaveProperty('userState');
});
```

### Сервисный тест

```javascript
test('should create offer and process transaction', async () => {
	const offer = await MarketService.createOffer(offerData);
	const transaction = await MarketService.processTransaction(transactionData);

	expect(transaction.status).toBe('completed');
});
```

### Сценарийный тест

```javascript
test('complete game flow', async () => {
	// 1. Регистрация пользователя
	const user = await UserService.createUser(userData);

	// 2. Выполнение задачи
	const task = await TaskService.assignTask(user.id, templateId);
	const completion = await TaskService.completeTask(user.id, task.id);

	// 3. Проверка наград
	const userState = await UserService.getUserState(user.id);
	expect(userState.experience).toBeGreaterThan(0);
});
```

## Отладка тестов

### Логирование

```bash
# Включить подробные логи
DEBUG=* npm run test:integration
```

### Отладка конкретного теста

```bash
# Запустить только один тест
npm run test:integration -- --testNamePattern="should register user"
```

### Проверка базы данных

```javascript
// В тесте можно проверить состояние БД
const user = await User.findByPk(userId);
expect(user).toBeTruthy();
```

## Мониторинг и отчеты

### Покрытие кода

```bash
npm run test:integration -- --coverage
```

### Время выполнения

```bash
npm run test:integration -- --verbose
```

### Отчеты в HTML

```bash
npm run test:integration -- --coverage --coverageReporters=html
```

## Troubleshooting

### Ошибки подключения к БД

-   Проверьте настройки в `tests/setup.js`
-   Убедитесь, что SQLite доступен

### Таймауты тестов

-   Увеличьте `testTimeout` в конфигурации
-   Проверьте внешние API доступность

### Ошибки миграций

-   Проверьте синтаксис миграций
-   Убедитесь, что все зависимости установлены
