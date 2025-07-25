# Настройка Google OAuth для Nebulahunt Admin Panel

## Обзор

Система аутентификации Nebulahunt Admin Panel использует Google OAuth + 2FA для входа администраторов через отдельное веб-приложение (админ-панель). Telegram аутентификация используется только для обычных пользователей игры.

## Поток аутентификации

1. **Google OAuth** - пользователь авторизуется через Google
2. **Проверка прав** - система проверяет, является ли пользователь администратором
3. **2FA верификация** - пользователь вводит код из Google Authenticator
4. **Доступ** - пользователь получает доступ к админ-панели

## Настройка Google OAuth

### 1. Создание проекта в Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API и Google OAuth2 API

### 2. Создание OAuth 2.0 Client ID

1. В меню слева выберите "APIs & Services" > "Credentials"
2. Нажмите "Create Credentials" > "OAuth 2.0 Client IDs"
3. Выберите тип приложения "Web application"
4. Заполните форму:
    - **Name**: Nebulahunt Admin Panel
    - **Authorized JavaScript origins**:
        - `http://localhost:3000` (для разработки)
        - `https://your-domain.com` (для продакшена)
    - **Authorized redirect URIs**:
        - `http://localhost:3000/auth/google/callback` (для разработки)
        - `https://your-domain.com/auth/google/callback` (для продакшена)

### 3. Получение Client ID и Client Secret

После создания OAuth 2.0 Client ID вы получите:

-   **Client ID** - публичный идентификатор
-   **Client Secret** - секретный ключ (храните в безопасности)

## Настройка переменных окружения

### Frontend (.env.local)

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Backend (.env)

```env
# Google OAuth настройки
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

## Настройка базы данных

### Запуск миграции

```bash
cd nebulahunt-server
npm run migrate
```

Миграция добавит поле `google_id` в таблицу `admins`.

## Первоначальная настройка

### 1. Инициализация супервайзера

При первом запуске сервера автоматически создается супервайзер с email из переменной окружения `SUPERVISOR_EMAIL`.

### 2. Создание дополнительных администраторов

Администраторы могут создаваться двумя способами:

#### Через Google OAuth (автоматически)

-   При первом входе через Google OAuth создается новый администратор
-   Роль по умолчанию: `ADMIN`

#### Через приглашения

-   Супервайзер отправляет приглашения на email
-   Новый администратор регистрируется по приглашению

## Использование

### Вход в админ-панель

1. Откройте админ-панель
2. Нажмите "Войти через Google"
3. Авторизуйтесь в Google
4. Введите код из Google Authenticator
5. Получите доступ к панели

### Настройка 2FA

При создании администратора автоматически генерируется секрет для Google Authenticator. QR-код можно получить через API или в логах сервера.

## Безопасность

### Рекомендации

1. **Храните секреты в безопасности** - никогда не коммитьте реальные Client Secret в репозиторий
2. **Используйте HTTPS** - в продакшене обязательно используйте HTTPS
3. **Ограничьте домены** - настройте только нужные домены в Google OAuth
4. **Мониторинг** - следите за логами аутентификации

### Переменные для продакшена

```env
# Google OAuth настройки (Production)
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback

# Безопасность
NODE_ENV=production
JWT_ACCESS_SECRET=your_very_secure_access_secret
JWT_REFRESH_SECRET=your_very_secure_refresh_secret
```

## Устранение неполадок

### Ошибка "Google OAuth not available"

-   Проверьте, что Google OAuth скрипт загружен
-   Проверьте переменную `VITE_GOOGLE_CLIENT_ID`

### Ошибка "Invalid 2FA code"

-   Убедитесь, что время на сервере синхронизировано
-   Проверьте, что используется правильное приложение Google Authenticator

### Ошибка "Admin not found"

-   Проверьте, что пользователь существует в базе данных
-   Убедитесь, что у пользователя есть роль ADMIN или SUPERVISOR

## API Endpoints

### OAuth аутентификация

-   `POST /api/admin/oauth/google` - Google OAuth аутентификация
-   `POST /api/admin/oauth/2fa/verify` - 2FA верификация

### Устаревшие endpoints (email/пароль)

-   `POST /api/admin/login` - вход по email (устарел)
-   `POST /api/admin/2fa/verify` - 2FA для email (устарел)

## Логирование

Все операции аутентификации логируются с уровнем INFO:

-   Попытки OAuth аутентификации
-   Успешные/неуспешные 2FA верификации
-   Создание новых администраторов
-   Ошибки аутентификации
