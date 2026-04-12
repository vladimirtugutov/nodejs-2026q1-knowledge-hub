FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
ENV DATABASE_URL=postgresql://postgres:password@db:5432/knowledge_hub?schema=public
RUN npx prisma generate

COPY . .
RUN npm run build


FROM node:24-alpine AS production
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

WORKDIR /app

ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://postgres:password@db:5432/knowledge_hub?schema=public

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]