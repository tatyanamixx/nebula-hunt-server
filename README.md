# Nebulahunt Server

Сервер для космической игры Nebulahunt с системой галактик, артефактов, улучшений и торговли.

## Быстрый старт

### Требования

-   Node.js 20.x
-   PostgreSQL 16
-   Redis 7
-   Docker (опционально)

### Установка

````bash
# Клонирование репозитория
git clone <repository-url>
cd nebulahunt-server

# Установка зависимостей
npm install

# Настройка окружения

## Для разработки
```bash
cp env.development.example .env
# Отредактируйте .env файл под ваши настройки
# Игровые настройки находятся в config/constants.js
````

## Для тестов

```bash
cp env.test.example .env.test
# Отредактируйте .env.test файл под ваши настройки
# Игровые настройки находятся в config/constants.js
```

## Для продакшена

```bash
cp env.production.example .env.production
# Отредактируйте .env.production файл под ваши настройки
# Не забудьте настроить SSL сертификаты для базы данных
# Игровые настройки находятся в config/constants.js
# TON настройки: mainnet для продакшена, testnet для разработки/тестов
```

# Запуск миграций

npm run migrate

# Заполнение демонстрационными данными (опционально)

npm run seed

# Запуск сервера

npm run dev

````

## Docker

### Быстрый запуск с Docker

```bash
# Запуск production окружения
docker-compose up -d

# Запуск development окружения
docker-compose -f docker-compose.dev.yml up -d

# Запуск миграций
docker-compose -f docker-compose.migrate.yml up

# Заполнение демонстрационными данными
docker-compose exec app npm run seed
````

### Использование helper script

```bash
# Сделать скрипт исполняемым
chmod +x docker-scripts.sh

# Запуск production
./docker-scripts.sh start

# Запуск development
./docker-scripts.sh dev

# Запуск миграций
./docker-scripts.sh migrate

# Заполнение демонстрационными данными
./docker-scripts.sh seed

# Просмотр логов
./docker-scripts.sh logs
```

## База данных

### Миграции

```bash
# Запуск миграций
npm run migrate

# Откат последней миграции
npm run migrate:undo

# Откат всех миграций
npm run migrate:undo:all
```

### Seeders (Демонстрационные данные)

```bash
# Запуск всех seeders
npm run seed

# Откат всех seeders
npm run seed:undo
```

#### Демонстрационные данные включают:

-   **Пользователи**: demo_user, admin_user, system_user
-   **Галактики**: Демонстрационные галактики с различными свойствами
-   **Артефакты**: Артефакты всех редкостей (Common, Uncommon, Rare, Epic, Legendary)
-   **Узлы улучшений**: Полное дерево улучшений от базовой добычи до квантовой
-   **Задания**: Задания для создания звезд, сбора ресурсов, владения галактиками
-   **События**: Различные типы событий (разовые, периодические, случайные, условные)
-   **Рынок**: Комиссии, предложения, транзакции
-   **Пакеты**: Шаблоны пакетов для покупки ресурсов

Подробная информация о seeders находится в [seeders/README.md](seeders/README.md).

## API

### Основные эндпоинты

-   `GET /health` - Проверка здоровья сервера
-   `POST /api/auth/login` - Универсальный вход/регистрация через Telegram
-   `GET /api/auth/refresh` - Обновление сессии
-   `GET /api/state` - Состояние пользователя
-   `GET /api/galaxies` - Список галактик пользователя
-   `GET /api/artifacts` - Список артефактов пользователя
-   `GET /api/upgrades` - Список улучшений пользователя
-   `GET /api/tasks` - Список заданий пользователя
-   `GET /api/events` - Список событий пользователя
-   `GET /api/market/offers` - Предложения на рынке

### Game API эндпоинты

-   `POST /api/game/farming-reward` - Регистрация наград за фарминг
-   `POST /api/game/register-transfer-stardust-to-galaxy` - Регистрация передачи звездной пыли в галактику
-   `POST /api/game/daily-reward` - Получение ежедневной награды

### Административные эндпоинты

-   `POST /api/admin/init` - Инициализация администратора
-   `GET /api/admin/users` - Список пользователей (только для админов)
-   `GET /api/admin/statistics` - Статистика (только для админов)

### Шаблоны (только для админов)

-   `GET /api/task-templates` - Шаблоны заданий
-   `GET /api/event-templates` - Шаблоны событий
-   `GET /api/upgrade-templates` - Шаблоны улучшений
-   `GET /api/package-templates` - Шаблоны пакетов
-   `GET /api/artifact-templates` - Шаблоны артефактов
-   `GET /api/commission-templates` - Шаблоны комиссий

### Документация API

Полная документация API доступна по адресу `/api-docs` после запуска сервера.

## Тестирование

```bash
# Запуск всех тестов
npm test

# Запуск unit тестов
npm run test:unit

# Запуск integration тестов
npm run test:integration

# Запуск тестов с покрытием
npm run test:coverage
```

## Мониторинг

### Prometheus метрики

Метрики доступны по адресу `/metrics` и включают:

-   HTTP запросы и ответы
-   Время выполнения запросов
-   Количество активных соединений
-   Метрики базы данных

### Логирование

Логи записываются в файл `logs/app.log` с использованием Pino logger.

## Внешние сервисы

### TON Blockchain

Проект интегрирован с TON блокчейном для криптовалютных операций:

-   **TON_NETWORK**: Сеть TON (testnet/mainnet)
    -   `testnet` - для разработки и тестирования
    -   `mainnet` - для продакшена
-   **TON_API_KEY**: API ключ для доступа к TON API
-   **TON_WALLET_ADDRESS**: Адрес кошелька для транзакций

### Настройка по окружениям

-   **Разработка**: testnet с тестовыми ключами
-   **Тестирование**: testnet с тестовыми ключами
-   **Продакшен**: mainnet с реальными ключами

## Безопасность

-   JWT аутентификация
-   Rate limiting
-   CORS настройки
-   Helmet для защиты заголовков
-   Валидация входных данных
-   Google 2FA поддержка

## Разработка

### Структура проекта

```
nebulahunt-server/
├── controllers/     # Контроллеры API
├── middlewares/     # Middleware функции
├── models/         # Модели Sequelize
├── migrations/     # Миграции базы данных
├── seeders/        # Seeders для демонстрационных данных
├── routes/         # Маршруты API
├── service/        # Бизнес-логика
├── tests/          # Тесты
└── docs/           # Документация
```

### Добавление новых функций

1. Создайте миграцию: `npx sequelize-cli migration:generate --name feature-name`
2. Создайте модель в `models/`
3. Добавьте сервис в `service/`
4. Создайте контроллер в `controllers/`
5. Добавьте маршруты в `routes/`
6. Напишите тесты в `tests/`

## Лицензия

ISC License
