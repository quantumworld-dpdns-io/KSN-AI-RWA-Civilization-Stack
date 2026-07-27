# Priority Plan

This list re-orders the project around the README's actual near-term thesis:
build a believable prototype loop for energy + compute telemetry, oracle verification, settlement, and a dashboard.

## P0 - Must do now

1. Define the MVP boundary in one sentence and freeze it.
   - Recommended scope: one asset class, one oracle path, one contract path, one dashboard path.

2. Make the docs and code names match.
   - Remove or clearly mark gaps where docs mention `packages/oracle`, `packages/agents`, or large quantum features that do not yet exist in the repo.

3. Stabilize the end-to-end flow.
   - Physical asset sample -> telemetry -> oracle sim -> core snapshot -> contract skeleton -> dashboard.

4. Harden the core simulation package.
   - Cover zero, negative, overflow, and edge-case inputs.
   - Add property-based tests for `computeKsnScore`, `estimateKardashevType`, and yield allocation.

5. Make oracle trust explicit.
   - Add confidence scoring, validation, and a clear failure mode when telemetry is missing or suspicious.

6. Tighten contract invariants.
   - Total yield splits must never exceed the cap.
   - Admin-only actions must be test-covered.
   - Pause behavior must be enforced and verified.

7. Add a reproducible local setup.
   - `pnpm install`
   - `pnpm test`
   - `pnpm dev`
   - `docker compose -f infra/docker-compose.yml up --build`

## P1 - Next

1. Replace the mock oracle with a multi-source oracle design.
   - Keep the first implementation simple: signed telemetry, freshness checks, and a dispute window.

2. Make the dashboard truly data-driven.
   - Show live asset telemetry, KSN score changes, yield splits, and risk signals from the oracle sim.

3. Add contract testing depth.
   - Coverage for minting, yield policy updates, pause/unpause, and oracle reporting.

4. Add observability that helps debugging.
   - Structured logs, request correlation, and basic metrics before any fancy monitoring stack.

5. Introduce release hygiene.
   - CI lint/test/typecheck/build should pass before expanding scope.

6. Document the MVP data model.
   - Asset, telemetry, snapshot, yield distribution, and agency stage should be described once and reused everywhere.

## P2 - Later

1. Expand to additional asset types only after the first asset loop is stable.
2. Add stronger oracle verification such as attestation, medianization, and dispute handling.
3. Build the governance layer after treasury and policy boundaries are proven in tests.
4. Add security automation, fuzzing, and formal analysis for contracts once the contract surface stops changing daily.
5. Add production deployment hardening only after the prototype is stable.

## P3 - Research / Stretch

1. Quantum integration.
2. Federated learning.
3. Agentic commerce.
4. Regional cloud deployment matrices.
5. Autonomous sovereign-asset behavior.

## Recommended Execution Order

1. Core simulation and tests.
2. Oracle sim and telemetry validation.
3. Contract invariants and contract tests.
4. Web dashboard wiring.
5. CI/CD and release hygiene.
6. Security hardening.
7. Governance and AI agency expansion.
8. Research tracks such as quantum.

