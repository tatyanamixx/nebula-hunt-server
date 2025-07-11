#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to display help
show_help() {
  echo -e "${BLUE}Nebulahunt Docker Helper Script${NC}"
  echo -e "Usage: $0 [command]"
  echo -e ""
  echo -e "Commands:"
  echo -e "  ${GREEN}start${NC}         Start production environment"
  echo -e "  ${GREEN}stop${NC}          Stop production environment"
  echo -e "  ${GREEN}dev${NC}           Start development environment"
  echo -e "  ${GREEN}dev:stop${NC}      Stop development environment"
  echo -e "  ${GREEN}migrate${NC}       Run database migrations"
  echo -e "  ${GREEN}migrate:undo${NC}  Undo last migration"
  echo -e "  ${GREEN}logs${NC}          Show logs from production app"
  echo -e "  ${GREEN}dev:logs${NC}      Show logs from development app"
  echo -e "  ${GREEN}psql${NC}          Connect to PostgreSQL CLI"
  echo -e "  ${GREEN}redis-cli${NC}     Connect to Redis CLI"
  echo -e "  ${GREEN}shell${NC}         Open shell in app container"
  echo -e "  ${GREEN}build${NC}         Rebuild containers"
  echo -e "  ${GREEN}clean${NC}         Remove all containers and volumes"
  echo -e "  ${GREEN}help${NC}          Show this help message"
}

# Check if Docker is running
check_docker() {
  if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
  fi
}

# Start production environment
start_prod() {
  echo -e "${BLUE}Starting production environment...${NC}"
  docker-compose up -d
  echo -e "${GREEN}Production environment started${NC}"
  echo -e "Application: http://localhost:5000"
  echo -e "pgAdmin: http://localhost:8080"
}

# Stop production environment
stop_prod() {
  echo -e "${BLUE}Stopping production environment...${NC}"
  docker-compose down
  echo -e "${GREEN}Production environment stopped${NC}"
}

# Start development environment
start_dev() {
  echo -e "${BLUE}Starting development environment...${NC}"
  docker-compose -f docker-compose.dev.yml up -d
  echo -e "${GREEN}Development environment started${NC}"
  echo -e "Application: http://localhost:5000"
  echo -e "pgAdmin: http://localhost:8080"
}

# Stop development environment
stop_dev() {
  echo -e "${BLUE}Stopping development environment...${NC}"
  docker-compose -f docker-compose.dev.yml down
  echo -e "${GREEN}Development environment stopped${NC}"
}

# Run migrations
run_migrate() {
  echo -e "${BLUE}Running database migrations...${NC}"
  docker-compose -f docker-compose.migrate.yml up
  echo -e "${GREEN}Migrations completed${NC}"
}

# Undo last migration
undo_migrate() {
  echo -e "${BLUE}Undoing last migration...${NC}"
  docker-compose exec app npm run migrate:undo
  echo -e "${GREEN}Migration undone${NC}"
}

# Show logs
show_logs() {
  echo -e "${BLUE}Showing logs from production app...${NC}"
  docker-compose logs -f app
}

# Show dev logs
show_dev_logs() {
  echo -e "${BLUE}Showing logs from development app...${NC}"
  docker-compose -f docker-compose.dev.yml logs -f app
}

# Connect to PostgreSQL
connect_psql() {
  echo -e "${BLUE}Connecting to PostgreSQL...${NC}"
  docker-compose exec postgres psql -U postgres -d nebulahunt
}

# Connect to Redis
connect_redis() {
  echo -e "${BLUE}Connecting to Redis...${NC}"
  docker-compose exec redis redis-cli
}

# Open shell in app container
open_shell() {
  echo -e "${BLUE}Opening shell in app container...${NC}"
  docker-compose exec app sh
}

# Rebuild containers
rebuild() {
  echo -e "${BLUE}Rebuilding containers...${NC}"
  docker-compose build
  echo -e "${GREEN}Containers rebuilt${NC}"
}

# Clean up containers and volumes
clean() {
  echo -e "${YELLOW}Warning: This will remove all containers and volumes. Continue? (y/n)${NC}"
  read -r confirm
  if [[ $confirm == "y" || $confirm == "Y" ]]; then
    echo -e "${BLUE}Removing all containers and volumes...${NC}"
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v
    docker-compose -f docker-compose.migrate.yml down -v
    echo -e "${GREEN}All containers and volumes removed${NC}"
  else
    echo -e "${BLUE}Operation cancelled${NC}"
  fi
}

# Check if Docker is running
check_docker

# Parse command
case "$1" in
  start)
    start_prod
    ;;
  stop)
    stop_prod
    ;;
  dev)
    start_dev
    ;;
  dev:stop)
    stop_dev
    ;;
  migrate)
    run_migrate
    ;;
  migrate:undo)
    undo_migrate
    ;;
  logs)
    show_logs
    ;;
  dev:logs)
    show_dev_logs
    ;;
  psql)
    connect_psql
    ;;
  redis-cli)
    connect_redis
    ;;
  shell)
    open_shell
    ;;
  build)
    rebuild
    ;;
  clean)
    clean
    ;;
  help|*)
    show_help
    ;;
esac 