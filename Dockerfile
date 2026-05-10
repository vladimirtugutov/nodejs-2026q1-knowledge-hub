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

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nestjs
EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
