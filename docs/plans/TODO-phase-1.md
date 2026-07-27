# Phase 1: Foundation & Infrastructure Stabilization

**Duration: Months 1–3 | Todos: 110 | Commit prefix: `ci`, `chore`, `fix`**

---

## 1.1 Dependency & Build System (Todos 1–20)

- [x] TODO-001: Fix pnpm lockfile and run `pnpm install` successfully
- [x] TODO-002: Update all dependencies to latest stable versions in root package.json
- [x] TODO-003: Update `@aks/web` dependencies (React 19, Vite 6, TypeScript 5.7)
- [x] TODO-004: Update `@aks/core` dependencies to latest TypeScript
- [x] TODO-005: Update `@aks/oracle-sim` dependencies (Fastify 5, Zod 3)
- [x] TODO-006: Update `@aks/contracts` dependencies (Hardhat, OpenZeppelin 5)
- [x] TODO-007: Add `@biomejs/biome` as monorepo-wide linter/formatter
- [x] TODO-008: Configure biome.json with project-specific rules
- [x] TODO-009: Add `turbo.json` for Turborepo task orchestration
- [x] TODO-010: Configure Turborepo pipeline for build, test, lint
- [x] TODO-011: Add root-level `tsconfig.base.json` for shared TypeScript config
- [x] TODO-012: Extend base tsconfig in each package
- [x] TODO-013: Add `.npmrc` with `strict-peer-dependencies=false`
- [x] TODO-014: Add `engines` field requiring Node.js 20+ across all packages
- [x] TODO-015: Create `pnpm-lock.yaml` and commit it
- [x] TODO-016: Add `preinstall` script to enforce pnpm
- [x] TODO-017: Add `postinstall` script for git hooks via husky
- [x] TODO-018: Install and configure `husky` for pre-commit hooks
- [x] TODO-019: Install and configure `lint-staged` for incremental linting
- [x] TODO-020: Add root-level `check` script combining lint, typecheck, test

## 1.2 Project Structure & Monorepo (Todos 21–40)

- [x] TODO-021: Create `packages/shared/` package for cross-package utilities
- [x] TODO-022: Create `packages/shared/package.json` with workspace config
- [x] TODO-023: Create `packages/shared/src/index.ts` barrel export
- [x] TODO-024: Create `packages/shared/tsconfig.json`
- [x] TODO-025: Create `packages/config/` package for shared configs (eslint, tsconfig, etc.)
- [x] TODO-026: Create `packages/config/package.json`
- [x] TODO-027: Move linting configs to `packages/config/`
- [x] TODO-028: Create `packages/testing/` package for shared test utilities
- [x] TODO-029: Create `packages/testing/package.json`
- [x] TODO-030: Create `packages/testing/src/fixtures.ts` shared test fixtures
- [x] TODO-031: Create `packages/testing/src/helpers.ts` test helper functions
- [x] TODO-032: Add `packages/testing/tsconfig.json`
- [x] TODO-033: Update `pnpm-workspace.yaml` to include new packages
- [x] TODO-034: Create `packages/quantum/` package stub for Phase 3
- [x] TODO-035: Create `packages/quantum/package.json` with CUDA-Q and Qiskit deps
- [x] TODO-036: Create `packages/quantum/tsconfig.json`
- [x] TODO-037: Create `packages/quantum/src/index.ts` placeholder
- [x] TODO-038: Create `packages/security/` package for OWASP test suites
- [x] TODO-039: Create `packages/security/package.json` with Robot Framework deps
- [x] TODO-040: Create `packages/security/src/index.ts` placeholder

## 1.3 Redis Integration (Todos 41–55)

- [x] TODO-041: Add `ioredis` dependency to root
- [x] TODO-042: Create `packages/shared/src/redis/client.ts` Redis client factory
- [x] TODO-043: Add Redis connection pooling configuration
- [x] TODO-044: Create `packages/shared/src/redis/cache.ts` generic cache wrapper
- [x] TODO-045: Add TTL-based cache invalidation
- [x] TODO-046: Create `packages/shared/src/redis/pubsub.ts` Redis pub/sub wrapper
- [x] TODO-047: Add Redis health check endpoint to oracle-sim
- [x] [x] TODO-048: Create `packages/shared/src/redis/telemetry-store.ts` for oracle data
- [x] TODO-049: Add sorted set support for time-series telemetry
- [x] TODO-050: Add JSON module support for complex telemetry objects
- [x] TODO-051: Create Redis Docker service in docker-compose.yml
- [x] TODO-052: Configure Redis persistence (RDB + AOF)
- [x] TODO-053: Add Redis password authentication
- [x] TODO-054: Create `packages/shared/src/redis/__tests__/client.test.ts`
- [x] TODO-055: Create `packages/shared/src/redis/__tests__/cache.test.ts`

