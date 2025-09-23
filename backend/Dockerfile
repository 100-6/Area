# ==========================================
# STAGE BASE - Common for dev & prod
# ==========================================
FROM node:22-alpine AS base

RUN apk update && \
    apk add --no-cache \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

# ==========================================
# STAGE DEVELOPMENT
# ==========================================
FROM base AS development

RUN npm ci && npm cache clean --force

COPY . .

ENV NODE_ENV=development
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "run", "dev"]

# ==========================================
# STAGE PRODUCTION
# ==========================================
FROM base AS production

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup -g 1001 -S nodejs && \
    adduser -S area -u 1001 -G nodejs

RUN chown -R area:nodejs /app
USER area

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "dist/index.js"]
