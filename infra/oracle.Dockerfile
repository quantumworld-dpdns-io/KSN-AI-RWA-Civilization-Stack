# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
ENV CI=true
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @aks/oracle-sim... build
RUN node infra/scripts/fix-esm-extensions.mjs \
    packages/core/dist \
    packages/oracle-sim/dist

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/oracle-sim/package.json packages/oracle-sim/
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/oracle-sim/dist ./packages/oracle-sim/dist

ENV CI=true NODE_ENV=production
# Install prod deps, then remove the corepack-managed pnpm store. That store
# bundles a vulnerable tar (CVE-2026-59873) and is unneeded at runtime (the
# CMD only runs `node`), so removing it clears the Trivy critical.
RUN pnpm install --prod --filter @aks/oracle-sim --frozen-lockfile=false --ignore-scripts \
    && corepack disable >/dev/null 2>&1 || true \
    && rm -rf /root/.local/share/pnpm /root/.cache /root/.npm /usr/local/bin/pnpm /usr/local/bin/pnpx

RUN addgroup -g 10014 -S app \
    && adduser -S -u 10014 -G app app \
    && chown -R app:app /app

EXPOSE 8787
USER 10014
CMD ["node", "packages/oracle-sim/dist/server.js"]
