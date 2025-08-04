# Рефакторинг пакетов и задач - Документация изменений

## 📋 Обзор изменений

В рамках рефакторинга были внесены изменения в систему пакетов и задач для улучшения архитектуры и использования единого сервиса `marketService.registerOffer` для управления состоянием пользователей.

## 🔄 Изменения в системе пакетов

### 1. Роутер (`routes/package-store-router.js`)

#### Изменения:

-   **Переименование параметра**: `:packageId` → `:slug`
-   **Обновление Swagger документации**

```javascript
// БЫЛО:
router.get('/:packageId', ...packageStoreController.getUserPackageById);
router.post('/:packageId/use', ...packageStoreController.usePackage);

// СТАЛО:
router.get('/:slug', ...packageStoreController.getUserPackageBySlug);
router.post('/:slug/use', ...packageStoreController.usePackage);
```

### 2. Контроллер (`controllers/package-store-controller.js`)

#### Изменения:

-   **Переименование метода**: `getUserPackageById` → `getUserPackageBySlug`
-   **Изменение параметра**: `packageId` → `slug`
-   **Обновление вызова сервиса**

```javascript
// БЫЛО:
async getUserPackageById(req, res, next) {
  const { packageId } = req.params;
  const packageItem = await packageStoreService.getUserPackageById(packageId, userId);
}

// СТАЛО:
async getUserPackageBySlug(req, res, next) {
  const { slug } = req.params;
  const packageItem = await packageStoreService.getUserPackageBySlug(slug, userId);
}
```

#### Изменения в `usePackage`:

```javascript
// БЫЛО:
const { packageId } = req.params;
const result = await packageStoreService.usePackage(packageId, userId);

// СТАЛО:
const { slug } = req.params;
const result = await packageStoreService.usePackage(slug, userId);
```

### 3. Сервис (`service/package-store-service.js`)

#### Изменения:

-   **Переименование метода**: `getUserPackageById` → `getUserPackageBySlug`
-   **Изменение логики поиска**: по `slug` вместо `id`
-   **Рефакторинг `usePackage`**:
    -   Удаление прямого обновления `UserState`
    -   Использование `marketService.registerOffer`
    -   Пакеты стали многоразовыми (удалено `isUsed = true`)
    -   Возврат обновленного `userState`

```javascript
// БЫЛО:
const packageItem = await UserPackageStore.findOne({
	where: { id: packageId, userId },
});

// СТАЛО:
const packageItem = await UserPackageStore.findOne({
	where: { slug, userId },
});
```

#### Новый `usePackage`:

```javascript
async usePackage(slug, userId) {
  // ... валидация ...

  // Удалено: packageItem.isUsed = true;
  // Удалено: await packageItem.save({ transaction: t });

  // Создаем offer для регистрации изменений через registerOffer
  const offerData = {
    sellerId: SYSTEM_USER_ID, // Системный аккаунт
    buyerId: userId,
    price: packageTemplate.price,
    currency: packageTemplate.currency,
    resource: packageTemplate.resource,
    amount: packageTemplate.amount,
    itemType: 'package',
    itemId: packageItem.id, // userPackageStoreId
    offerType: 'SYSTEM',
    txType: 'PACKAGE_REWARD',
  };

  const result = await marketService.registerOffer(offerData, t);

  // Получаем обновленное состояние пользователя
  const userState = await UserState.findOne({
    where: { userId },
    transaction: t
  });

  return {
    success: true,
    packageItem,
    userState, // ← Новое поле
    marketResult: result // ← Новое поле
  };
}
```

### 4. Модели и миграции

#### Добавление нового ENUM значения:

-   **Файл**: `models/models.js`
-   **Изменение**: Добавлен `'PACKAGE_REWARD'` в ENUM `txType`

```javascript
// БЫЛО:
'DAILY_REWARD';

// СТАЛО:
'DAILY_REWARD', 'PACKAGE_REWARD';
```

#### Миграция:

-   **Файл**: `migrations/20250101000005-init-market-tables.js`
-   **Изменение**: Добавлен `'PACKAGE_REWARD'` в ENUM для таблицы `paymenttransactions`

## 🔄 Изменения в системе задач

### 1. Сервис (`service/task-service.js`)

#### Рефакторинг `completeTask`:

