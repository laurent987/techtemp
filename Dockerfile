# Multi-stage Dockerfile for TechTemp IoT Service
# Optimized for production deployment

# Stage 1: Dependencies installation
FROM node:20-alpine AS dependencies
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && \
    npm cache clean --force

# Stage 2: Runtime image
FROM node:20-alpine AS runtime
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S techtemp -u 1001

# Copy production dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY backend/ ./backend/

# Create data directory for SQLite
RUN mkdir -p /app/data && \
    chown -R techtemp:nodejs /app

# Switch to non-root user
USER techtemp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/main.js"]