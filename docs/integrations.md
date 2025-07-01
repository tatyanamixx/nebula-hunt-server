# 🌐 Интеграция с внешними сервисами

## Содержание

-   [Telegram Mini Apps](#telegram-mini-apps)
-   [AlertManager (Slack, Email, PagerDuty)](#alertmanager)
-   [Prometheus и Grafana](#prometheus-и-grafana)
-   [Sentry (отслеживание ошибок)](#sentry)
-   [UptimeRobot / StatusCake (healthcheck)](#uptimerobot--statuscake)
-   [AWS S3 (бэкапы)](#aws-s3)
-   [Jaeger (трейсинг)](#jaeger)
-   [Zabbix (мониторинг и алерты)](#zabbix)

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

## Zabbix (мониторинг и алерты)

**Назначение:** Централизованный мониторинг состояния серверов, сервисов, баз данных и приложений. Позволяет собирать метрики, настраивать алерты и интегрироваться с внешними системами оповещений.

### Установка и базовая настройка

1. **Установка Zabbix Server и Agent (Ubuntu/Debian):**
    ```sh
    wget https://repo.zabbix.com/zabbix/6.0/ubuntu/pool/main/z/zabbix-release/zabbix-release_6.0-4+ubuntu20.04_all.deb
    sudo dpkg -i zabbix-release_6.0-4+ubuntu20.04_all.deb
    sudo apt update
    sudo apt install zabbix-server-pgsql zabbix-frontend-php zabbix-apache-conf zabbix-sql-scripts zabbix-agent postgresql
    ```
2. **Создание базы данных PostgreSQL:**
    ```sh
    sudo -u postgres createuser --pwprompt zabbix
    sudo -u postgres createdb -O zabbix zabbix
    zcat /usr/share/zabbix-sql-scripts/postgresql/server.sql.gz | psql -U zabbix -d zabbix
    ```
3. **Настройка подключения к БД:**
   В файле `/etc/zabbix/zabbix_server.conf`:
    ```
    DBHost=localhost
    DBName=zabbix
    DBUser=zabbix
    DBPassword=ВАШ_ПАРОЛЬ
    ```
4. **Запуск сервисов:**
    ```sh
    sudo systemctl restart zabbix-server zabbix-agent apache2
    sudo systemctl enable zabbix-server zabbix-agent apache2
    ```
5. **Веб-интерфейс:**

    - Откройте `http://<IP_СЕРВЕРА>/zabbix` и завершите настройку через мастер.

6. **Установка и настройка Zabbix Agent на целевых серверах:**
    ```sh
    sudo apt install zabbix-agent
    ```
    В `/etc/zabbix/zabbix_agentd.conf`:
    ```
    Server=<IP_СЕРВЕРА_ZABBIX>
    ServerActive=<IP_СЕРВЕРА_ZABBIX>
    Hostname=<ИМЯ_ХОСТА>
    ```
    Перезапуск:
    ```sh
    sudo systemctl restart zabbix-agent
    sudo systemctl enable zabbix-agent
    ```

**Документация:**

-   [Официальная документация Zabbix (RU)](https://www.zabbix.com/documentation/current/ru/manual/installation)
-   [Мониторинг PostgreSQL](https://www.zabbix.com/documentation/current/ru/manual/config/items/itemtypes/zabbix_agent/pgsql_checks)
-   [Шаблоны Zabbix](https://www.zabbix.com/integrations)

---

## Рекомендации

-   Храните секреты интеграций в переменных окружения.
-   Используйте отдельные сервисные аккаунты для интеграций.
-   Документируйте все внешние зависимости и точки интеграции.
