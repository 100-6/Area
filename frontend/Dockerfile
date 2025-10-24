# ==========================================
# STAGE 1: Dependencies installation
# ==========================================
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm cache clean --force

# ==========================================
# STAGE 2: Build the application
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npm run build

# ==========================================
# STAGE 3: Production runtime
# ==========================================
FROM node:22-alpine AS production

RUN apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nuxt -u 1001 -G nodejs

COPY --from=builder --chown=nuxt:nodejs /app/.output /app/.output

ENV NODE_ENV=production
ENV PORT=3000

USER nuxt

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

CMD ["npm", "run", "start"]

# ==========================================
# STAGE: Development
# ==========================================
FROM node:22-alpine AS development

RUN apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY . .

ENV NODE_ENV=development
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "dev"]
