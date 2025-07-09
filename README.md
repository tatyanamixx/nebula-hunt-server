# NebulaHunt Server

Серверная часть проекта NebulaHunt - мини-игры для Telegram Mini Apps.

## Технологии

-   Node.js
-   Express
-   Sequelize (PostgreSQL)
-   JWT для аутентификации
-   Jest для тестирования

## Установка

```bash
# Клонирование репозитория
git clone <repository-url>
cd nebulahunt-server

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл, указав настройки базы данных и другие параметры
```

## Запуск

```bash
# Режим разработки
npm run dev

# Режим production
npm start
```

## Миграции базы данных

```bash
# Применить все миграции
npm run migrate

# Отменить последнюю миграцию
npm run migrate:undo

# Отменить все миграции
npm run migrate:undo:all

# Заполнить базу тестовыми данными
npm run seed
```

## Тестирование

Проект использует Jest для тестирования. Тесты разделены на модульные и интеграционные.

```bash
# Запуск всех тестов
npm test

# Запуск только модульных тестов
npm run test:unit

# Запуск только интеграционных тестов
npm run test:integration

# Проверка покрытия кода тестами
npm run test:coverage
```

Подробная информация о тестировании доступна в [документации по тестированию](docs/testing.md).

## Структура проекта

```
nebulahunt-server/
├── config/             # Конфигурационные файлы
├── controllers/        # Контроллеры
├── db/                 # Настройка базы данных
├── docs/               # Документация
├── exceptions/         # Классы исключений
├── middlewares/        # Middleware
├── migrations/         # Миграции базы данных
├── models/             # Модели Sequelize
├── routes/             # Маршруты API
├── seeders/            # Сидеры для заполнения базы тестовыми данными
├── service/            # Бизнес-логика
├── tests/              # Тесты
├── .env                # Переменные окружения
├── .sequelizerc        # Конфигурация Sequelize CLI
├── app.js              # Настройка Express приложения
├── index.js            # Точка входа
└── package.json        # Зависимости и скрипты
```

## API Endpoints

### Аутентификация

-   `POST /api/auth/registration` - Регистрация нового пользователя
-   `POST /api/auth/login` - Вход в систему
-   `POST /api/auth/logout` - Выход из системы
-   `GET /api/auth/refresh` - Обновление токенов
-   `GET /api/auth/friends` - Получение списка друзей

### Галактики

-   `GET /api/galaxy` - Получение списка галактик пользователя
-   `POST /api/galaxy` - Создание новой галактики
-   `GET /api/galaxy/:id` - Получение информации о галактике
-   `PUT /api/galaxy/:id` - Обновление галактики
-   `DELETE /api/galaxy/:id` - Удаление галактики

### Состояние пользователя

-   `GET /api/state` - Получение состояния пользователя
-   `PUT /api/state` - Обновление состояния пользователя

### Артефакты

-   `GET /api/artifacts` - Получение списка артефактов пользователя
-   `POST /api/artifacts` - Создание нового артефакта
-   `GET /api/artifacts/:id` - Получение информации об артефакте
-   `PUT /api/artifacts/:id` - Обновление артефакта
-   `DELETE /api/artifacts/:id` - Удаление артефакта

## Лицензия

MIT
