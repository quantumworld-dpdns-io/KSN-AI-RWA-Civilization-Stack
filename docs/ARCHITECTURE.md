# Architecture

## System overview

```mermaid
flowchart TD
  A[Physical Infrastructure\nGPU / Energy / Microgrid / Orbital Solar] --> B[Telemetry Collectors\nIoT meters / hash proofs / maintenance logs]
  B --> C[Oracle Simulator / Oracle Network]
  C --> D[KSN Oracle Adapter]
  D --> E[ComputeEnergyRWA Contract]
  E --> F[Yield Splitter\nHumans / AI treasury / maintenance / insurance / dividend]
  F --> G[Dashboard]
  F --> H[AI Agent Treasury]
  H --> I[Expansion Policy\nBuy GPUs / Energy / Cooling]
  I --> A
```

---

## Sui agentic architecture (Sui Overflow)

How the Next.js frontend, the AI agent, and the Sui blockchain interact around the
shared `Microgrid` Object (`0xe758…ed67`, package `0xc74c…6703` on testnet):

```mermaid
flowchart LR
  subgraph Browser
    U[User + Sui wallet\nSlush / Suiet] -->|sign stake PTB| MG
    FE[Next.js dashboard\napps/web]
  end
  subgraph Server[Next.js server routes]
    FE -->|/api/chain/sui| GQL[Sui GraphQL client\napps/web/src/lib/sui.ts]
    FE -->|/api/oracle/*| ORA
  end
  subgraph Backend
    ORA[Oracle\nFastify + HMAC signing\npackages/oracle-sim]
    AG[AI Agent\nNode + own Ed25519 keypair\npackages/agent]
  end
  subgraph Sui[Sui testnet]
    MG[(Microgrid — Shared Object\nUID + P·H·S·treasury·paused)]
  end

  GQL -->|read Object fields| MG
  ORA -->|signed telemetry P and H| AG
  AG -->|read Object state| MG
  AG -->|"sign PTB: update_telemetry / deposit / (human-gated) dividend"| MG
```

Key Sui-native properties: the microgrid is a **shared `sui::object::UID`** (object-centric,
not an Ethereum-style mapping); reads use the **GraphQL** interface (public JSON-RPC is
deprecated); both a **user wallet** and the **agent's own keypair** mutate the Object by signing
**Programmable Transaction Blocks**; irreversible edges (buyout, dividend) pass through an
on-chain human gate and a `paused` kill-switch.

---

## Components

### Web dashboard

Located in `apps/web`.

Responsible for:

- Visualizing Kardashev stage.
- Comparing KSN score across asset types.
- Showing ownership transition from human to AI.
- Showing yield allocation.

### Core simulation engine

Located in `packages/core`.

Responsible for deterministic calculations:

- `computeKsnScore`.
- `estimateKardashevType`.
- `classifyAssetStage`.
- `simulateYieldDistribution`.
- `advanceAgencyScene`.

### Oracle simulator

Located in `packages/oracle-sim`.

Provides mock telemetry over HTTP.

The current repo ships `packages/oracle-sim` as the executable oracle path; planned docs may mention a future `packages/oracle` package for multi-source verification and aggregation.

Endpoints:

```txt
GET /health
GET /telemetry/:assetId
POST /simulate
```

### Contracts

Located in `packages/contracts`.

Contract set:

| Contract | Responsibility |
|---|---|
| `ComputeEnergyRWA.sol` | RWA share accounting and distribution events |
| `KSNOracleAdapter.sol` | Ingests energy/compute telemetry |
| `AIAgentTreasury.sol` | Autonomous treasury policy boundary |

---

## Data flow

```txt
Physical asset
  -> telemetry collection
  -> oracle aggregation
  -> KSN score update
  -> smart contract settlement
  -> yield split
  -> dashboard / AI treasury policy
```

---

## Security boundaries

| Boundary | Main risk | Control |
|---|---|---|
| Sensor to oracle | spoofed telemetry | signed measurements, redundancy |
| Oracle to chain | corrupted feed | medianization, delay, dispute window |
| Contract accounting | accounting bug | audits, invariants, tests |
| AI treasury | runaway purchases | caps, timelocks, human veto |
| Physical asset | sabotage/theft | custody, insurance, operational monitoring |
| Legal wrapper | unenforceable token claim | jurisdiction-specific legal design |

---

## Suggested production migration path

1. Replace `oracle-sim` with a real telemetry ingestion service.
2. Use signed hardware measurements or attestation.
3. Add compliance-aware transfer restrictions.
4. Add formal legal wrapper documents.
5. Add risk module for grid safety and securities-law gating.
6. Add simulation backtesting before any autonomous treasury action.
