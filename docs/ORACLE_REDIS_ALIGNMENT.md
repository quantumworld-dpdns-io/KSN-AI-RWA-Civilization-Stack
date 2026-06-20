# Oracle + Redis README Alignment

## Scope

This plan aligns `infra/oracle-redis.Dockerfile` with the non-SQL Oracle and simulation claims in the repository README. The image is responsible for the Oracle/verification runtime and Redis-backed transient persistence. It does not embed:

- SQL or permanent business-record storage (provided externally by AlwaysData).
- The Next.js dashboard (built from `apps/web`).
- Blockchain execution (the Solidity contracts remain independently deployable settlement components).
- Physical IoT collectors; their readings are simulated by this prototype.

## Implemented plan

| Requirement derived from README | Implementation | Verification |
|---|---|---|
| Energy output | `asset.powerWatts` | API integration test |
| Compute throughput | `asset.hashrate` | API integration test |
| Machine utilization | `asset.utilization` | API integration test |
| Maintenance cost | `signals.maintenanceCostRate` and yield reserve | Unit and API tests |
| Carbon intensity | `signals.carbonIntensityKgCo2ePerKwh` | Unit and API tests |
| Geopolitical/legal risk | Dedicated normalized signal fields plus compliance and region | Unit and API tests |
| Kardashev and KSN calculations | `ksn` snapshot from `@aks/core` | Core and API tests |
| Human/AI/reserve/insurance/dividend yield | `yieldDistribution` from `@aks/core` | Core and API tests |
| AI agency ladder | Stage, description, next stage, autonomy risk, and simulated operating policy | API tests |
| AI policy and kill-switch constraint | Non-executing policy simulation, human approval boundary, price ceiling, kill-switch availability | API tests |
| Oracle integrity | Canonical payload SHA-256 plus HMAC-SHA256 signature and tamper check | Tampering test |
| Redis is functional, not decorative | TTL current cache, asset index, bounded sorted-set history | Live container test |
| Service operability | Liveness, dependency health, readiness, capabilities, graceful shutdown | Live container test |
| Single-container security | Non-root UID 10014, loopback-only protected Redis, password, no published Redis port | Image/runtime inspection |

## Runtime contract

Production requires `REDIS_PASSWORD` and `ORACLE_SIGNING_SECRET`. `/ready` returns success only when Redis is reachable. Telemetry remains available in degraded mode during a transient Redis outage, but history correctly returns HTTP 503 because persistence cannot be guaranteed.

Redis current-snapshot TTL and history length are controlled by `TELEMETRY_CACHE_TTL_SECONDS` and `TELEMETRY_HISTORY_LIMIT`. A durable volume must be mounted at `/data` when audit history must survive container replacement.
