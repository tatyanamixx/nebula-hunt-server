# 🔐 Новая система аутентификации с Google 2FA и приглашениями

## 📋 Обзор

Система была обновлена для поддержки:

-   **Google Authenticator 2FA** для администраторов
-   **Email приглашения** для новых администраторов
-   **Парольная аутентификация** вместо Telegram WebApp

## 🔄 Изменения в API

### 1. Аутентификация администраторов

#### POST `/api/admin/login`

**Описание:** Первый шаг аутентификации - проверка email

```json
{
	"email": "admin@example.com"
}
```

**Ответ:**

```json
{
	"message": "Please enter 2FA code",
	"email": "admin@example.com",
	"requires2FA": true
}
```

#### POST `/api/admin/2fa/verify`

**Описание:** Второй шаг - проверка 2FA кода

```json
{
	"email": "admin@example.com",
	"otp": "123456"
}
```

**Ответ:**

```json
{
	"message": "2FA verification successful",
	"email": "admin@example.com",
	"id": 1,
	"role": "ADMIN",
	"accessToken": "jwt_token",
	"refreshToken": "refresh_token"
}
```

### 2. Регистрация новых администраторов

#### POST `/api/admin/register`

**Описание:** Регистрация по приглашению

```json
{
	"email": "newadmin@example.com",
	"password": "securepassword123",
	"name": "New Admin",
	"inviteToken": "invite_token_here"
}
```

**Ответ:**

```json
{
	"message": "Admin registered successfully",
	"google2faSecret": "JBSWY3DPEHPK3PXP",
	"otpAuthUrl": "otpauth://totp/Nebulahunt%20Admin%20(newadmin@example.com)?secret=JBSWY3DPEHPK3PXP&issuer=Nebulahunt"
}
```

#### POST `/api/admin/2fa/complete`

**Описание:** Завершение настройки 2FA

```json
{
	"email": "newadmin@example.com",
	"otp": "123456",
	"inviteToken": "invite_token_here"
}
```

**Ответ:**

```json
{
	"message": "2FA setup completed successfully"
}
```

### 3. Система приглашений

#### POST `/api/admin/invite`

**Описание:** Отправка приглашения (требует аутентификации)

```json
{
	"email": "invite@example.com",
	"name": "Invited Admin",
	"role": "ADMIN"
}
```

**Ответ:**

```json
{
	"message": "Invitation sent successfully",
	"email": "invite@example.com"
}
```

#### GET `/api/admin/invite/validate?token=token_here`

**Описание:** Валидация токена приглашения

```json
{
	"email": "invite@example.com",
	"name": "Invited Admin",
	"role": "ADMIN"
}
```

#### GET `/api/admin/invites`

**Описание:** Получение списка приглашений (требует аутентификации)

```json
[
	{
		"id": 1,
		"email": "admin1@example.com",
		"name": "Admin One",
		"role": "ADMIN",
		"status": "PENDING",
		"createdAt": "2025-01-15T10:00:00Z",
		"expiresAt": "2025-01-22T10:00:00Z"
	}
]
```

### 4. Статистика

#### GET `/api/admin/stats`

**Описание:** Статистика для дашборда (требует аутентификации)

```json
{
	"totalUsers": 1250,
	"activeUsers": 847,
	"totalStardust": 15420,
	"totalDarkMatter": 1250,
	"totalGalaxies": 89,
	"totalArtifacts": 234
}
```

### 5. Управление пользователями

#### GET `/api/admin/users`

**Описание:** Список пользователей (требует аутентификации)

#### POST `/api/admin/users/{id}/block`

**Описание:** Блокировка пользователя (требует аутентификации)

#### POST `/api/admin/users/{id}/unblock`

**Описание:** Разблокировка пользователя (требует аутентификации)

## 🗄️ Изменения в базе данных

### Таблица `admins`

Добавлены новые поля:

-   `name` (STRING) - имя администратора
-   `password` (STRING) - хешированный пароль

### Таблица `admininvites`

Добавлены новые поля:

-   `name` (STRING) - имя приглашаемого
-   `role` (ENUM) - роль (ADMIN/SUPERVISOR)
-   `expiresAt` (DATE) - срок действия приглашения

## 🔧 Настройка

### 1. Переменные окружения

```env
# SMTP для отправки приглашений
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Email супервайзера
SUPERVISOR_EMAIL=supervisor@example.com

# Секретный ключ для инициализации
ADMIN_INIT_SECRET=your_secret_key
```

### 2. Миграции

```bash
npm run migrate
```

### 3. Инициализация супервайзера

```bash
curl -X POST http://localhost:5000/api/admin/supervisor/init
```

## 🔒 Безопасность

### 2FA

-   Используется Google Authenticator
-   Секреты генерируются с помощью speakeasy
-   Поддерживается окно в 30 секунд (±1 период)

### Пароли

-   Минимальная длина: 8 символов
-   Хеширование с помощью bcrypt (salt rounds: 10)

### Приглашения

-   Токены генерируются криптографически случайно
-   Срок действия: 7 дней
-   Одноразовое использование

## 🧪 Тестирование

### 1. Создание приглашения

```bash
curl -X POST http://localhost:5000/api/admin/invite \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test Admin",
    "role": "ADMIN"
  }'
```

### 2. Регистрация администратора

```bash
curl -X POST http://localhost:5000/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test Admin",
    "inviteToken": "TOKEN_FROM_INVITE"
  }'
```

### 3. Аутентификация

```bash
# Шаг 1: Проверка email
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Шаг 2: Проверка 2FA
curl -X POST http://localhost:5000/api/admin/2fa/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

## 📝 Примечания

1. **Обратная совместимость:** Старые эндпоинты `/admin/init` и `/admin/supervisor/init` сохранены
2. **Telegram WebApp:** Больше не используется для аутентификации администраторов
3. **Email отправка:** Пока реализована только логика, нужно добавить SMTP интеграцию
4. **Статистика:** Некоторые поля (galaxies, artifacts) пока возвращают 0, нужно добавить подсчет
