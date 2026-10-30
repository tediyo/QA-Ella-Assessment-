# ==========================================
# Multi-stage Dockerfile for Ella API
# Optimized for caching, security, & minimal image size
# ==========================================

# 1. Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (utilizing Docker layer caching)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy application source & config
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Compile TypeScript to JavaScript
RUN npm run build

# 2. Production runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install curl for health checking
RUN apk --no-cache add curl

# Install ONLY production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy compiled artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Copy .env.example as baseline default if runtime env is not mounted
COPY .env.example .env

# Expose HTTP API port
EXPOSE 4000

# Security: Run as non-root user
USER node

# Health check probe against the NestJS /health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start production server
CMD ["node", "dist/src/main.js"]
