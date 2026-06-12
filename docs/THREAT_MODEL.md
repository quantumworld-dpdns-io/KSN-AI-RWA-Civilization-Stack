# Threat Model

## Scope

This threat model covers the prototype architecture for tokenized energy-compute RWA governed partially or fully by AI agents.

## Assets

| Asset | Description |
|---|---|
| Telemetry data | Energy output, hashrate, utilization, uptime |
| RWA token accounting | Ownership and yield distribution state |
| AI treasury | Funds controlled by policy or agent |
| Physical machines | GPUs, ASICs, energy assets, cooling, storage |
| Legal claims | Off-chain enforceability of tokenized claims |
| Oracle keys | Signing keys used for telemetry updates |

---

## STRIDE analysis

| Category | Example threat | Control |
|---|---|---|
| Spoofing | Fake sensor submits inflated energy data | Device attestation, key rotation, multi-source oracle |
| Tampering | Telemetry modified before chain submission | Signed measurements, append-only logs |
| Repudiation | Operator denies downtime or maintenance failure | Immutable telemetry audit trail |
| Information disclosure | Leaked facility location or grid dependency | Data minimization, delayed public disclosure |
| Denial of service | Oracle endpoint or physical facility disrupted | Redundant feeds, fallback settlement mode |
| Elevation of privilege | AI treasury bypasses spending limits | Timelocks, caps, multisig veto, formal policy checks |

---

## AI-specific risks

| Risk | Description | Mitigation |
|---|---|---|
| Runaway acquisition | AI keeps buying assets to maximize self-expansion | Hard caps, board/multisig approval, budget epochs |
| Collusive pricing | AI agent coordinates compute pricing against users | Antitrust/compliance review, market monitoring |
| Treasury capture | Malicious prompt/tool injection changes treasury policy | Non-LLM policy engine, signed action schemas |
| Oracle manipulation | AI exploits telemetry feed weaknesses | Independent attestations, challenge periods |
| Legal mismatch | Token says ownership, legal wrapper says revenue share | Explicit rights taxonomy, counsel review |
| Kill-switch failure | Emergency shutdown cannot stop agent behavior | Multi-layer kill switch: contract, infra, custody, bank |

---

## Invariants for production contracts

1. Total claim shares must never exceed cap.
2. Yield distribution percentages must sum to 100%.
3. AI treasury allocation must remain under configured cap.
4. Oracle update must be signed by approved oracle role.
5. Emergency pause must stop distribution and treasury actions.
6. Maintenance reserve cannot be drained by AI treasury policy.
7. Buyback cannot force-transfer regulated investor claims without lawful mechanism.

---

## MVP safety posture

For any real deployment:

- Keep AI decision-making advisory at first.
- Use human approval for spending and issuance.
- Treat token holders as securities holders unless counsel says otherwise.
- Use conservative oracle assumptions.
- Do not represent token ownership as physical ownership unless enforceable.
