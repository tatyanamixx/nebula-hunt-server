# Команды для работы с Docker контейнером API на продакшене

## Базовые команды

### Просмотр статуса контейнера
```bash
docker ps | grep nebulahunt-api
```

### Просмотр логов
```bash
# Последние 50 строк
docker logs nebulahunt-api --tail 50

# В реальном времени
docker logs nebulahunt-api -f
```

### Перезапуск контейнера
```bash
docker restart nebulahunt-api
```

### Остановка контейнера
```bash
docker stop nebulahunt-api
```

### Запуск контейнера
```bash
docker start nebulahunt-api
```

---

## Команды для работы с базой данных

### Выполнение команд внутри контейнера

Все команды выполняются через `docker exec`:

```bash
# Формат: docker exec -it <имя_контейнера> <команда>
docker exec -it nebulahunt-api <команда>
```

---

## Последовательность действий для полной переустановки БД

### 1. Остановить контейнер
```bash
docker stop nebulahunt-api
```

### 2. Очистить базу данных
```bash
docker exec -it nebulahunt-api npm run clear-db
```
**⚠️ Внимание:** Это удалит ВСЕ данные из базы!

### 3. Запустить миграции
```bash
# В продакшене используй migrate:prod (читает переменные из окружения)
docker exec -it nebulahunt-api npm run migrate:prod
```

### 4. Запустить контейнер (для создания system user)
```bash
docker start nebulahunt-api
# Подожди 10-15 секунд, пока создастся system user
```

### 5. Остановить контейнер
```bash
docker stop nebulahunt-api
```

### 6. Запустить seeders
```bash
docker exec -it nebulahunt-api npm run seed
```

### 7. Запустить контейнер обратно
```bash
docker start nebulahunt-api
```

---

## Отдельные команды

### Миграции
```bash
# Запустить миграции
docker exec -it nebulahunt-api npm run migrate:prod

# Откатить последнюю миграцию
docker exec -it nebulahunt-api npm run migrate:undo
```

### Seeders
```bash
# Запустить все seeders
docker exec -it nebulahunt-api npm run seed

# Откатить все seeders
docker exec -it nebulahunt-api npm run seed:undo
```

### Очистка БД
```bash
docker exec -it nebulahunt-api npm run clear-db
```

### Создание system user (через setup-with-server)
```bash
docker exec -it nebulahunt-api npm run setup:with-server
```

---

## Полный скрипт для переустановки БД

Сохрани это в файл `reset-db.sh` на сервере:

```bash
#!/bin/bash

echo "🛑 Останавливаю контейнер..."
docker stop nebulahunt-api

echo "🗑️  Очищаю базу данных..."
docker exec -it nebulahunt-api npm run clear-db

echo "📦 Запускаю миграции..."
docker exec -it nebulahunt-api npm run migrate:prod

echo "🚀 Запускаю контейнер для создания system user..."
docker start nebulahunt-api
echo "⏳ Жду 15 секунд..."
sleep 15

echo "🛑 Останавливаю контейнер..."
docker stop nebulahunt-api

echo "🌱 Запускаю seeders..."
docker exec -it nebulahunt-api npm run seed

echo "🚀 Запускаю контейнер обратно..."
docker start nebulahunt-api

echo "✅ Готово! Проверь логи: docker logs nebulahunt-api --tail 50"
```

**Использование:**
```bash
chmod +x reset-db.sh
./reset-db.sh
```

---

## Запуск контейнера с нуля (если нужно)

Если контейнер удален или не существует:

```bash
docker run -d \
  --name nebulahunt-api \
  --restart unless-stopped \
  --network host \
  -p 3002:3002 \
  -e NODE_ENV=production \
  -e PORT=3002 \
  -e DB_HOST_PROD=212.113.122.230 \
  -e DB_PORT_PROD=5433 \
  -e DB_NAME_PROD=nebulahunt \
  -e DB_USER_PROD=nebulahunt_user \
  -e DB_PASSWORD_PROD=TestPassword123 \
  -e REDIS_HOST=localhost \
  -e REDIS_PORT=6379 \
  -e BOT_TOKEN=7778437028:AAF-90jbbHgMzNYUxvdXjoTHcglql5WbP68 \
  -e JWT_ACCESS_SECRET=97ec700e00678a7351e2f5b67d12debda16f1cec8d5390d676fe13338e231a5e \
  -e JWT_REFRESH_SECRET=5de3856a934496c9b95a551feac1f858707e5c696e324803fc96c286d3f71326 \
  -e CORS_ORIGIN=https://nebulahunt.site \
  -e CLIENT_URL=https://nebulahunt.site \
  -v /var/www/nebulahunt/nebula-hunt-server/logs:/app/logs \
  ghcr.io/tatyanamixx/nebula-hunt-server:latest
```

---

## Проверка работоспособности

```bash
# Health check
curl http://127.0.0.1:3002/api/health

# Через прокси
curl https://api.nebulahunt.site/health
```

---

## Важные заметки

1. **В продакшене НЕ используй `npm run dev`** - это для разработки
2. **Все переменные окружения передаются через `-e` флаги** при запуске контейнера
3. **`migrate:prod`** использует переменные из окружения контейнера (не из `.env.production` файла)
4. **System user создается автоматически** при первом запуске приложения
5. **Логи хранятся в** `/var/www/nebulahunt/nebula-hunt-server/logs` на хосте

