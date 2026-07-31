# ============================================================
# Stage 1: Build oracle-sim (pnpm monorepo)
# ============================================================
FROM node:24-bookworm-slim AS builder
WORKDIR /app
RUN npm install -g npm@11.18.0 pnpm@10.34.5 \
    && npm cache clean --force
ENV CI=true
COPY . .
RUN pnpm install --filter @aks/oracle-sim... --frozen-lockfile=false
RUN pnpm --filter @aks/oracle-sim... build
RUN node infra/scripts/fix-esm-extensions.mjs \
    packages/core/dist \
    packages/oracle-sim/dist

# ============================================================
# Stage 2: Runtime — oracle-sim only
# Choreo builds were failing while installing OS packages, so
# production defaults to the in-memory store and runs a single
# Node.js process without Redis or supervisord.
# ============================================================
FROM node:24-bookworm-slim AS runner

WORKDIR /app
RUN npm install -g npm@11.18.0 pnpm@10.34.5 \
    && npm cache clean --force

# Copy only workspace manifests needed for a production install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/oracle-sim/package.json packages/oracle-sim/
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/oracle-sim/dist ./packages/oracle-sim/dist

# Install runtime deps only (excludes vitest, esbuild, protobufjs, etc.)
ENV CI=true NODE_ENV=production
# After installing, remove the global pnpm (its bundled tar is flagged by
# scanners and is not needed at runtime — the CMD only runs `node`).
RUN pnpm install --prod --filter @aks/oracle-sim --frozen-lockfile=false --ignore-scripts \
    && npm uninstall -g pnpm >/dev/null 2>&1 || true \
    && npm cache clean --force >/dev/null 2>&1 || true \
    && rm -rf /root/.local/share/pnpm /root/.cache /root/.npm

# ---- Create non-root user for Choreo security compliance ----
# CKV_DOCKER_3: non-root user required
# CKV_CHOREO_1: UID must be between 10000 and 20000
RUN groupadd --gid 10014 app \
    && useradd --uid 10014 --gid app --create-home --shell /usr/sbin/nologin app \
    && mkdir -p /data /run/supervisor \
    && chown -R app:app /app /data /run/supervisor \
    && chmod -R 755 /app /data /run/supervisor

# oracle-sim HTTP port (Choreo will route external traffic here)
EXPOSE 8787

# Readiness verifies the HTTP service. Persistence is in-memory in this image.
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8787/ready || exit 1

STOPSIGNAL SIGTERM

# Switch to non-root user before running supervisord
USER 10014

ENV ORACLE_STORE=memory

CMD ["node", "/app/packages/oracle-sim/dist/server.js"]
