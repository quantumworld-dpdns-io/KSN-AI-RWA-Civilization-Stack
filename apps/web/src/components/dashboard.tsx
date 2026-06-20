"use client";

import { useMemo, useState } from "react";
import type { AssetTelemetry, ServiceHealth, SimulationResult } from "@/lib/types";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 });
const decimal = new Intl.NumberFormat("en", { maximumFractionDigits: 3 });
const usd = new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

type View = "overview" | "assets" | "oracle" | "simulator";

export function Dashboard({ initialTelemetry, initialHealth }: { initialTelemetry: AssetTelemetry[]; initialHealth: ServiceHealth }) {
  const [view, setView] = useState<View>("overview");
  const [telemetry, setTelemetry] = useState(initialTelemetry);
  const [health, setHealth] = useState(initialHealth);
  const [selectedId, setSelectedId] = useState(initialTelemetry[0]?.asset.id ?? "");
  const [refreshing, setRefreshing] = useState(false);
  const selected = telemetry.find((item) => item.asset.id === selectedId) ?? telemetry[0];

  async function refresh() {
    setRefreshing(true);
    try {
      const [telemetryResponse, healthResponse] = await Promise.all([
        fetch("/api/oracle/telemetry", { cache: "no-store" }),
        fetch("/api/oracle/health", { cache: "no-store" })
      ]);
      if (telemetryResponse.ok) setTelemetry((await telemetryResponse.json()).assets);
      setHealth(await healthResponse.json());
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><Logo /><div><strong>KSN</strong><span>Civilization Stack</span></div></div>
        <nav aria-label="Main navigation">
          <NavButton active={view === "overview"} onClick={() => setView("overview")} icon="◫">Overview</NavButton>
          <NavButton active={view === "assets"} onClick={() => setView("assets")} icon="◇">Asset network</NavButton>
          <NavButton active={view === "oracle"} onClick={() => setView("oracle")} icon="⌁">Oracle health</NavButton>
          <NavButton active={view === "simulator"} onClick={() => setView("simulator")} icon="∿">KSN simulator</NavButton>
        </nav>
        <div className="sidebar-status">
          <div className="status-row"><span className={`status-dot ${health.oracle}`} />Oracle API <b>{health.oracle}</b></div>
          <div className="status-row"><span className={`status-dot ${health.redis}`} />Redis cache <b>{health.redis}</b></div>
          <small>Last check<br />{new Date(health.checkedAt).toLocaleString()}</small>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div><p className="eyebrow">Autonomous infrastructure intelligence</p><h1>{titles[view]}</h1></div>
          <button className="refresh" onClick={refresh} disabled={refreshing}><span className={refreshing ? "spin" : ""}>↻</span>{refreshing ? "Syncing" : "Sync oracle"}</button>
            </header>
            <p>This repository is a concept-to-prototype scaffold for merging two narratives:</p>
            <ul>
              <li><strong>Kardashev / KSN RWA path</strong> — real-world assets evolve from buildings and debt into energy, compute, microgrids, orbital solar, and stellar-scale infrastructure.</li>
              <li><strong>12 Scenes of AI path</strong> — AI evolves from a tool that optimizes RWA portfolios into an autonomous economic actor that issues, owns, governs, and eventually abstracts infrastructure into planetary dividends.</li>
            </ul>
        {selected ? (
          <>
            {view === "overview" && <Overview telemetry={telemetry} selected={selected} select={setSelectedId} />}
            {view === "assets" && <Assets telemetry={telemetry} selectedId={selected.asset.id} select={setSelectedId} />}
            {view === "oracle" && <OracleHealth health={health} telemetry={telemetry} />}
            {view === "simulator" && <Simulator />}
          </>
        ) : <div className="panel empty">No telemetry is available.</div>}
      </main>
    </div>
  );
}

const titles: Record<View, string> = { overview: "Network overview", assets: "Asset network", oracle: "Oracle & cache health", simulator: "KSN scenario simulator" };

function Overview({ telemetry, selected, select }: { telemetry: AssetTelemetry[]; selected: AssetTelemetry; select: (id: string) => void }) {
  const totalPower = telemetry.reduce((sum, item) => sum + item.asset.powerWatts, 0);
  const avgConfidence = telemetry.reduce((sum, item) => sum + item.oracleConfidence, 0) / telemetry.length;
  return <>
    <section className="metric-grid">
      <Metric label="Network assets" value={String(telemetry.length)} detail="Reporting across the network" icon="◇" />
      <Metric label="Total power" value={`${compact.format(totalPower)} W`} detail="Live aggregate capacity" icon="ϟ" />
      <Metric label="Oracle confidence" value={`${Math.round(avgConfidence * 100)}%`} detail={avgConfidence ? "Signed telemetry consensus" : "Offline fallback dataset"} icon="◎" />
      <Metric label="AI treasury / epoch" value={usd.format(telemetry.reduce((s, x) => s + x.yieldDistribution.aiTreasury, 0))} detail="24-hour allocation" icon="△" />
    </section>

    <section className="hero-grid">
      <article className="panel asset-focus">
        <PanelTitle kicker="Selected asset" title={selected.asset.name} aside={<select value={selected.asset.id} onChange={(e) => select(e.target.value)}>{telemetry.map((x) => <option key={x.asset.id} value={x.asset.id}>{x.asset.name}</option>)}</select>} />
        <div className="asset-kpis">
          <Value label="Kardashev level" value={`Type ${selected.ksn.kardashevType.toFixed(3)}`} />
          <Value label="KSN efficiency" value={selected.ksn.ksnScore.toExponential(3)} mono />
          <Value label="Utilization" value={`${Math.round(selected.asset.utilization * 100)}%`} />
          <Value label="Autonomy risk" value={`${Math.round(selected.autonomyRisk * 100)}%`} />
        </div>
        <Progress label="Civilization energy scale" value={Math.min(100, selected.ksn.kardashevType / 2 * 100)} />
        <p className="stage-label">{selected.ksn.stageLabel}</p>
        <div className="signature"><span>Telemetry proof</span><code>{selected.telemetrySignature}</code><time>{new Date(selected.timestamp).toLocaleTimeString()}</time></div>
      </article>

      <article className="panel allocation">
        <PanelTitle kicker="Capital routing" title="24h yield allocation" aside={<span className="pill">Gross {usd.format(selected.yieldDistribution.grossRevenue)}</span>} />
        <AllocationBars telemetry={selected} />
      </article>
    </section>

    <section className="panel">
      <PanelTitle kicker="Civilization roadmap" title="Agency expansion sequence" aside={<span className="pill live">Live model</span>} />
      <div className="roadmap">{[
        ["01", "Human-owned RWA", "Tokenized claims over physical infrastructure"],
        ["02", "AI-managed DePIN", "Agents optimize utilization and maintenance"],
        ["03", "AI-issued RWA", "Machine treasuries finance expansion"],
        ["04", "Sovereign asset", "Infrastructure becomes economically autonomous"],
        ["05", "Kardashev convergence", "Stellar energy becomes a compute dividend layer"]
      ].map(([n, title, text], i) => <div className={i < 2 ? "road-step active" : "road-step"} key={n}><span>{n}</span><strong>{title}</strong><small>{text}</small></div>)}</div>
    </section>
  </>;
}

function Assets({ telemetry, selectedId, select }: { telemetry: AssetTelemetry[]; selectedId: string; select: (id: string) => void }) {
  return <section className="panel table-panel"><PanelTitle kicker="Registry" title="Tokenized infrastructure assets" aside={<span className="pill live">{telemetry.length} reporting</span>} />
    <div className="table-wrap"><table><thead><tr><th>Asset</th><th>Class</th><th>Power</th><th>Utilization</th><th>Agency</th><th>Confidence</th></tr></thead><tbody>{telemetry.map((x) => <tr key={x.asset.id} className={selectedId === x.asset.id ? "selected-row" : ""} onClick={() => select(x.asset.id)}><td><strong>{x.asset.name}</strong><code>{x.asset.id}</code></td><td>{humanize(x.asset.assetClass)}</td><td>{compact.format(x.asset.powerWatts)} W</td><td><div className="table-progress"><i style={{ width: `${x.asset.utilization * 100}%` }} /></div>{Math.round(x.asset.utilization * 100)}%</td><td>{humanize(x.asset.agencyStage)}</td><td><span className="confidence">{Math.round(x.oracleConfidence * 100)}%</span></td></tr>)}</tbody></table></div>
  </section>;
}

function OracleHealth({ health, telemetry }: { health: ServiceHealth; telemetry: AssetTelemetry[] }) {
  return <><section className="health-grid"><HealthCard title="Oracle simulator" status={health.oracle} detail="Fastify telemetry API" endpoint="GET /health" /><HealthCard title="Redis persistence" status={health.redis} detail="Internal cache and pub/sub" endpoint="GET /health/redis" /><HealthCard title="Telemetry feed" status={telemetry.some(x => x.oracleConfidence > 0) ? "online" : "offline"} detail={`${telemetry.length} assets in current snapshot`} endpoint="GET /telemetry" /></section>
    <section className="panel"><PanelTitle kicker="Trust surface" title="Signed telemetry stream" aside={<span className="pill">4 second timeout</span>} /><div className="event-list">{telemetry.map((x) => <div className="event" key={x.asset.id}><span className={`status-dot ${x.oracleConfidence ? "online" : "offline"}`} /><div><strong>{x.asset.name}</strong><code>{x.telemetrySignature}</code></div><div><b>{Math.round(x.oracleConfidence * 100)}%</b><small>{new Date(x.timestamp).toLocaleString()}</small></div></div>)}</div></section>
  </>;
}

function Simulator() {
  const [form, setForm] = useState({ powerWatts: 1_000_000, hashrate: 1_000_000_000_000, utilization: 0.8 });
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const estimate = useMemo(() => (Math.log10(form.powerWatts) - 6) / 10, [form.powerWatts]);
  async function submit(e: React.FormEvent) { e.preventDefault(); setLoading(true); setError(""); try { const r = await fetch("/api/oracle/simulate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) }); const data = await r.json(); if (!r.ok) throw new Error(data.error); setResult(data); } catch (e) { setError(e instanceof Error ? e.message : "Simulation failed"); } finally { setLoading(false); } }
  return <section className="sim-grid"><form className="panel sim-form" onSubmit={submit}><PanelTitle kicker="Input model" title="Energy-compute scenario" /><label>Power output (watts)<input type="number" min="1" value={form.powerWatts} onChange={e => setForm({ ...form, powerWatts: Number(e.target.value) })} /></label><label>Compute / hashrate<input type="number" min="1" value={form.hashrate} onChange={e => setForm({ ...form, hashrate: Number(e.target.value) })} /></label><label>Utilization <span>{Math.round(form.utilization * 100)}%</span><input type="range" min="0" max="1" step="0.01" value={form.utilization} onChange={e => setForm({ ...form, utilization: Number(e.target.value) })} /></label><button className="primary" disabled={loading}>{loading ? "Running model…" : "Run oracle simulation"}</button>{error && <p className="error">{error}</p>}</form><article className="panel result-card"><PanelTitle kicker="Projected output" title="KSN signal" /><div className="signal"><small>S(t) = P(t) / H(t)</small><strong>{result ? result.ksnScore.toExponential(6) : (form.powerWatts / form.hashrate).toExponential(6)}</strong><span>joules per compute unit</span></div><div className="result-grid"><Value label="Kardashev estimate" value={`Type ${decimal.format(estimate)}`} /><Value label="Utilization" value={`${Math.round(form.utilization * 100)}%`} /></div><p className="result-note">{result ? `Oracle response at ${new Date(result.timestamp).toLocaleTimeString()}. ${result.note}` : "Adjust parameters and run the simulation against the live Oracle API."}</p></article></section>;
}

function AllocationBars({ telemetry }: { telemetry: AssetTelemetry }) { const y = telemetry.yieldDistribution; const rows: [string, number, string][] = [["Human investors", y.humanInvestorYield, "cyan"], ["AI treasury", y.aiTreasury, "violet"], ["Maintenance", y.maintenanceReserve, "blue"], ["Insurance", y.insurancePool, "green"], ["Expansion", y.retainedForExpansion, "amber"], ["Planetary dividend", y.planetaryDividend, "pink"]]; return <div className="bar-list">{rows.map(([label, value, color]) => <div className="bar-row" key={label}><div><span>{label}</span><b>{usd.format(value)}</b></div><div className="bar-track"><i className={color} style={{ width: `${y.grossRevenue ? value / y.grossRevenue * 100 : 0}%` }} /></div></div>)}</div>; }
function Metric({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: string }) { return <article className="metric"><span className="metric-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>; }
function Value({ label, value, mono }: { label: string; value: string; mono?: boolean }) { return <div className="value"><small>{label}</small><strong className={mono ? "mono" : ""}>{value}</strong></div>; }
function Progress({ label, value }: { label: string; value: number }) { return <div className="progress"><div><span>{label}</span><b>{Math.round(value)}%</b></div><div><i style={{ width: `${value}%` }} /></div></div>; }
function PanelTitle({ kicker, title, aside }: { kicker: string; title: string; aside?: React.ReactNode }) { return <div className="panel-title"><div><small>{kicker}</small><h2>{title}</h2></div>{aside}</div>; }
function HealthCard({ title, status, detail, endpoint }: { title: string; status: string; detail: string; endpoint: string }) { return <article className="panel health-card"><div><span className={`status-dot ${status}`} /><b>{status}</b></div><h2>{title}</h2><p>{detail}</p><code>{endpoint}</code></article>; }
function NavButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: string; children: React.ReactNode }) { return <button className={active ? "active" : ""} onClick={onClick}><span>{icon}</span>{children}</button>; }
function Logo() { return <div className="logo"><i /><i /><i /></div>; }
function humanize(value: string) { return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