-   **Использование `marketService.registerOffer`** для распределения наград
-   **Получение награды напрямую из `taskTemplate.reward`**
-   **Возврат обновленного `userState`**

```javascript
// БЫЛО:
userTask.reward = userTask.tasktemplate.reward;
const reward = userTask.tasktemplate.reward;

// СТАЛО:
userTask.reward = taskTemplate.reward;
const reward = taskTemplate.reward;
```

#### Новый `completeTask`:

```javascript
async completeTask(userTaskId, userId) {
  // ... валидация ...

  // Отмечаем задачу как выполненную
  userTask.completed = true;
  userTask.completedAt = now;
  userTask.reward = taskTemplate.reward;
  await userTask.save({ transaction: t });

  // Создаем offer для регистрации изменений через registerOffer
  const reward = taskTemplate.reward;
  const offerData = {
    sellerId: SYSTEM_USER_ID, // Системный аккаунт
    buyerId: userId,
    price: 0, // Задачи не имеют цены
    currency: reward.type, // Используем тип награды как валюту
    resource: reward.type, // Используем тип награды как ресурс
    amount: reward.amount,
    itemType: 'task',
    itemId: userTask.id, // userTaskId
    offerType: 'SYSTEM',
    txType: 'TASK_REWARD',
  };

  const result = await marketService.registerOffer(offerData, t);

  // Получаем обновленное состояние пользователя
  const userState = await UserState.findOne({
    where: { userId },
    transaction: t
  });

  return {
    success: true,
    userTask,
    userState, // ← Новое поле
    marketResult: result // ← Новое поле
  };
}
```

### 2. Контроллер (`controllers/task-controller.js`)

#### Изменения:

-   **Удаление дублирующего метода `completeTask`**
-   **Обновление возвращаемых данных**

### 3. Модели и миграции

#### Добавление нового ENUM значения:

-   **Файл**: `models/models.js`
-   **Изменение**: Добавлен `'TASK_REWARD'` в ENUM `txType`

```javascript
// БЫЛО:
'DAILY_REWARD', 'PACKAGE_REWARD';

// СТАЛО:
'DAILY_REWARD', 'PACKAGE_REWARD', 'TASK_REWARD';
```

#### Миграция:

-   **Файл**: `migrations/20250101000005-init-market-tables.js`
-   **Изменение**: Добавлен `'TASK_REWARD'` в ENUM для таблицы `paymenttransactions`

## 🔧 Технические детали

### Использование SYSTEM_USER_ID

```javascript
// Импорт константы
const { SYSTEM_USER_ID } = require('../config/constants');

// Использование в offerData
sellerId: SYSTEM_USER_ID, // Вместо hardcoded 0
```

### Структура offerData

```javascript
const offerData = {
	sellerId: SYSTEM_USER_ID, // Системный аккаунт
	buyerId: userId, // Пользователь
	price: 0, // Цена (0 для задач)
	currency: reward.type, // Тип валюты
	resource: reward.type, // Тип ресурса
	amount: reward.amount, // Количество
	itemType: 'package|task', // Тип предмета
	itemId: itemId, // ID предмета
	offerType: 'SYSTEM', // Тип предложения
	txType: 'PACKAGE_REWARD|TASK_REWARD', // Тип транзакции
};
```

## 📊 Преимущества рефакторинга

1. **Единообразие**: Все изменения состояния через `marketService.registerOffer`
2. **Многоразовость**: Пакеты теперь можно использовать многократно
3. **Транзакционность**: Все операции выполняются в рамках транзакций
4. **Аудит**: Все операции логируются в таблице `paymenttransactions`
5. **Консистентность**: Единый подход к управлению ресурсами

## 🚀 API Endpoints

### Пакеты

-   `GET /api/package-store/:slug` - Получить пакет по slug
-   `POST /api/package-store/:slug/use` - Использовать пакет

### Задачи

-   `POST /api/tasks/:taskId/complete` - Завершить задачу

## ⚠️ Важные замечания

1. **Миграции**: Новые ENUM значения добавлены в существующую миграцию
2. **Обратная совместимость**: Изменения могут потребовать обновления клиентского кода
3. **Тестирование**: Рекомендуется протестировать все сценарии использования
4. **Документация**: Обновлена документация API endpoints
