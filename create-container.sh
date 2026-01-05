#!/bin/bash

# Скрипт для создания контейнера API вручную
# Используй этот скрипт, если GitHub Actions не создал контейнер

echo "🚀 Создание контейнера nebulahunt-api..."
echo "=========================================="

# 1. Проверка и загрузка образа
echo ""
echo "1. Проверка образа..."
if ! docker images | grep -q "nebula-hunt-server"; then
    echo "   ⚠️  Образ не найден. Загружаю..."
    
    # Нужно залогиниться в GHCR
    echo "   📝 Введи GHCR_TOKEN (GitHub Personal Access Token):"
    read -s GHCR_TOKEN
    echo "$GHCR_TOKEN" | docker login ghcr.io -u tatyanamixx --password-stdin
    
    echo "   ⬇️  Загружаю образ..."
    docker pull ghcr.io/tatyanamixx/nebula-hunt-server:latest
else
    echo "   ✅ Образ уже есть"
fi

# 2. Остановка и удаление старого контейнера (если есть)
echo ""
echo "2. Очистка старого контейнера..."
docker stop nebulahunt-api 2>/dev/null || true
docker rm nebulahunt-api 2>/dev/null || true
echo "   ✅ Старый контейнер удален"

# 3. Создание директории для логов
echo ""
echo "3. Создание директории для логов..."
mkdir -p /var/www/nebulahunt/nebula-hunt-server/logs
chmod -R 777 /var/www/nebulahunt/nebula-hunt-server/logs
echo "   ✅ Директория создана"

# 4. Запрос SMTP_PASS (если не установлен)
echo ""
echo "4. Настройка SMTP..."
if [ -z "$SMTP_PASS" ]; then
    echo "   ⚠️  SMTP_PASS не установлен"
    echo "   📝 Введи App Password от Gmail (16 символов БЕЗ пробелов):"
    read -s SMTP_PASS
fi

# 5. Создание контейнера
echo ""
echo "5. Создание контейнера..."
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
  -e ALLOWED_ORIGINS=https://nebulahunt.site,https://admin.nebulahunt.site,https://web.telegram.org \
  -e SUPERVISOR_EMAIL=anton.mhnk541@gmail.com \
  -e SUPERVISOR_PASSWORD=09160130Fynjy \
  -e ADMIN_INIT_SECRET=a3969a620ed4e2606934ab0dee5317e2 \
  -e SMTP_HOST=smtp.gmail.com \
  -e SMTP_PORT=587 \
  -e SMTP_USER=anton.mhnk541@gmail.com \
  -e SMTP_PASS="$SMTP_PASS" \
  -e SMTP_SECURE=false \
  -e SMTP_FROM=noreply@nebulahunt.com \
  -e FRONTEND_URL=https://admin.nebulahunt.site \
  -v /var/www/nebulahunt/nebula-hunt-server/logs:/app/logs \
  ghcr.io/tatyanamixx/nebula-hunt-server:latest

if [ $? -eq 0 ]; then
    echo "   ✅ Контейнер создан!"
else
    echo "   ❌ Ошибка при создании контейнера"
    exit 1
fi

# 6. Проверка статуса
echo ""
echo "6. Проверка статуса..."
sleep 5
if docker ps | grep -q "nebulahunt-api"; then
    echo "   ✅ Контейнер запущен"
else
    echo "   ⚠️  Контейнер не запущен. Проверь логи:"
    echo "   docker logs nebulahunt-api"
    exit 1
fi

# 7. Проверка health endpoint
echo ""
echo "7. Проверка health endpoint..."
sleep 5
if curl -f http://127.0.0.1:3002/api/health > /dev/null 2>&1; then
    echo "   ✅ API отвечает"
else
    echo "   ⚠️  API не отвечает. Проверь логи:"
    echo "   docker logs nebulahunt-api --tail 50"
fi

echo ""
echo "=========================================="
echo "✅ Готово!"
echo ""
echo "Проверь логи:"
echo "   docker logs nebulahunt-api --tail 50"
echo ""
echo "Проверь health:"
echo "   curl http://127.0.0.1:3002/api/health"
echo ""

