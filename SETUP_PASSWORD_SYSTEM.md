# Установка и настройка системы паролей администраторов

## Шаг 1: Обновление переменных окружения

Добавьте следующие переменные в ваш `.env` файл:

```env
# =============================================================================
# ADMIN PASSWORD SETTINGS
# =============================================================================
# Пароль супервизора (устанавливается при первой инициализации)
SUPERVISOR_PASSWORD=your_secure_supervisor_password

# Время жизни пароля в днях (если не указано, пароли не истекают)
ADMIN_PASSWORD_EXPIRY_DAYS=90

# Максимальное количество неудачных попыток входа
ADMIN_MAX_LOGIN_ATTEMPTS=5

# Время блокировки аккаунта в минутах после превышения лимита попыток
ADMIN_LOCKOUT_DURATION_MINUTES=30

# Минимальная длина пароля
ADMIN_MIN_PASSWORD_LENGTH=8
```

## Шаг 2: Запуск миграции

Выполните миграцию для добавления новых полей в таблицу admin:

```bash
cd nebulahunt-server
npm run migrate
```

Это добавит следующие поля:

-   `passwordChangedAt` - дата последнего изменения пароля
-   `passwordExpiresAt` - дата истечения пароля
-   `lastLoginAt` - дата последнего входа
-   `loginAttempts` - количество неудачных попыток
-   `lockedUntil` - время блокировки аккаунта

## Шаг 3: Инициализация супервизора

При первом запуске системы супервизор будет создан автоматически с паролем из переменной окружения `SUPERVISOR_PASSWORD`.

Если супервизор уже существует, вы можете принудительно установить пароль:

```bash
# Через API (если у вас есть доступ)
curl -X POST http://localhost:5000/api/admin/supervisor/init \
  -H "Content-Type: application/json"
```

## Шаг 4: Тестирование системы

### Тест входа через пароль

```bash
# Вход супервизора
curl -X POST http://localhost:5000/api/admin/login/password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "supervisor@nebulahunt.com",
    "password": "your_secure_supervisor_password"
  }'
```

### Тест смены пароля

```bash
# Смена пароля (требует JWT токен)
curl -X POST http://localhost:5000/api/admin/password/change \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "currentPassword": "old_password",
    "newPassword": "NewSecurePass123!"
  }'
```

### Тест получения информации о пароле

```bash
# Информация о пароле (требует JWT токен)
curl -X GET http://localhost:5000/api/admin/password/info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Шаг 5: Создание администратора с паролем

### Через API

```bash
# Создание админа через приглашение
curl -X POST http://localhost:5000/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!",
    "name": "Admin User",
    "inviteToken": "invite_token_here"
  }'
```

### Через код

```javascript
const adminService = require('./service/admin-service');
const passwordService = require('./service/password-service');

// Создание админа
const admin = await Admin.create({
	email: 'admin@example.com',
	name: 'Admin User',
	role: 'ADMIN',
});

// Установка пароля
await passwordService.setPasswordWithExpiry(admin, 'SecurePass123!');
```

## Шаг 6: Настройка клиентской части

### Добавление маршрута для входа через пароль

В `nebulahunt-webclient/src/App.tsx` добавьте:

```typescript
import AdminPasswordLogin from './pages/AdminPasswordLogin';

// В роутере добавьте:
<Route path='/admin/login/password' element={<AdminPasswordLogin />} />;
```

### Добавление компонента смены пароля

В `nebulahunt-webclient/src/pages/Settings.tsx` добавьте:

```typescript
import ChangePassword from '../components/ChangePassword';

// В компоненте добавьте:
<ChangePassword />;
```

## Шаг 7: Запуск тестов

```bash
# Тесты сервиса паролей
npm run test:integration:service -- --testNamePattern="password"

