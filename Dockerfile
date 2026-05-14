FROM node:24-alpine AS builder
WORKDIR /app

ENV DATABASE_URL=postgresql://postgres:password@db:5432/knowledge_hub?schema=public

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:24-alpine AS production
WORKDIR /app

RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://postgres:password@db:5432/knowledge_hub?schema=public
ENV PATH="/app/node_modules/.bin:$PATH"

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/logs && chown -R nestjs:nodejs /app

USER nestjs
EXPOSE 4000

CMD ["sh", "-c", "prisma migrate deploy && node dist/src/main.js"]