## 1.4 Docker & Infrastructure (Todos 56–75)

- [x] TODO-056: Update `infra/oracle.Dockerfile` to multi-stage build
- [x] TODO-057: Update `infra/web.Dockerfile` to multi-stage build
- [x] TODO-058: Create `infra/redis.Dockerfile` for custom Redis config
- [x] TODO-059: Create `infra/postgres.Dockerfile` for telemetry storage
- [x] TODO-060: Update `docker-compose.yml` with Redis service
- [x] TODO-061: Update `docker-compose.yml` with PostgreSQL service
- [x] TODO-062: Add health checks for all services
- [x] TODO-063: Add volumes for persistent data
- [x] TODO-064: Create `.env.example` with all environment variables
- [x] TODO-065: Create `.env` template with safe defaults
- [x] TODO-066: Add `docker-compose.dev.yml` override for development
- [x] TODO-067: Add `docker-compose.prod.yml` override for production
- [x] TODO-068: Create `Makefile` for common Docker operations
- [x] TODO-069: Add `make dev` to start all services
- [x] TODO-070: Add `make test` to run all tests
- [x] TODO-071: Add `make build` to build all packages
- [x] TODO-072: Add `make clean` to remove build artifacts
- [x] TODO-073: Create `infra/nginx/nginx.conf` reverse proxy config
- [x] TODO-074: Create `infra/nginx/Dockerfile`
- [x] TODO-075: Add nginx to docker-compose as gateway

## 1.5 Developer Experience (Todos 76–95)

- [x] TODO-076: Create `.vscode/settings.json` with project settings
- [x] TODO-077: Create `.vscode/extensions.json` with recommended extensions
- [x] TODO-078: Create `.vscode/launch.json` for debug configurations
- [x] TODO-079: Create `.vscode/tasks.json` for build tasks
- [x] TODO-080: Add `dev` script that starts oracle + web + redis
- [x] TODO-081: Add `dev:oracle` script for oracle only
- [x] TODO-082: Add `dev:web` script for web only
- [x] TODO-083: Add `dev:contracts` script for Hardhat node
- [x] TODO-084: Create `scripts/setup.sh` one-command project setup
- [x] TODO-085: Create `scripts/seed-telemetry.ts` to populate test data
- [x] TODO-086: Create `scripts/generate-report.ts` enhanced with charts
- [x] TODO-087: Add `scripts/clean.sh` to remove node_modules and dist
- [x] TODO-088: Add `scripts/typecheck.sh` for full type checking
- [x] TODO-089: Create `.editorconfig` for consistent formatting
- [x] TODO-090: Create `.gitattributes` for line ending normalization
- [x] TODO-091: Update `.gitignore` with comprehensive ignore rules
- [x] TODO-092: Add `CONTRIBUTING.md` with development guidelines
- [x] TODO-093: Add `CHANGELOG.md` with initial entry
- [x] TODO-094: Create `SECURITY.md` with security policy
- [x] TODO-095: Create `CODE_OF_CONDUCT.md`

## 1.6 Environment & Secrets Management (Todos 96–110)

- [x] TODO-096: Create `.env.local` example with all local vars
- [x] TODO-097: Create `packages/shared/src/config/env.ts` env validation with Zod
- [x] TODO-098: Add `ORACLE_PORT`, `REDIS_URL`, `DATABASE_URL` validation
- [x] TODO-099: Add `JWT_SECRET`, `API_KEY` validation
- [x] TODO-100: Create `packages/shared/src/config/constants.ts` app constants
- [x] TODO-101: Add `packages/shared/src/config/index.ts` barrel export
- [x] TODO-102: Create `scripts/check-env.ts` env validation script
- [x] TODO-103: Add env check to pre-commit hook
- [x] TODO-104: Create `infra/.env.docker` for Docker environment
- [x] TODO-105: Create `infra/.env.docker.example` template
- [x] TODO-106: Add secret scanning with `gitleaks` config
- [x] TODO-107: Create `.gitleaks.toml` configuration
- [x] TODO-108: Add `npm-audit` check to pre-commit
- [x] TODO-109: Create `scripts/security-scan.sh` basic security scan
- [x] TODO-110: Add `audit` script to root package.json


---

**Phase 1 Total: 110 todos**
