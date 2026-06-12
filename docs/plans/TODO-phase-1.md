# Phase 1: Foundation & Infrastructure Stabilization

**Duration: Months 1–3 | Todos: 110 | Commit prefix: `ci`, `chore`, `fix`**

---

## 1.1 Dependency & Build System (Todos 1–20)

- [ ] TODO-001: Fix pnpm lockfile and run `pnpm install` successfully
- [ ] TODO-002: Update all dependencies to latest stable versions in root package.json
- [ ] TODO-003: Update `@aks/web` dependencies (React 19, Vite 6, TypeScript 5.7)
- [ ] TODO-004: Update `@aks/core` dependencies to latest TypeScript
- [ ] TODO-005: Update `@aks/oracle-sim` dependencies (Fastify 5, Zod 3)
- [ ] TODO-006: Update `@aks/contracts` dependencies (Hardhat, OpenZeppelin 5)
- [ ] TODO-007: Add `@biomejs/biome` as monorepo-wide linter/formatter
- [ ] TODO-008: Configure biome.json with project-specific rules
- [ ] TODO-009: Add `turbo.json` for Turborepo task orchestration
- [ ] TODO-010: Configure Turborepo pipeline for build, test, lint
- [ ] TODO-011: Add root-level `tsconfig.base.json` for shared TypeScript config
- [ ] TODO-012: Extend base tsconfig in each package
- [ ] TODO-013: Add `.npmrc` with `strict-peer-dependencies=false`
- [ ] TODO-014: Add `engines` field requiring Node.js 20+ across all packages
- [ ] TODO-015: Create `pnpm-lock.yaml` and commit it
- [ ] TODO-016: Add `preinstall` script to enforce pnpm
- [ ] TODO-017: Add `postinstall` script for git hooks via husky
- [ ] TODO-018: Install and configure `husky` for pre-commit hooks
- [ ] TODO-019: Install and configure `lint-staged` for incremental linting
- [ ] TODO-020: Add root-level `check` script combining lint, typecheck, test

## 1.2 Project Structure & Monorepo (Todos 21–40)

- [ ] TODO-021: Create `packages/shared/` package for cross-package utilities
- [ ] TODO-022: Create `packages/shared/package.json` with workspace config
- [ ] TODO-023: Create `packages/shared/src/index.ts` barrel export
- [ ] TODO-024: Create `packages/shared/tsconfig.json`
- [ ] TODO-025: Create `packages/config/` package for shared configs (eslint, tsconfig, etc.)
- [ ] TODO-026: Create `packages/config/package.json`
- [ ] TODO-027: Move linting configs to `packages/config/`
- [ ] TODO-028: Create `packages/testing/` package for shared test utilities
- [ ] TODO-029: Create `packages/testing/package.json`
- [ ] TODO-030: Create `packages/testing/src/fixtures.ts` shared test fixtures
- [ ] TODO-031: Create `packages/testing/src/helpers.ts` test helper functions
- [ ] TODO-032: Add `packages/testing/tsconfig.json`
- [ ] TODO-033: Update `pnpm-workspace.yaml` to include new packages
- [ ] TODO-034: Create `packages/quantum/` package stub for Phase 3
- [ ] TODO-035: Create `packages/quantum/package.json` with CUDA-Q and Qiskit deps
- [ ] TODO-036: Create `packages/quantum/tsconfig.json`
- [ ] TODO-037: Create `packages/quantum/src/index.ts` placeholder
- [ ] TODO-038: Create `packages/security/` package for OWASP test suites
- [ ] TODO-039: Create `packages/security/package.json` with Robot Framework deps
- [ ] TODO-040: Create `packages/security/src/index.ts` placeholder

## 1.3 Redis Integration (Todos 41–55)

- [ ] TODO-041: Add `ioredis` dependency to root
- [ ] TODO-042: Create `packages/shared/src/redis/client.ts` Redis client factory
- [ ] TODO-043: Add Redis connection pooling configuration
- [ ] TODO-044: Create `packages/shared/src/redis/cache.ts` generic cache wrapper
- [ ] TODO-045: Add TTL-based cache invalidation
- [ ] TODO-046: Create `packages/shared/src/redis/pubsub.ts` Redis pub/sub wrapper
- [ ] TODO-047: Add Redis health check endpoint to oracle-sim
- [ ] TODO-048: Create `packages/shared/src/redis/telemetry-store.ts` for oracle data
- [ ] TODO-049: Add sorted set support for time-series telemetry
- [ ] TODO-050: Add JSON module support for complex telemetry objects
- [ ] TODO-051: Create Redis Docker service in docker-compose.yml
- [ ] TODO-052: Configure Redis persistence (RDB + AOF)
- [ ] TODO-053: Add Redis password authentication
- [ ] TODO-054: Create `packages/shared/src/redis/__tests__/client.test.ts`
- [ ] TODO-055: Create `packages/shared/src/redis/__tests__/cache.test.ts`

