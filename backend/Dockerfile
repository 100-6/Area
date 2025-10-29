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
# STAGE BUILDER - Build TypeScript
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

RUN npm run build

# ==========================================
# STAGE PRODUCTION
# ==========================================
FROM base AS production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup -g 1001 -S nodejs && \
    adduser -S area -u 1001 -G nodejs

RUN chown -R area:nodejs /app
USER area

EXPOSE 8080

CMD ["node", "dist/src/index.js"]