# Тесты API паролей
npm run test:integration:api -- --testNamePattern="password"
```

## Примеры использования

### Создание сильного пароля

```javascript
// Примеры сильных паролей:
const strongPasswords = [
	'SecurePass123!',
	'MyAdmin@2025#',
	'Nebulahunt$456',
	'AdminPanel789!',
];

// Примеры слабых паролей (будут отклонены):
const weakPasswords = [
	'password', // Нет цифр и спецсимволов
	'12345678', // Нет букв и спецсимволов
	'abcdefgh', // Нет цифр и спецсимволов
	'short1!', // Слишком короткий
];
```

### Проверка срока действия пароля

```javascript
const passwordCheck = passwordService.checkPasswordChangeRequired(admin);

if (passwordCheck.changeRequired) {
	console.log('Пароль истек, требуется смена');
} else if (passwordCheck.warning) {
	console.log(`Пароль истечет через ${passwordCheck.daysLeft} дней`);
}
```

### Обработка блокировки аккаунта

```javascript
const lockCheck = passwordService.checkAccountLock(admin);

if (lockCheck.isLocked) {
	console.log(`Аккаунт заблокирован на ${lockCheck.minutesLeft} минут`);
}
```

## Безопасность

### Рекомендации по паролям

1. **Минимальная длина**: 8 символов
2. **Сложность**: Цифры + буквы + спецсимволы
3. **Уникальность**: Не используйте пароли от других сервисов
4. **Регулярная смена**: Меняйте пароли каждые 90 дней

### Настройки безопасности

```env
# Рекомендуемые настройки для production:
ADMIN_PASSWORD_EXPIRY_DAYS=90
ADMIN_MAX_LOGIN_ATTEMPTS=3
ADMIN_LOCKOUT_DURATION_MINUTES=60
ADMIN_MIN_PASSWORD_LENGTH=12
```

### Мониторинг

Система логирует все операции с паролями:

```javascript
// Примеры логов:
logger.info('Admin password login successful', { email });
logger.warn('Admin account locked due to failed login attempts', { email });
logger.info('Admin password changed successfully', { adminId });
```

## Troubleshooting

### Проблема: "bcrypt module not found"

**Решение:**

```bash
npm install bcrypt
```

### Проблема: "Migration failed"

**Решение:**

```bash
# Откат миграции
npm run migrate:undo

# Повторный запуск
npm run migrate
```

### Проблема: "Password validation failed"

**Решение:** Убедитесь, что пароль соответствует требованиям:

-   Минимум 8 символов
-   Содержит цифры
-   Содержит буквы
-   Содержит спецсимволы

### Проблема: "Account is locked"

**Решение:**

1. Дождитесь автоматического разблокирования
2. Или обратитесь к супервизору для принудительной разблокировки

## Дополнительные возможности

### Принудительная смена пароля (только для супервизора)

```bash
curl -X POST http://localhost:5000/api/admin/password/force-change \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUPERVISOR_JWT_TOKEN" \
  -d '{
    "adminId": 2,
    "newPassword": "NewSecurePass123!"
  }'
```

### Получение статистики паролей

```javascript
// В админ-панели можно добавить статистику:
const stats = {
	totalAdmins: await Admin.count(),
	adminsWithExpiredPasswords: await Admin.count({
		where: {
			passwordExpiresAt: { [Op.lt]: new Date() },
		},
	}),
	lockedAccounts: await Admin.count({
		where: {
			lockedUntil: { [Op.gt]: new Date() },
		},
	}),
};
```

## Заключение

Система паролей администраторов готова к использованию! Она предоставляет:

-   ✅ Безопасную аутентификацию через email и пароль
-   ✅ Отслеживание срока действия паролей
-   ✅ Защиту от брутфорс-атак
-   ✅ Автоматическую блокировку аккаунтов
-   ✅ Валидацию паролей
-   ✅ Логирование всех операций

Для получения дополнительной информации обратитесь к документации `ADMIN_PASSWORD_SYSTEM.md`.
