# Base stage with Node.js
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Dependencies stage (full - includes dev deps used for building)
FROM base AS deps-build
COPY package*.json ./
RUN npm install

# Production-only dependencies (smaller image)
FROM base AS deps-prod
COPY package*.json ./
RUN npm install --omit=dev

# Development stage
FROM base AS development
COPY --from=deps-build /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Builder stage for production
FROM base AS builder
COPY --from=deps-build /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_APP_INIT=1
# Run typecheck to fail fast and show full errors
RUN npm run typecheck
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Provide node_modules in production so we can run migration scripts at container start
COPY --from=deps /app/node_modules ./node_modules

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
