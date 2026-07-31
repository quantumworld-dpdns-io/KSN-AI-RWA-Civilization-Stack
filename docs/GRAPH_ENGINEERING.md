# Graph Engineering in the KSN-RWA Stack

This project is designed through **graph engineering** — steering the *topology* the
AI agent works through, not just its prompts. It has two halves, following
`~/Desktop/graph-engineering-ref`.

## 1. Knowledge graph — what the system remembers

The domain schema lives in [`ontology.yaml`](./ontology.yaml): 5 entities, 4 first-class
event types, 12 typed relations, each fact carrying provenance (time, source, payload
hash, signature, confidence). It exists to make the README's core promise — *"oracle data
is the highest-trust bottleneck; every answer must be traceable"* — mechanical rather than
aspirational.

**Why it was needed.** Telemetry currently lives in four disjoint shapes and the signed
provenance the oracle produces (HMAC) is discarded at lakehouse ingestion; agent decisions
go only to `console.log`. The ontology unifies those shapes onto one `TelemetryReading`
and adds the load-bearing edges `JUSTIFIED_BY` (decision → the reading that justified it)
and `EXECUTED_AS` (decision → on-chain digest), so any transaction can be walked back to
the signed evidence behind it.

**Phased rollout** (phase 0 — the schema — is delivered here):
0. Schema + canonical asset registry (fusion of the four id namespaces). ← this file + ontology.yaml
1. `nodes`/`edges` tables beside the existing DuckDB lakehouse (<50K nodes, no new infra).
2. Agent write-back: persist `AgentDecision` + `OnChainTx` nodes each cycle.
3. Serve: GraphRAG context for `llm.ts`; `/trace/:digest` provenance endpoint.
4. Multi-source fusion: `CORROBORATES`/`CONTRADICTS` edges → structural oracle confidence.

## 2. Task graph — how the agent works

The agent's decision loop (`packages/agent/src/runner.ts`) was a single sequential loop
with critical safety gaps. It has been restructured toward the **diamond pattern**:

```
        ┌─ read chain state ──────────────┐
plan ───┤                                 ├─→ VERIFY ─→ MERGE ─→ [HUMAN GATE] ─→ execute ─→ (KG write-back)
        └─ fetch + verify telemetry ──────┘
```

Concretely, what changed and where:

| Principle | Implementation |
|---|---|
| **Delete the fake edge** | State read ∥ telemetry fetch now run in `Promise.all` — neither reads the other's result. (`runner.ts`) |
| **Verify in a separate context** | `fetchTelemetry` verifies the oracle HMAC signature + freshness and returns `{trusted}`. Untrusted → the cycle fails closed to `noop`; the old silent hardcoded-fallback path is deleted. (`sui-client.ts`, `runner.ts`) |
| **Model fills jobs, not the plan** | The LLM can no longer choose spend amounts — `filterAllowedAction` clamps `dividendAmountMist`/`depositAmountMist` to operator config. (`policy.ts`) |
| **The human gate on irreversible edges** | `execute_buyout` (ownership transfer) and `distribute_planetary_dividend` now require the human-held `AdminCap` on-chain; the agent holds these decisions pending approval unless armed with an AdminCap id. (`microgrid.move`, `runner.ts`) |
| **Guardrails / loop caps** | Real on-chain `paused` kill-switch (`assert!(!paused)` in every entry fn); `runContinuous` has max-cycles, per-run spend cap, and stops on repeated errors instead of swallowing them. Cumulative-bps cap + per-round claim guard on the dividend path. |

**Stop rule.** The decision itself stays with one agent (it is sequential — each step needs
the full picture). Only the genuinely independent frontier — state read and the N telemetry
fetches — is split. More agents was not the goal; the shape of the work decided.

This same discipline produced the audit that drove these changes: parallel finder agents
(security, contracts, backend, graph-gaps) + a tester, then a separate adversarial reviewer
context, then one owned merge — the diamond, applied to the review itself.
