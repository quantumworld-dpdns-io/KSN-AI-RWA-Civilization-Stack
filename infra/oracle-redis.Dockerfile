# ============================================================
# Stage 1: Build oracle-sim (pnpm monorepo)
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
ENV CI=true
COPY . .
RUN pnpm install --filter @aks/oracle-sim... --frozen-lockfile=false
RUN pnpm --filter @aks/oracle-sim... build
RUN node infra/scripts/fix-esm-extensions.mjs \
    packages/core/dist \
    packages/oracle-sim/dist

# ============================================================
# Stage 2: Combined runtime — Redis + oracle-sim
# Uses supervisord to manage both processes in one container,
# required for single-container platforms like Choreo.
# ============================================================
FROM node:20-alpine AS runner

# Install Redis and supervisord from Alpine apk
RUN apk add --no-cache redis supervisor

WORKDIR /app
RUN corepack enable pnpm

# Copy only workspace manifests needed for a production install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/oracle-sim/package.json packages/oracle-sim/
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/oracle-sim/dist ./packages/oracle-sim/dist

# Install runtime deps only (excludes vitest, esbuild, protobufjs, etc.)
ENV CI=true NODE_ENV=production
RUN pnpm install --prod --filter @aks/oracle-sim --frozen-lockfile=false --ignore-scripts

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

# Redis persistence. Mount durable storage at /data in production.
VOLUME ["/data"]

# Readiness requires both the HTTP service and its Redis persistence layer.
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8787/ready || exit 1

STOPSIGNAL SIGTERM

# Switch to non-root user before running supervisord
USER 10014

# supervisord runs as PID 1 and manages both child processes
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
