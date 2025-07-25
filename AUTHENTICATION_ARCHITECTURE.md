# Архитектура аутентификации Nebulahunt

## Обзор

В Nebulahunt используется раздельная система аутентификации для разных типов пользователей:

## 1. Администраторы (Admin Panel)

### Способ входа

-   **Google OAuth + 2FA** через отдельное веб-приложение
-   Telegram аутентификация НЕ используется для админов

### Поток аутентификации

1. Админ открывает админ-панель (`http://localhost:3000`)
2. Нажимает "Войти через Google"
3. Авторизуется в Google OAuth
4. Вводит код из Google Authenticator (2FA)
5. Получает доступ к админ-панели

### API Endpoints

-   `POST /api/admin/oauth/google` - Google OAuth аутентификация
-   `POST /api/admin/oauth/2fa/verify` - 2FA верификация

### Роли

-   **SUPERVISOR** - главный администратор
-   **ADMIN** - обычный администратор

## 2. Обычные пользователи (Game)

### Способ входа

-   **Telegram WebApp** аутентификация
-   Google OAuth НЕ используется для игроков

### Поток аутентификации

1. Пользователь открывает игру в Telegram
2. Telegram WebApp автоматически передает `initData`
3. Сервер валидирует данные через Telegram Bot API
4. Пользователь получает доступ к игре

### API Endpoints

-   `POST /api/user/login` - Telegram аутентификация (через middleware)
-   Middleware: `telegramAuthMiddleware` - валидация Telegram данных

### Роли

-   **USER** - обычный игрок

## Разделение ответственности

### Admin Panel (отдельное веб-приложение)

-   Управление игрой
-   Просмотр статистики
-   Управление пользователями
-   Настройка системы

### Game (Telegram WebApp)

-   Игровой процесс
-   Пользовательский интерфейс
-   Игровая логика

## Безопасность

### Администраторы

-   Google OAuth обеспечивает надежную аутентификацию
-   2FA добавляет дополнительный уровень защиты
-   JWT токены для сессий

### Пользователи

-   Telegram WebApp обеспечивает безопасную аутентификацию
-   Данные подписываются Telegram Bot API
-   Нет необходимости в паролях

## Конфигурация

### Для админов (Admin Panel)

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# 2FA
GOOGLE_2FA_ISSUER=Nebulahunt
```

### Для пользователей (Game)

```env
# Telegram Bot
BOT_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook
```

## Логирование

### Администраторы

-   Все попытки входа через Google OAuth
-   2FA верификации
-   Создание/удаление админов

### Пользователи

-   Telegram аутентификации
-   Игровые действия
-   Ошибки аутентификации

## Миграция

### Устаревшие методы (Admin)

-   Email/пароль аутентификация помечена как deprecated
-   Старые endpoints остаются для обратной совместимости
-   Рекомендуется использовать только Google OAuth + 2FA

### Актуальные методы

-   **Админы**: Google OAuth + 2FA
-   **Пользователи**: Telegram WebApp
