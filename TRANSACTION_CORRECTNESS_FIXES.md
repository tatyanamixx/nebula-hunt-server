# Transaction Correctness Fixes for User Registration

## Проблемы, которые были исправлены

### 1. Двойные транзакции

**Проблема**: Метод `registration` создавал пользователя в отдельной транзакции через `createUser()`, а затем начинал новую транзакцию для остальных операций.

**Решение**: Объединил все операции в одну транзакцию, начиная с создания пользователя.

### 2. Неправильная обработка откатов

**Проблема**: При ошибке в основной транзакции, код пытался удалить пользователя в новой транзакции, что могло привести к несогласованности данных.

**Решение**: Убрал дополнительную транзакцию для удаления пользователя, так как откат основной транзакции автоматически отменяет все изменения.

### 3. Дублирование SET CONSTRAINTS ALL DEFERRED

**Проблема**: Команда `SET CONSTRAINTS ALL DEFERRED` выполнялась и в `registration`, и в `createGalaxyAsGift`, что могло вызвать конфликты.

**Решение**: В `createGalaxyAsGift` добавил проверку `shouldCommit` перед выполнением команды отложенных ограничений.

## Исправления в коде

### user-service.js - метод registration

**До исправления**:

```javascript
async registration(userId, username, referral, galaxy) {
    // Первая транзакция - создаем только пользователя
    const { user, created } = await this.createUser(userId, username, referral);

    const transaction = await sequelize.transaction();
    try {
        // ... остальные операции
    } catch (err) {
        if (!transaction.finished) await transaction.rollback();
        const t = await sequelize.transaction();
        await user.destroy({ transaction: t });
        await t.commit();
        // ...
    }
}
```

**После исправления**:

```javascript
async registration(userId, username, referral, galaxy) {
    const transaction = await sequelize.transaction();
    try {
        // Откладываем проверку всех deferrable ограничений в начале транзакции
        await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
            transaction,
        });

        // 1. Создаем пользователя в рамках основной транзакции
        const [user, created] = await User.findOrCreate({
            where: { id: userId },
            defaults: { /* ... */ },
            transaction: transaction,
        });

        // ... остальные операции в той же транзакции

        await transaction.commit();
        return response;
    } catch (err) {
        // Откатываем транзакцию в случае ошибки
        if (!transaction.finished) {
            await transaction.rollback();
        }
        // ... обработка ошибок
    }
}
```

### game-service.js - метод createGalaxyAsGift

**До исправления**:

```javascript
async createGalaxyAsGift(galaxyData, buyerId, transaction) {
    const t = transaction || (await sequelize.transaction());
    const shouldCommit = !transaction;

    try {
        // Откладываем проверку внешних ключей до конца транзакции
        await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
            transaction: t,
        });
        // ...
    }
}
```

**После исправления**:

```javascript
async createGalaxyAsGift(galaxyData, buyerId, transaction) {
    const t = transaction || (await sequelize.transaction());
    const shouldCommit = !transaction;

    try {
        // Откладываем проверку внешних ключей до конца транзакции
        // Только если транзакция была создана в этом методе
        if (shouldCommit) {
            await sequelize.query('SET CONSTRAINTS ALL DEFERRED', {
                transaction: t,
            });
        }
        // ...
    }
}
```

## Преимущества исправлений

1. **Атомарность**: Все операции регистрации теперь выполняются в одной транзакции
2. **Консистентность**: При ошибке все изменения откатываются автоматически
3. **Производительность**: Убраны лишние транзакции и операции
4. **Надежность**: Правильная обработка отложенных ограничений

## Тестирование

Создан тест `test-transaction-correctness.js` для проверки:

-   Атомарности транзакций при успешной регистрации
-   Корректного отката при дублировании пользователя
-   Отката при ошибках в середине процесса
-   Правильной работы отложенных ограничений

## Запуск тестов

```bash
# Тест корректности транзакций
node test-transaction-correctness.js

# Тест сервиса registration с мок-данными
node test-user-service-registration.js
```

## Рекомендации

1. Всегда используйте одну транзакцию для связанных операций
2. Откладывайте проверку ограничений в начале транзакции
3. Правильно обрабатывайте откаты транзакций
4. Тестируйте сценарии ошибок для проверки откатов
