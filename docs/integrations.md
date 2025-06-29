# 🌐 Интеграция с внешними сервисами

## Содержание

-   [Telegram Mini Apps](#telegram-mini-apps)
-   [AlertManager (Slack, Email, PagerDuty)](#alertmanager)
-   [Prometheus и Grafana](#prometheus-и-grafana)
-   [Sentry (отслеживание ошибок)](#sentry)
-   [UptimeRobot / StatusCake (healthcheck)](#uptimerobot--statuscake)
-   [AWS S3 (бэкапы)](#aws-s3)
-   [Jaeger (трейсинг)](#jaeger)

---

## Telegram Mini Apps

**Назначение:** Аутентификация пользователей через Telegram.

-   Используйте заголовок `x-telegram-init-data` для передачи данных.
-   Валидация подписи через библиотеку [@tma.js/init-data-node](https://github.com/tma-js/init-data-node).

**Пример:**

```js
const { validateInitData } = require('@tma.js/init-data-node');
const initData = req.headers['x-telegram-init-data'];
const validated = validateInitData(initData, process.env.BOT_TOKEN);
if (!validated) throw new Error('Invalid Telegram signature');
```

**Документация:**

-   https://core.telegram.org/bots/webapps#initializing-mini-apps

---

## AlertManager

**Назначение:** Отправка алертов в Slack, Email, PagerDuty и др.

**Пример конфигурации Slack:**

```yaml
receivers:
    - name: 'slack-notifications'
      slack_configs:
          - channel: '#alerts'
            title: '{{ template "slack.title" . }}'
            text: '{{ template "slack.text" . }}'
            send_resolved: true
```

**Пример конфигурации Email:**

```yaml
receivers:
    - name: 'email-notifications'
      email_configs:
          - to: 'ops@nebulahant.com'
            headers:
                subject: 'NebulaHant Alert: {{ .GroupLabels.alertname }}'
            body: '{{ template "email.body" . }}'
```

**Пример конфигурации PagerDuty:**

```yaml
receivers:
    - name: 'pager-duty-critical'
      pagerduty_configs:
          - service_key: 'your-pagerduty-service-key'
            description: '{{ template "pagerduty.description" . }}'
```

**Документация:**

-   https://prometheus.io/docs/alerting/latest/alertmanager/

---

## Prometheus и Grafana

**Назначение:** Сбор, хранение и визуализация метрик.

-   Экспорт `/metrics` через express-prom-bundle или prom-client.
-   Grafana подключается к Prometheus и строит дашборды.

**Пример экспорта метрик:**

```js
const promBundle = require('express-prom-bundle');
app.use(promBundle({ includeMethod: true, includePath: true }));
// /metrics endpoint автоматически
```

**Документация:**

-   https://prometheus.io/docs/introduction/overview/
-   https://grafana.com/docs/grafana/latest/

---

## Sentry (отслеживание ошибок)

**Назначение:** Централизованный сбор ошибок и исключений.

**Пример интеграции:**

```js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**Документация:**

-   https://docs.sentry.io/platforms/node/

---

## UptimeRobot / StatusCake

**Назначение:** Внешний мониторинг доступности API.

-   Настройте мониторинг endpoint'а `/health`.
-   Получайте уведомления о недоступности сервиса.

**Пример:**

-   URL: `https://api.nebulahant.com/health`
-   Тип проверки: HTTP(s)
-   Период: 1 минута

**Документация:**

-   https://uptimerobot.com/
-   https://www.statuscake.com/

---

## AWS S3 (бэкапы)

**Назначение:** Хранение резервных копий базы данных и файлов.

**Пример скрипта:**

```bash
pg_dump $DATABASE_URL > /backups/db_$(date +%Y%m%d_%H%M%S).sql
aws s3 cp /backups/ s3://nebulahant-backups/ --recursive
```

**Документация:**

-   https://docs.aws.amazon.com/cli/latest/reference/s3/

---

## Jaeger (трейсинг)

**Назначение:** Трейсинг запросов и профилирование производительности.

**Пример интеграции:**

```js
const { initTracer } = require('jaeger-client');
const tracer = initTracer({ serviceName: 'nebulahant-server' });
// Используйте middleware для старта/завершения спанов
```

**Документация:**

-   https://www.jaegertracing.io/docs/1.53/client-libraries/

---

## Рекомендации

-   Храните секреты интеграций в переменных окружения.
-   Используйте отдельные сервисные аккаунты для интеграций.
-   Документируйте все внешние зависимости и точки интеграции.
