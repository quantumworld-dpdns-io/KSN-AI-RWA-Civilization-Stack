# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @aks/web... build

# Stage 2: Next.js standalone runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 10015 -S app && adduser -S -u 10015 -G app app
COPY --from=builder --chown=app:app /app/apps/web/.next/standalone ./
COPY --from=builder --chown=app:app /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=app:app /app/apps/web/public ./apps/web/public

USER 10015
EXPOSE 3000
WORKDIR /app/apps/web
CMD ["node", "server.js"]
