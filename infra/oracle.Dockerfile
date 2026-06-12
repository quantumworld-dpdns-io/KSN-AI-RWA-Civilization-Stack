# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @aks/oracle-sim... build

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/oracle-sim/package.json ./packages/oracle-sim/
COPY --from=builder /app/packages/oracle-sim/dist ./packages/oracle-sim/dist
EXPOSE 8787
ENV NODE_ENV=production
CMD ["node", "packages/oracle-sim/dist/server.js"]
