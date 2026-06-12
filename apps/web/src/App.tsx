import { useMemo, useState } from "react";
import {
  SAMPLE_ASSETS,
  describeAgencyStage,
  estimateAutonomyRisk,
  simulateYieldDistribution,
  snapshotAsset,
  type InfrastructureAsset
} from "@aks/core";

const formatter = new Intl.NumberFormat("en", { maximumFractionDigits: 4 });
const usd = new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export function App() {
  const [selectedId, setSelectedId] = useState(SAMPLE_ASSETS[0].id);
  const selected = SAMPLE_ASSETS.find((asset) => asset.id === selectedId) ?? SAMPLE_ASSETS[0];
  const model = useMemo(() => buildViewModel(selected), [selected]);

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Autonomous Kardashev RWA Stack</p>
          <h1>Energy × Compute × AI Agency</h1>
          <p className="heroText">
            A speculative dashboard for tokenized energy-compute infrastructure, from Type 0.7 DePIN nodes to
            Type 2 stellar-scale assets governed by increasingly autonomous AI agents.
          </p>
        </div>
        <div className="equationCard">
          <span>KSN signal</span>
          <strong>S(t) = P(t) / H(t)</strong>
          <small>energy output divided by network compute throughput</small>
        </div>
      </section>

      <section className="selector">
        {SAMPLE_ASSETS.map((asset) => (
          <button
            key={asset.id}
            className={asset.id === selectedId ? "active" : ""}
            onClick={() => setSelectedId(asset.id)}
          >
            {asset.name}
          </button>
        ))}
      </section>

      <section className="grid">
        <MetricCard title="Power Output" value={`${formatter.format(model.snapshot.powerWatts)} W`} />
        <MetricCard title="Compute / Hashrate Proxy" value={formatter.format(model.snapshot.hashrate)} />
        <MetricCard title="KSN Score" value={`${model.snapshot.ksnScore.toExponential(4)} J/hash`} />
        <MetricCard title="Kardashev Estimate" value={`Type ${model.snapshot.kardashevType.toFixed(3)}`} />
      </section>

      <section className="panel twoCol">
        <div>
          <h2>Asset state</h2>
          <dl className="facts">
            <div><dt>Asset class</dt><dd>{selected.assetClass}</dd></div>
            <div><dt>Stage</dt><dd>{model.snapshot.stageLabel}</dd></div>
            <div><dt>Agency</dt><dd>{selected.agencyStage}</dd></div>
            <div><dt>Autonomy risk</dt><dd>{Math.round(model.autonomyRisk * 100)}%</dd></div>
          </dl>
          <p className="muted">{model.agencyDescription}</p>
        </div>

        <div>
          <h2>Yield distribution / 24h epoch</h2>
          <Bar label="Human investor yield" value={model.yieldDistribution.humanInvestorYield} total={model.yieldDistribution.grossRevenue} />
          <Bar label="AI treasury" value={model.yieldDistribution.aiTreasury} total={model.yieldDistribution.grossRevenue} />
          <Bar label="Maintenance reserve" value={model.yieldDistribution.maintenanceReserve} total={model.yieldDistribution.grossRevenue} />
          <Bar label="Insurance pool" value={model.yieldDistribution.insurancePool} total={model.yieldDistribution.grossRevenue} />
          <Bar label="Planetary dividend" value={model.yieldDistribution.planetaryDividend} total={model.yieldDistribution.grossRevenue} />
          <Bar label="Retained expansion" value={model.yieldDistribution.retainedForExpansion} total={model.yieldDistribution.grossRevenue} />
        </div>
      </section>

      <section className="panel">
        <h2>Integrated narrative</h2>
        <div className="timeline">
          <Step title="1. Human-owned RWA" text="Tokenized revenue claims over known real-world assets." />
          <Step title="2. AI-managed DePIN" text="Agents optimize energy routing, utilization, maintenance, and pricing." />
          <Step title="3. AI-issued RWA" text="Algorithmic entities raise capital to expand compute and energy capacity." />
          <Step title="4. Sovereign asset" text="AI treasury owns or economically controls the infrastructure." />
          <Step title="5. Kardashev convergence" text="Planetary or stellar-scale energy becomes a liquid compute-energy dividend layer." />
        </div>
      </section>
    </main>
  );
}

function buildViewModel(asset: InfrastructureAsset) {
  return {
    snapshot: snapshotAsset(asset),
    yieldDistribution: simulateYieldDistribution(asset),
    agencyDescription: describeAgencyStage(asset.agencyStage),
    autonomyRisk: estimateAutonomyRisk(asset)
  };
}

function MetricCard(props: { title: string; value: string }) {
  return (
    <article className="metric">
      <span>{props.title}</span>
      <strong>{props.value}</strong>
    </article>
  );
}

function Bar(props: { label: string; value: number; total: number }) {
  const pct = props.total > 0 ? Math.max(0, Math.min(100, (props.value / props.total) * 100)) : 0;
  return (
    <div className="barRow">
      <div className="barLabel"><span>{props.label}</span><span>{usd.format(props.value)}</span></div>
      <div className="barTrack"><div className="barFill" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function Step(props: { title: string; text: string }) {
  return (
    <article className="step">
      <h3>{props.title}</h3>
      <p>{props.text}</p>
    </article>
  );
}
