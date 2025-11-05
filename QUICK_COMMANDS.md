# Быстрые команды для API на продакшене

## Самые частые команды

```bash
# Логи (последние 50 строк)
docker logs nebulahunt-api --tail 50

# Логи (в реальном времени)
docker logs nebulahunt-api -f

# Перезапуск
docker restart nebulahunt-api

# Миграции
docker exec -it nebulahunt-api npm run migrate:prod

# Seeders
docker exec -it nebulahunt-api npm run seed

# Health check
curl http://127.0.0.1:3002/api/health
```

---

## Полная переустановка БД (последовательность)

```bash
# 1. Остановить
docker stop nebulahunt-api

# 2. Очистить БД
docker exec -it nebulahunt-api npm run clear-db

# 3. Миграции
docker exec -it nebulahunt-api npm run migrate:prod

# 4. Запустить (для system user)
docker start nebulahunt-api
sleep 15

# 5. Остановить
docker stop nebulahunt-api

# 6. Seeders
docker exec -it nebulahunt-api npm run seed

# 7. Запустить обратно
docker start nebulahunt-api
```

**Или используй скрипт:**
```bash
chmod +x reset-db.sh
./reset-db.sh
```

---

## Важно

- ❌ НЕ используй `npm run dev` в продакшене
- ✅ Используй `migrate:prod` (не просто `migrate`)
- ✅ System user создается автоматически при первом запуске
- ✅ Все переменные окружения уже установлены в контейнере

