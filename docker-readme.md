# Docker Setup for Nebulahunt Server

This document provides instructions for running the Nebulahunt server using Docker and Docker Compose.

## Prerequisites

-   [Docker](https://docs.docker.com/get-docker/)
-   [Docker Compose](https://docs.docker.com/compose/install/)

## Available Docker Configurations

This project includes three Docker Compose configurations:

1. **Production** (`docker-compose.yml`): For running the application in production mode
2. **Development** (`docker-compose.dev.yml`): For local development with hot reloading
3. **Migration** (`docker-compose.migrate.yml`): For running database migrations

## Helper Scripts

For convenience, we've included a `docker-scripts.sh` helper script that simplifies common Docker operations.

### Using the Helper Script

Make the script executable:

```bash
chmod +x docker-scripts.sh
```

Available commands:

```bash
# Start production environment
./docker-scripts.sh start-prod

# Start development environment
./docker-scripts.sh start-dev

# Stop production environment
./docker-scripts.sh stop-prod

# Stop development environment
./docker-scripts.sh stop-dev

# Build production image
./docker-scripts.sh build-prod

# Build development image
./docker-scripts.sh build-dev

# Run migrations
./docker-scripts.sh migrate

# View production logs
./docker-scripts.sh logs

# View development logs
./docker-scripts.sh logs-dev

# Clean up all containers and volumes
./docker-scripts.sh clean

# Show help
./docker-scripts.sh help
```

## Production Setup

To start the application in production mode:

```bash
# Using helper script
./docker-scripts.sh start-prod

# Or using Docker Compose directly
docker-compose up -d
```

This will start:

-   The Nebulahunt server application
-   PostgreSQL database
-   Redis cache
-   Dbeaver (database management interface)

To stop the application:

```bash
# Using helper script
./docker-scripts.sh stop-prod

# Or using Docker Compose directly
docker-compose down
```

## Development Setup

For local development with hot reloading:

```bash
# Using helper script
./docker-scripts.sh start-dev

# Or using Docker Compose directly
docker-compose -f docker-compose.dev.yml up -d
```

This setup mounts your local codebase into the container, so any changes you make to the code will automatically restart the server.

To stop the development environment:

```bash
# Using helper script
./docker-scripts.sh stop-dev

# Or using Docker Compose directly
docker-compose -f docker-compose.dev.yml down
```

## Running Migrations

To run database migrations:

```bash
# Using helper script
./docker-scripts.sh migrate

# Or using Docker Compose directly
docker-compose -f docker-compose.migrate.yml up
```

This will:

1. Start a PostgreSQL container
2. Run the migrations
3. Exit when complete

## Accessing Services

-   **Application**: http://localhost:5000
-   **Dbeaver**: http://localhost:8080
    -   Access the web interface to connect to your database

## Environment Variables

The Docker Compose files use environment variables from `.env` files:

-   Production: `.env`
-   Development: `.env.dev`

Copy the `env.example` file to create your environment files:

```bash
# For production
cp env.example .env

# For development
cp env.example .env.dev
```

Important variables to configure:

```
# Database
DB_PASSWORD=secure_password

# JWT
JWT_ACCESS_SECRET=your_secure_access_secret
JWT_REFRESH_SECRET=your_secure_refresh_secret

# Redis
REDIS_PASSWORD=secure_redis_password

# Dbeaver is configured automatically
# No credentials needed in environment variables
```

## Docker Commands

### View running containers

```bash
docker ps
```

### View logs

```bash
# Using helper script
./docker-scripts.sh logs

# Or using Docker Compose directly
docker-compose logs -f app
```

### Execute commands inside container

```bash
docker-compose exec app sh
```

### Rebuild containers

```bash
# Using helper script
./docker-scripts.sh build-prod

# Or using Docker Compose directly
docker-compose build
```

## Database Management

### Connect to PostgreSQL from CLI

```bash
docker-compose exec postgres psql -U postgres -d nebulahunt
```

### Run specific migrations

```bash
docker-compose exec app npx sequelize-cli db:migrate
```

### Undo migrations

```bash
# Undo last migration
docker-compose exec app npx sequelize-cli db:migrate:undo

# Undo all migrations
docker-compose exec app npx sequelize-cli db:migrate:undo:all
```

### Access Dbeaver

1. Open http://localhost:8080 in your browser
2. Follow the initial setup wizard if it's your first time
3. Add a new connection:
    - Connection type: PostgreSQL
    - Server Host: postgres
    - Port: 5432
    - Database: nebulahunt
    - Username: postgres
    - Password: (from DB_PASSWORD in .env)

## Redis Management

### Connect to Redis CLI

```bash
docker-compose exec redis redis-cli -a your_redis_password
```

### Basic Redis commands

```bash
# Check if Redis is working
PING

# Get all keys
KEYS *

# Get value for a key
GET keyname

# Delete a key
DEL keyname

# Flush all data
FLUSHALL
```

## Troubleshooting

### Container fails to start

Check the logs:

```bash
# Using helper script
./docker-scripts.sh logs

# Or using Docker Compose directly
docker-compose logs app
```

### Database connection issues

Ensure the database is running:

```bash
docker-compose ps postgres
```

Check if the database is accessible:

```bash
docker-compose exec postgres pg_isready -U postgres
```

### Redis connection issues

Ensure Redis is running:

```bash
docker-compose ps redis
```

Test Redis connection:

```bash
docker-compose exec redis redis-cli -a your_redis_password PING
```

### Volume permission issues

If you encounter permission issues with mounted volumes:

```bash
# Fix permissions for node_modules
docker-compose exec app chown -R node:node /app/node_modules
```

## Cleanup

To remove all containers, networks, and volumes:

```bash
# Using helper script
./docker-scripts.sh clean

# Or using Docker Compose directly
docker-compose down -v
docker-compose -f docker-compose.dev.yml down -v
docker system prune -af --volumes
```

## Security Best Practices

1. **Never use default passwords** in production
2. **Restrict access** to your Docker daemon
3. **Use non-root users** inside containers (already configured)
4. **Regularly update** base images
5. **Scan images** for vulnerabilities
6. **Use secrets management** for sensitive data in production

## Performance Optimization

1. **Multi-stage builds** reduce image size
2. **Volume mounts** for development improve performance
3. **PostgreSQL tuning** can be done through environment variables
4. **Redis persistence** is configured for data durability
5. **Health checks** ensure services are running properly
