FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY src ./src

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

RUN mkdir -p /app/uploads/apk

# Télécharger l'APK depuis GitHub Releases
ADD https://github.com/neolamcha/mega-supervision-crm/releases/download/v1.0.0/MegaSupervision-v1.0.0.apk /app/uploads/apk/MegaSupervision-v1.0.0.apk

RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

CMD ["sh", "-c", "node dist/database/seeds/seed.js || true; node dist/main"]
