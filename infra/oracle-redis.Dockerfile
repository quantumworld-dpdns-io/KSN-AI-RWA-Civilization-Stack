# ============================================================
# Stage 1: Build oracle-sim (pnpm monorepo)
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @aks/oracle-sim... build

# ============================================================
# Stage 2: Combined runtime — Redis + oracle-sim
# Uses supervisord to manage both processes in one container,
# required for single-container platforms like Choreo.
# ============================================================
FROM node:20-alpine AS runner

# Install Redis and supervisord from Alpine apk
RUN apk add --no-cache redis supervisor

WORKDIR /app

# ---- Copy built oracle-sim artifacts ----
RUN corepack enable pnpm
COPY package.json pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/oracle-sim/package.json ./packages/oracle-sim/
COPY --from=builder /app/packages/oracle-sim/dist ./packages/oracle-sim/dist

# ---- supervisord configuration ----
COPY infra/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# ---- Create non-root user for Choreo security compliance ----
# CKV_DOCKER_3: non-root user required
# CKV_CHOREO_1: UID must be between 10000 and 20000
RUN addgroup -g 10014 -S app \
    && adduser -S -u 10014 -G app app \
    && mkdir -p /data /run/supervisor \
    && chown -R app:app /app /data /run/supervisor \
    && chmod -R 755 /app /data /run/supervisor

# oracle-sim HTTP port (Choreo will route external traffic here)
EXPOSE 8787
# Redis is internal only; not exposed externally
EXPOSE 6379

ENV NODE_ENV=production

# Switch to non-root user before running supervisord
USER 10014

# supervisord runs as PID 1 and manages both child processes
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
