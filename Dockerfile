FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install all dependencies including dev dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application if needed (uncomment if you have a build step)
# RUN npm run build

# Production image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application files from build stage
COPY --from=build /app/config ./config
COPY --from=build /app/controllers ./controllers
COPY --from=build /app/dtos ./dtos
COPY --from=build /app/exceptions ./exceptions
COPY --from=build /app/jobs ./jobs
COPY --from=build /app/middlewares ./middlewares
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/models ./models
COPY --from=build /app/routes ./routes
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/seeders ./seeders
COPY --from=build /app/service ./service
COPY --from=build /app/templates ./templates
COPY --from=build /app/utils ./utils
COPY --from=build /app/app.js ./app.js
COPY --from=build /app/db.js ./db.js
COPY --from=build /app/index.js ./index.js
COPY --from=build /app/.sequelizerc ./.sequelizerc
COPY --from=build /app/clear-database.js ./clear-database.js
COPY --from=build /app/setup-with-server.js ./setup-with-server.js
COPY --from=build /app/run-migrations.js ./run-migrations.js

# Create directory for logs and set permissions
RUN mkdir -p /app/logs && \
    chown -R node:node /app/logs

# Set permissions for config directory (to allow game-constants.js updates)
RUN chown -R node:node /app/config && \
    chmod -R 755 /app/config

# Use non-root user for security
USER node

# Expose application port
EXPOSE 3002

# Healthcheck to verify the application is running
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/api/health || exit 1

# Start the application
CMD ["node", "index.js"] 