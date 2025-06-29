# 🚀 DevOps & CI/CD Guide

## Содержание

-   [Обзор](#обзор)
-   [CI/CD Pipeline](#cicd-pipeline)
-   [Docker](#docker)
-   [Kubernetes](#kubernetes)
-   [Мониторинг](#мониторинг)
-   [Логирование](#логирование)
-   [Безопасность](#безопасность)
-   [Автоматизация](#автоматизация)
-   [Инфраструктура как код](#инфраструктура-как-код)
-   [Disaster Recovery](#disaster-recovery)

## Обзор

DevOps подход для NebulaHant Server включает автоматизацию разработки, тестирования, развертывания и мониторинга.

### Принципы

-   **Непрерывная интеграция** - автоматическое тестирование при каждом коммите
-   **Непрерывная доставка** - автоматическое развертывание в staging
-   **Непрерывное развертывание** - автоматическое развертывание в production
-   **Инфраструктура как код** - версионирование конфигурации инфраструктуры
-   **Мониторинг и логирование** - постоянное наблюдение за системой

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
    push:
        branches: [main, develop]
    pull_request:
        branches: [main]

env:
    NODE_VERSION: '18'
    POSTGRES_VERSION: '14'

jobs:
    test:
        name: Test
        runs-on: ubuntu-latest

        services:
            postgres:
                image: postgres:14
                env:
                    POSTGRES_PASSWORD: postgres
                    POSTGRES_DB: test_db
                options: >-
                    --health-cmd pg_isready
                    --health-interval 10s
                    --health-timeout 5s
                    --health-retries 5
                ports:
                    - 5432:5432

        steps:
            - name: Checkout code
              uses: actions/checkout@v4

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: ${{ env.NODE_VERSION }}
                  cache: 'npm'

            - name: Install dependencies
              run: npm ci

            - name: Run linting
              run: npm run lint

            - name: Run tests
              run: npm run test:coverage
              env:
                  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
                  NODE_ENV: test

            - name: Upload coverage
              uses: codecov/codecov-action@v3
              with:
                  file: ./coverage/lcov.info

    security:
        name: Security Scan
        runs-on: ubuntu-latest
        needs: test

        steps:
            - name: Checkout code
              uses: actions/checkout@v4

            - name: Run SAST scan
              uses: github/codeql-action/init@v2
              with:
                  languages: javascript

            - name: Perform CodeQL Analysis
              uses: github/codeql-action/analyze@v2

            - name: Run dependency scan
              run: npm audit --audit-level moderate

    build:
        name: Build Docker Image
        runs-on: ubuntu-latest
        needs: [test, security]
        if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'

        steps:
            - name: Checkout code
              uses: actions/checkout@v4

            - name: Set up Docker Buildx
              uses: docker/setup-buildx-action@v3

            - name: Login to Docker Hub
              uses: docker/login-action@v3
              with:
                  username: ${{ secrets.DOCKER_USERNAME }}
                  password: ${{ secrets.DOCKER_PASSWORD }}

            - name: Build and push
              uses: docker/build-push-action@v5
              with:
                  context: .
                  push: true
                  tags: |
                      nebulahant/server:${{ github.sha }}
                      nebulahant/server:${{ github.ref_name }}
                  cache-from: type=gha
                  cache-to: type=gha,mode=max

    deploy-staging:
        name: Deploy to Staging
        runs-on: ubuntu-latest
        needs: build
        if: github.ref == 'refs/heads/develop'
        environment: staging

        steps:
            - name: Deploy to staging
              run: |
                  echo "Deploying to staging environment"
                  # Здесь будет команда развертывания в staging

    deploy-production:
        name: Deploy to Production
        runs-on: ubuntu-latest
        needs: build
        if: github.ref == 'refs/heads/main'
        environment: production

        steps:
            - name: Deploy to production
              run: |
                  echo "Deploying to production environment"
                  # Здесь будет команда развертывания в production
```

### Git Flow

```bash
# Основные ветки
main        # Продакшн версия
develop     # Разработка
feature/*   # Новые функции
hotfix/*    # Срочные исправления
release/*   # Подготовка релиза

# Workflow
git checkout develop
git pull origin develop
git checkout -b feature/new-feature
# Разработка...
git commit -m "feat: add new feature"
git push origin feature/new-feature
# Создать Pull Request в develop

# После тестирования
git checkout develop
git merge feature/new-feature
git push origin develop

# Релиз
git checkout -b release/v1.2.0
# Подготовка релиза...
git checkout main
git merge release/v1.2.0
git tag v1.2.0
git push origin main --tags
```

## Docker

### Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Копирование package файлов
COPY package*.json ./
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Создание пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Установка прав
RUN chown -R nodejs:nodejs /app
USER nodejs

# Экспорт порта
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Запуск приложения
CMD ["node", "index.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
    app:
        build: .
        ports:
            - '5000:5000'
        environment:
            - NODE_ENV=production
            - DATABASE_URL=postgresql://postgres:password@db:5432/nebulahant
            - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
            - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
            - BOT_TOKEN=${BOT_TOKEN}
        depends_on:
            db:
                condition: service_healthy
        restart: unless-stopped
        networks:
            - app-network

    db:
        image: postgres:14-alpine
        environment:
            - POSTGRES_DB=nebulahant
            - POSTGRES_USER=postgres
            - POSTGRES_PASSWORD=password
        volumes:
            - postgres_data:/var/lib/postgresql/data
            - ./init.sql:/docker-entrypoint-initdb.d/init.sql
        ports:
            - '5432:5432'
        healthcheck:
            test: ['CMD-SHELL', 'pg_isready -U postgres']
            interval: 10s
            timeout: 5s
            retries: 5
        restart: unless-stopped
        networks:
            - app-network

    redis:
        image: redis:7-alpine
        ports:
            - '6379:6379'
        volumes:
            - redis_data:/data
        restart: unless-stopped
        networks:
            - app-network

    nginx:
        image: nginx:alpine
        ports:
            - '80:80'
            - '443:443'
        volumes:
            - ./nginx.conf:/etc/nginx/nginx.conf
            - ./ssl:/etc/nginx/ssl
        depends_on:
            - app
        restart: unless-stopped
        networks:
            - app-network

volumes:
    postgres_data:
    redis_data:

networks:
    app-network:
        driver: bridge
```

### Multi-stage Build

```dockerfile
# Dockerfile.multi
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS dependencies
RUN npm ci --only=production

FROM base AS dev-dependencies
RUN npm ci

FROM base AS builder
COPY --from=dev-dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000
CMD ["node", "dist/index.js"]
```

## Kubernetes

### Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
    name: nebulahant
    labels:
        name: nebulahant
```

### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
    name: nebulahant-config
    namespace: nebulahant
data:
    NODE_ENV: 'production'
    PORT: '5000'
    LOG_LEVEL: 'info'
    CORS_ORIGIN: 'https://nebulahant.com'
```

### Secret

```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
    name: nebulahant-secrets
    namespace: nebulahant
type: Opaque
data:
    JWT_ACCESS_SECRET: <base64-encoded>
    JWT_REFRESH_SECRET: <base64-encoded>
    BOT_TOKEN: <base64-encoded>
    DATABASE_URL: <base64-encoded>
```

### Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
    name: nebulahant-server
    namespace: nebulahant
    labels:
        app: nebulahant-server
spec:
    replicas: 3
    selector:
        matchLabels:
            app: nebulahant-server
    template:
        metadata:
            labels:
                app: nebulahant-server
        spec:
            containers:
                - name: nebulahant-server
                  image: nebulahant/server:latest
                  ports:
                      - containerPort: 5000
                  env:
                      - name: NODE_ENV
                        valueFrom:
                            configMapKeyRef:
                                name: nebulahant-config
                                key: NODE_ENV
                      - name: PORT
                        valueFrom:
                            configMapKeyRef:
                                name: nebulahant-config
                                key: PORT
                      - name: JWT_ACCESS_SECRET
                        valueFrom:
                            secretKeyRef:
                                name: nebulahant-secrets
                                key: JWT_ACCESS_SECRET
                      - name: JWT_REFRESH_SECRET
                        valueFrom:
                            secretKeyRef:
                                name: nebulahant-secrets
                                key: JWT_REFRESH_SECRET
                      - name: BOT_TOKEN
                        valueFrom:
                            secretKeyRef:
                                name: nebulahant-secrets
                                key: BOT_TOKEN
                      - name: DATABASE_URL
                        valueFrom:
                            secretKeyRef:
                                name: nebulahant-secrets
                                key: DATABASE_URL
                  resources:
                      requests:
                          memory: '256Mi'
                          cpu: '250m'
                      limits:
                          memory: '512Mi'
                          cpu: '500m'
                  livenessProbe:
                      httpGet:
                          path: /health
                          port: 5000
                      initialDelaySeconds: 30
                      periodSeconds: 10
                  readinessProbe:
                      httpGet:
                          path: /health
                          port: 5000
                      initialDelaySeconds: 5
                      periodSeconds: 5
                  securityContext:
                      runAsNonRoot: true
                      runAsUser: 1001
                      allowPrivilegeEscalation: false
                      readOnlyRootFilesystem: true
```

### Service

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
    name: nebulahant-service
    namespace: nebulahant
    labels:
        app: nebulahant-server
spec:
    type: ClusterIP
    ports:
        - port: 80
          targetPort: 5000
          protocol: TCP
    selector:
        app: nebulahant-server
```

### Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
    name: nebulahant-ingress
    namespace: nebulahant
    annotations:
        kubernetes.io/ingress.class: 'nginx'
        cert-manager.io/cluster-issuer: 'letsencrypt-prod'
        nginx.ingress.kubernetes.io/ssl-redirect: 'true'
        nginx.ingress.kubernetes.io/rate-limit: '100'
spec:
    tls:
        - hosts:
              - api.nebulahant.com
          secretName: nebulahant-tls
    rules:
        - host: api.nebulahant.com
          http:
              paths:
                  - path: /
                    pathType: Prefix
                    backend:
                        service:
                            name: nebulahant-service
                            port:
                                number: 80
```

### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
    name: nebulahant-hpa
    namespace: nebulahant
spec:
    scaleTargetRef:
        apiVersion: apps/v1
        kind: Deployment
        name: nebulahant-server
    minReplicas: 3
    maxReplicas: 10
    metrics:
        - type: Resource
          resource:
              name: cpu
              target:
                  type: Utilization
                  averageUtilization: 70
        - type: Resource
          resource:
              name: memory
              target:
                  type: Utilization
                  averageUtilization: 80
```

## Мониторинг

### Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
    scrape_interval: 15s
    evaluation_interval: 15s

rule_files:
    - 'rules/*.yml'

scrape_configs:
    - job_name: 'nebulahant-server'
      static_configs:
          - targets: ['nebulahant-service:5000']
      metrics_path: '/metrics'
      scrape_interval: 10s

    - job_name: 'postgres'
      static_configs:
          - targets: ['postgres-exporter:9187']

    - job_name: 'redis'
      static_configs:
          - targets: ['redis-exporter:9121']
```

### Grafana Dashboard

```json
{
	"dashboard": {
		"title": "NebulaHant Server Dashboard",
		"panels": [
			{
				"title": "HTTP Request Rate",
				"type": "graph",
				"targets": [
					{
						"expr": "rate(http_requests_total[5m])",
						"legendFormat": "{{method}} {{route}}"
					}
				]
			},
			{
				"title": "Response Time",
				"type": "graph",
				"targets": [
					{
						"expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
						"legendFormat": "95th percentile"
					}
				]
			},
			{
				"title": "Error Rate",
				"type": "graph",
				"targets": [
					{
						"expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
						"legendFormat": "5xx errors"
					}
				]
			},
			{
				"title": "Active Users",
				"type": "stat",
				"targets": [
					{
						"expr": "active_users_total"
					}
				]
			}
		]
	}
}
```

### Alerting Rules

```yaml
# monitoring/rules/alerts.yml
groups:
    - name: nebulahant-alerts
      rules:
          - alert: HighErrorRate
            expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
            for: 2m
            labels:
                severity: critical
            annotations:
                summary: 'High error rate detected'
                description: 'Error rate is {{ $value }} errors per second'

          - alert: HighResponseTime
            expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
            for: 5m
            labels:
                severity: warning
            annotations:
                summary: 'High response time detected'
                description: '95th percentile response time is {{ $value }} seconds'

          - alert: DatabaseConnectionFailed
            expr: up{job="postgres"} == 0
            for: 1m
            labels:
                severity: critical
            annotations:
                summary: 'Database connection failed'
                description: 'PostgreSQL is down'

          - alert: HighMemoryUsage
            expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.8
            for: 5m
            labels:
                severity: warning
            annotations:
                summary: 'High memory usage'
                description: 'Memory usage is {{ $value | humanizePercentage }}'
```

## Логирование

### ELK Stack Configuration

```yaml
# logging/elasticsearch.yml
cluster.name: nebulahant-cluster
node.name: node-1
network.host: 0.0.0.0
http.port: 9200
discovery.type: single-node
xpack.security.enabled: true
```

```yaml
# logging/logstash.conf
input {
beats {
port => 5044
}
}

filter {
if [fields][service] == "nebulahant" {
grok {
match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}" }
}

date {
match => [ "timestamp", "ISO8601" ]
}

if [level] == "ERROR" {
mutate {
add_tag => [ "error" ]
}
}
}
}

output {
elasticsearch {
hosts => ["elasticsearch:9200"]
index => "nebulahant-logs-%{+YYYY.MM.dd}"
}
}
```

```yaml
# logging/filebeat.yml
filebeat.inputs:
    - type: container
      paths:
          - '/var/lib/docker/containers/*/*.log'
      processors:
          - add_docker_metadata:
                host: 'unix:///var/run/docker.sock'

output.logstash:
    hosts: ['logstash:5044']

logging.json: true
```

## Безопасность

### Security Policies

```yaml
# security/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
    name: nebulahant-network-policy
    namespace: nebulahant
spec:
    podSelector:
        matchLabels:
            app: nebulahant-server
    policyTypes:
        - Ingress
        - Egress
    ingress:
        - from:
              - namespaceSelector:
                    matchLabels:
                        name: ingress-nginx
          ports:
              - protocol: TCP
                port: 5000
    egress:
        - to:
              - namespaceSelector:
                    matchLabels:
                        name: nebulahant
          ports:
              - protocol: TCP
                port: 5432
        - to:
              - namespaceSelector:
                    matchLabels:
                        name: nebulahant
          ports:
              - protocol: TCP
                port: 6379
```

### Pod Security Standards

```yaml
# security/pod-security.yaml
apiVersion: v1
kind: Pod
metadata:
    name: nebulahant-secure-pod
spec:
    securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
    containers:
        - name: nebulahant-server
          securityContext:
              allowPrivilegeEscalation: false
              readOnlyRootFilesystem: true
              capabilities:
                  drop:
                      - ALL
              seccompProfile:
                  type: RuntimeDefault
```

## Автоматизация

### Terraform Infrastructure

```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "nebulahant-vpc"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "nebulahant-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids = aws_subnet.private[*].id
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]
}

# RDS Instance
resource "aws_db_instance" "postgres" {
  identifier           = "nebulahant-db"
  engine               = "postgres"
  engine_version       = "14"
  instance_class       = "db.t3.micro"
  allocated_storage    = 20
  storage_type         = "gp2"
  db_name              = "nebulahant"
  username             = var.db_username
  password             = var.db_password
  skip_final_snapshot  = true

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "nebulahant-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  security_group_ids   = [aws_security_group.redis.id]
  subnet_group_name    = aws_elasticache_subnet_group.main.name
}
```

### Ansible Playbooks

```yaml
# ansible/deploy.yml
---
- name: Deploy NebulaHant Server
  hosts: app_servers
  become: yes

  vars:
      app_name: nebulahant
      app_version: "{{ lookup('env', 'APP_VERSION') }}"
      docker_image: 'nebulahant/server:{{ app_version }}'

  tasks:
      - name: Update system packages
        apt:
            update_cache: yes
            upgrade: yes

      - name: Install Docker
        apt:
            name: docker.io
            state: present

      - name: Install Docker Compose
        pip:
            name: docker-compose
            state: present

      - name: Create app directory
        file:
            path: /opt/{{ app_name }}
            state: directory
            mode: '0755'

      - name: Copy docker-compose file
        copy:
            src: docker-compose.yml
            dest: /opt/{{ app_name }}/docker-compose.yml
            mode: '0644'

      - name: Copy environment file
        copy:
            src: .env
            dest: /opt/{{ app_name }}/.env
            mode: '0600'

      - name: Pull latest image
        docker_image:
            name: '{{ docker_image }}'
            source: pull

      - name: Restart services
        docker_compose:
            project_src: /opt/{{ app_name }}
            state: present
            restarted: yes
```

## Инфраструктура как код

### Helm Chart

```yaml
# helm/nebulahant/Chart.yaml
apiVersion: v2
name: nebulahant
description: NebulaHant Server Helm Chart
version: 1.0.0
appVersion: '1.0.0'
```

```yaml
# helm/nebulahant/values.yaml
replicaCount: 3

image:
    repository: nebulahant/server
    tag: latest
    pullPolicy: IfNotPresent

service:
    type: ClusterIP
    port: 80
    targetPort: 5000

ingress:
    enabled: true
    className: nginx
    annotations:
        cert-manager.io/cluster-issuer: letsencrypt-prod
    hosts:
        - host: api.nebulahant.com
          paths:
              - path: /
                pathType: Prefix

resources:
    requests:
        memory: 256Mi
        cpu: 250m
    limits:
        memory: 512Mi
        cpu: 500m

autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
    targetMemoryUtilizationPercentage: 80

env:
    NODE_ENV: production
    PORT: 5000
    LOG_LEVEL: info
```

### ArgoCD Application

```yaml
# argocd/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
    name: nebulahant
    namespace: argocd
spec:
    project: default
    source:
        repoURL: https://github.com/your-org/nebulahant-infrastructure
        targetRevision: HEAD
        path: k8s
    destination:
        server: https://kubernetes.default.svc
        namespace: nebulahant
    syncPolicy:
        automated:
            prune: true
            selfHeal: true
        syncOptions:
            - CreateNamespace=true
        retry:
            limit: 5
            backoff:
                duration: 5s
                factor: 2
                maxDuration: 3m
```

## Disaster Recovery

### Backup Strategy

```bash
#!/bin/bash
# scripts/backup.sh

# Database backup
pg_dump $DATABASE_URL > /backups/db_$(date +%Y%m%d_%H%M%S).sql

# File system backup
tar -czf /backups/files_$(date +%Y%m%d_%H%M%S).tar.gz /app/data

# Upload to S3
aws s3 cp /backups/ s3://nebulahant-backups/ --recursive

# Clean old backups (keep last 7 days)
find /backups -name "*.sql" -mtime +7 -delete
find /backups -name "*.tar.gz" -mtime +7 -delete
```

### Recovery Procedures

```bash
#!/bin/bash
# scripts/recovery.sh

# Restore database
psql $DATABASE_URL < /backups/db_20240101_120000.sql

# Restore files
tar -xzf /backups/files_20240101_120000.tar.gz -C /

# Restart services
docker-compose restart
```

### Monitoring and Alerting

```yaml
# monitoring/backup-monitoring.yml
groups:
    - name: backup-alerts
      rules:
          - alert: BackupFailed
            expr: backup_last_success_timestamp < time() - 86400
            for: 1h
            labels:
                severity: critical
            annotations:
                summary: 'Backup failed'
                description: 'No successful backup in the last 24 hours'

          - alert: BackupTooOld
            expr: backup_last_success_timestamp < time() - 604800
            for: 1h
            labels:
                severity: warning
            annotations:
                summary: 'Backup is too old'
                description: 'Last backup is older than 7 days'
```

## Заключение

Этот DevOps гайд покрывает все основные аспекты автоматизации и управления инфраструктурой для NebulaHant Server:

-   **CI/CD Pipeline** - автоматизация разработки и развертывания
-   **Docker** - контейнеризация приложения
-   **Kubernetes** - оркестрация контейнеров
-   **Мониторинг** - наблюдение за системой
-   **Логирование** - централизованное логирование
-   **Безопасность** - защита инфраструктуры
-   **Автоматизация** - автоматизация операций
-   **Infrastructure as Code** - версионирование инфраструктуры
-   **Disaster Recovery** - восстановление после сбоев

Регулярно обновляйте и адаптируйте эти конфигурации под ваши потребности.
