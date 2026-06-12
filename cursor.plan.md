# Cursor Implementation Plan — Autonomous Kardashev RWA Stack

## Objective

Turn this scaffold into a usable concept demo for KSN-AI RWA: a dashboard, simulation engine, oracle mock, and contract skeleton.

## Phase 1 — Stabilize local demo

- [ ] Run `pnpm install`.
- [ ] Run `pnpm build`.
- [ ] Fix TypeScript or dependency errors.
- [ ] Start dashboard with `pnpm --filter @aks/web dev`.
- [ ] Start oracle with `pnpm --filter @aks/oracle-sim dev`.

## Phase 2 — Improve simulator

- [ ] Add slider controls for power output, hashrate, utilization, maintenance, and risk.
- [ ] Add scenario presets: Type 0.7, Type 1.0, Type 2.0.
- [ ] Add AI ownership percentage and buyback threshold.
- [ ] Add chart for yield redistribution over time.

## Phase 3 — Oracle hardening model

- [ ] Add mock signed telemetry.
- [ ] Add multiple oracle sources.
- [ ] Add medianized feed.
- [ ] Add confidence score and dispute delay.
- [ ] Add telemetry replay attack test cases.

## Phase 4 — Smart contract tests

- [ ] Add Hardhat tests for `KSNOracleAdapter`.
- [ ] Add policy invariant tests for `ComputeEnergyRWA`.
- [ ] Add treasury timelock tests for `AIAgentTreasury`.
- [ ] Add pause / guardian safety tests.

## Phase 5 — Whitepaper polish

- [ ] Separate speculative claims from implementable MVP.
- [ ] Add legal disclaimer for RWA securities risk.
- [ ] Add DePIN/RWA/oracle risk taxonomy.
- [ ] Add architecture diagrams into README.

## Agent constraints

- Do not implement real investor onboarding.
- Do not claim tokens represent legal ownership unless a legal wrapper is defined.
- Do not allow an LLM to directly execute treasury calls.
- Keep all AI treasury actions behind a deterministic policy layer and guardian approval.