## 1.4 Docker & Infrastructure (Todos 56–75)

- [ ] TODO-056: Update `infra/oracle.Dockerfile` to multi-stage build
- [ ] TODO-057: Update `infra/web.Dockerfile` to multi-stage build
- [ ] TODO-058: Create `infra/redis.Dockerfile` for custom Redis config
- [ ] TODO-059: Create `infra/postgres.Dockerfile` for telemetry storage
- [ ] TODO-060: Update `docker-compose.yml` with Redis service
- [ ] TODO-061: Update `docker-compose.yml` with PostgreSQL service
- [ ] TODO-062: Add health checks for all services
- [ ] TODO-063: Add volumes for persistent data
- [ ] TODO-064: Create `.env.example` with all environment variables
- [ ] TODO-065: Create `.env` template with safe defaults
- [ ] TODO-066: Add `docker-compose.dev.yml` override for development
- [ ] TODO-067: Add `docker-compose.prod.yml` override for production
- [ ] TODO-068: Create `Makefile` for common Docker operations
- [ ] TODO-069: Add `make dev` to start all services
- [ ] TODO-070: Add `make test` to run all tests
- [ ] TODO-071: Add `make build` to build all packages
- [ ] TODO-072: Add `make clean` to remove build artifacts
- [ ] TODO-073: Create `infra/nginx/nginx.conf` reverse proxy config
- [ ] TODO-074: Create `infra/nginx/Dockerfile`
- [ ] TODO-075: Add nginx to docker-compose as gateway

## 1.5 Developer Experience (Todos 76–95)

- [ ] TODO-076: Create `.vscode/settings.json` with project settings
- [ ] TODO-077: Create `.vscode/extensions.json` with recommended extensions
- [ ] TODO-078: Create `.vscode/launch.json` for debug configurations
- [ ] TODO-079: Create `.vscode/tasks.json` for build tasks
- [ ] TODO-080: Add `dev` script that starts oracle + web + redis
- [ ] TODO-081: Add `dev:oracle` script for oracle only
- [ ] TODO-082: Add `dev:web` script for web only
- [ ] TODO-083: Add `dev:contracts` script for Hardhat node
- [ ] TODO-084: Create `scripts/setup.sh` one-command project setup
- [ ] TODO-085: Create `scripts/seed-telemetry.ts` to populate test data
- [ ] TODO-086: Create `scripts/generate-report.ts` enhanced with charts
- [ ] TODO-087: Add `scripts/clean.sh` to remove node_modules and dist
- [ ] TODO-088: Add `scripts/typecheck.sh` for full type checking
- [ ] TODO-089: Create `.editorconfig` for consistent formatting
- [ ] TODO-090: Create `.gitattributes` for line ending normalization
- [ ] TODO-091: Update `.gitignore` with comprehensive ignore rules
- [ ] TODO-092: Add `CONTRIBUTING.md` with development guidelines
- [ ] TODO-093: Add `CHANGELOG.md` with initial entry
- [ ] TODO-094: Create `SECURITY.md` with security policy
- [ ] TODO-095: Create `CODE_OF_CONDUCT.md`

## 1.6 Environment & Secrets Management (Todos 96–110)

- [ ] TODO-096: Create `.env.local` example with all local vars
- [ ] TODO-097: Create `packages/shared/src/config/env.ts` env validation with Zod
- [ ] TODO-098: Add `ORACLE_PORT`, `REDIS_URL`, `DATABASE_URL` validation
- [ ] TODO-099: Add `JWT_SECRET`, `API_KEY` validation
- [ ] TODO-100: Create `packages/shared/src/config/constants.ts` app constants
- [ ] TODO-101: Add `packages/shared/src/config/index.ts` barrel export
- [ ] TODO-102: Create `scripts/check-env.ts` env validation script
- [ ] TODO-103: Add env check to pre-commit hook
- [ ] TODO-104: Create `infra/.env.docker` for Docker environment
- [ ] TODO-105: Create `infra/.env.docker.example` template
- [ ] TODO-106: Add secret scanning with `gitleaks` config
- [ ] TODO-107: Create `.gitleaks.toml` configuration
- [ ] TODO-108: Add `npm-audit` check to pre-commit
- [ ] TODO-109: Create `scripts/security-scan.sh` basic security scan
- [ ] TODO-110: Add `audit` script to root package.json

---

**Phase 1 Total: 110 todos**
