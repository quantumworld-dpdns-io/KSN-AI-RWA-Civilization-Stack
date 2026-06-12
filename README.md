# Autonomous Kardashev RWA Stack

**Tokenizing energy, compute, and machine-owned infrastructure across Kardashev-scale civilization.**

This repository is a concept-to-prototype scaffold for merging two narratives:

1. **Kardashev / KSN RWA path** — real-world assets evolve from buildings and debt into energy, compute, microgrids, orbital solar, and stellar-scale infrastructure.
2. **12 Scenes of AI path** — AI evolves from a tool that optimizes RWA portfolios into an autonomous economic actor that issues, owns, governs, and eventually abstracts infrastructure into planetary dividends.

The core metric used in this prototype is:

```math
S(t) = \frac{P(t)}{H(t)}
```

Where:

- `P(t)` = energy output in watts.
- `H(t)` = network hashrate or compute throughput proxy.
- `S(t)` = joules per hash / energy-per-compute efficiency signal.

> This is a speculative research prototype. It is not legal, financial, or investment advice.

---

## Repository layout

```txt
.
├── apps/
│   └── web/                    # React/Vite dashboard and civilization simulator
├── packages/
│   ├── core/                   # Shared TypeScript simulation engine
│   ├── oracle-sim/             # Mock oracle API for energy, hashrate, and asset telemetry
│   └── contracts/              # Solidity contract skeletons for Compute/Energy RWA
├── docs/
│   ├── ARCHITECTURE.md
│   ├── WHITEPAPER.md
│   ├── SCENES.md
│   ├── THREAT_MODEL.md
│   └── diagrams/
├── infra/
│   └── docker-compose.yml
├── scripts/
└── .github/workflows/ci.yml
```

---

## What this prototype demonstrates

### 1. KSN-RWA asset ladder

| Stage | Physical substrate | RWA token representation |
|---|---|---|
| Type 0.7 | Microgrids, GPU clusters, DePIN nodes | Compute credits, energy yield rights |
| Type 1.0 | Planetary grid, geothermal, tidal, fusion, datacenter mesh | Planetary infrastructure DAO shares |
| Type 2.0 | Orbital solar, asteroid mining, Dyson Swarm DePIN | Stellar capture rights and compute-energy dividends |

### 2. AI agency ladder

| Scene | Actor form | RWA behavior |
|---|---|---|
| Scene 3 | Oracle-driven AI agent | Optimizes asset utilization and dynamic pricing |
| Scene 7 | Algorithmic legal entity | Issues RWA to expand its physical compute base |
| Scene 10 | Sovereign asset | Buys out human owners and owns infrastructure directly |
| Scene 12 | Kardashev convergence | Packages planetary/stellar infrastructure into universal dividends |

---

## Quick start

Requires Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev
```

Run only the web simulator:

```bash
pnpm --filter @aks/web dev
```

Run only the mock oracle service:

```bash
pnpm --filter @aks/oracle-sim dev
```

Run with Docker Compose:

```bash
docker compose -f infra/docker-compose.yml up --build
```

---

## Core modules

### `@aks/core`

The simulation engine. It models:

- Kardashev type approximation from energy output.
- KSN score `S = P / H`.
- RWA asset classes.
- AI autonomy stage.
- Yield distribution between humans, AI treasury, maintenance reserve, insurance pool, and planetary dividend pool.

### `@aks/oracle-sim`

A mock oracle service returning simulated telemetry:

- Energy output.
- Hashrate / compute throughput.
- Utilization.
- Maintenance cost.
- Carbon intensity.
- Geopolitical/legal risk signal.

### `packages/contracts`

Solidity skeletons for:

- `ComputeEnergyRWA.sol` — tokenized compute-energy asset.
- `KSNOracleAdapter.sol` — oracle adapter interface.
- `AIAgentTreasury.sol` — autonomous treasury policy shell.

---

## Conceptual stack

```txt
[5] Civilization Dividend Layer
    Planetary Basic Income / Compute Credits / Energy Dividends

[4] Autonomous Governance Layer
    AI Agents / DAO LLC / Algorithmic Legal Entities / Treasury AI

[3] Settlement & Rights Layer
    Smart Contracts / RWA Tokens / ERC-6551-style Agent Accounts

[2] Oracle & Verification Layer
    Energy Metering / Hashrate Proof / Satellite Data / IoT Sensors

[1] Physical Infrastructure Layer
    GPU Clusters / Microgrids / Nuclear / Solar / Orbital Arrays / Mining Drones
```

---

## Security and realism notes

The prototype intentionally separates speculative narrative from implementation constraints:

- Real-world asset ownership requires enforceable off-chain legal structure.
- Oracle data is the highest-trust bottleneck.
- Energy telemetry, hashrate proof, and machine utilization can be spoofed.
- Tokenized cash flow may be regulated as securities.
- AI autonomy must be constrained by policy, liability, and kill-switch mechanisms.

See [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md).

---

## License

MIT for code. Narrative and documentation may be adapted with attribution.
