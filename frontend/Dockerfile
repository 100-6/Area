# ==========================================
# STAGE BASE - Common for dev & prod
# ==========================================
FROM node:22-alpine AS base

RUN apk update && \
    apk add --no-cache \
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
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ==========================================
# STAGE PRODUCTION
# ==========================================
FROM base AS production

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nuxt -u 1001 -G nodejs

RUN chown -R nuxt:nodejs /app
USER nuxt

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

CMD ["npm", "run", "start"]
