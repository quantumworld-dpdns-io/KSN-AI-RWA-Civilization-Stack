"use client";

import { useMemo, useState } from "react";

type Hub = {
  id: string;
  name: string;
  country: string;
  x: number;
  y: number;
  role: "energy" | "compute" | "settlement" | "zk";
  mw: number;
  zkStatus: "attested" | "pending" | "draft";
};

const HUBS: Hub[] = [
  { id: "osl", name: "Oslo Hydro Corridor", country: "NO", x: 312, y: 78, role: "energy", mw: 420, zkStatus: "attested" },
  { id: "hel", name: "Helsinki Cold Compute", country: "FI", x: 390, y: 92, role: "compute", mw: 180, zkStatus: "attested" },
  { id: "ams", name: "Amsterdam Interconnect", country: "NL", x: 248, y: 168, role: "settlement", mw: 260, zkStatus: "attested" },
  { id: "fra", name: "Frankfurt GPU Mesh", country: "DE", x: 278, y: 198, role: "compute", mw: 510, zkStatus: "attested" },
  { id: "par", name: "Paris Carbon Desk", country: "FR", x: 218, y: 220, role: "zk", mw: 140, zkStatus: "pending" },
  { id: "mad", name: "Iberian Solar Gate", country: "ES", x: 148, y: 310, role: "energy", mw: 640, zkStatus: "attested" },
  { id: "mil", name: "Milan Cooling Hub", country: "IT", x: 292, y: 268, role: "compute", mw: 210, zkStatus: "pending" },
  { id: "waw", name: "Warsaw Grid Relay", country: "PL", x: 348, y: 178, role: "energy", mw: 190, zkStatus: "draft" },
  { id: "buc", name: "Bucharest Flex Node", country: "RO", x: 400, y: 250, role: "settlement", mw: 95, zkStatus: "draft" },
  { id: "ath", name: "Athens Solar Edge", country: "GR", x: 392, y: 318, role: "energy", mw: 160, zkStatus: "pending" },
];

const CORRIDORS: [string, string][] = [
  ["osl", "ams"],
  ["hel", "waw"],
  ["ams", "fra"],
  ["fra", "par"],
  ["par", "mad"],
  ["fra", "mil"],
  ["waw", "buc"],
  ["mil", "ath"],
  ["ams", "hel"],
];

const MARKETS = [
  {
    title: "EU energy ↔ compute desk",
    detail: "Vision: route surplus Nordic hydro and Iberian solar into GPU inference windows with auditable KSN signals.",
  },
  {
    title: "MiCA-aligned settlement",
    detail: "Vision: tokenized capacity claims settled under European crypto-asset disclosure norms — not live rails yet.",
  },
  {
    title: "Cross-border ZK compliance",
    detail: "Vision: prove carbon intensity and utilization bounds without revealing raw site telemetry.",
  },
];

function hubById(id: string) {
  return HUBS.find((h) => h.id === id)!;
}

export function EuropeVisionPanel() {
  const [selectedId, setSelectedId] = useState(HUBS[2].id);
  const selected = useMemo(() => hubById(selectedId), [selectedId]);
  const attested = HUBS.filter((h) => h.zkStatus === "attested").length;
  const totalMw = HUBS.reduce((s, h) => s + h.mw, 0);

  return (
    <div className="europe-page">
      <section className="europe-banner panel">
        <div>
          <p className="eyebrow">Product vision · pure frontend mock</p>
          <h2 className="europe-banner-title">European market topology</h2>
          <p className="europe-banner-copy">
            This screen is a <strong>forward-looking concept</strong> for EU energy–compute corridors,
            ZK attestations, and market desks. It is not a live European integration — use it for
            narrative and roadmap demos.
          </p>
        </div>
        <div className="europe-banner-kpis">
          <div>
            <small>Concept hubs</small>
            <strong>{HUBS.length}</strong>
          </div>
          <div>
            <small>ZK attested (mock)</small>
            <strong>
              {attested}/{HUBS.length}
            </strong>
          </div>
          <div>
            <small>Notional capacity</small>
            <strong>{totalMw.toLocaleString()} MW</strong>
          </div>
        </div>
      </section>

      <section className="europe-grid">
        <article className="panel europe-map-panel">
          <div className="panel-title">
            <div>
              <small>Vision map</small>
              <h2>EU microgrid corridors</h2>
            </div>
            <span className="pill">Mock · not live</span>
          </div>

          <svg
            className="europe-map"
            viewBox="0 0 520 400"
            role="img"
            aria-label="Stylized European hub map"
          >
            <defs>
              <radialGradient id="euGlow" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="rgba(105,231,213,0.14)" />
                <stop offset="100%" stopColor="rgba(105,231,213,0)" />
              </radialGradient>
              <linearGradient id="euLand" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#141b24" />
                <stop offset="100%" stopColor="#0c1118" />
              </linearGradient>
            </defs>

            <rect width="520" height="400" fill="#070b10" rx="8" />
            <ellipse cx="280" cy="210" rx="210" ry="160" fill="url(#euGlow)" />

            {/* Simplified continental silhouette */}
            <path
              fill="url(#euLand)"
              stroke="#2a3644"
              strokeWidth="1.2"
              d="M210 40 L250 28 L290 36 L330 48 L360 70 L395 88 L410 120 L425 155 L430 200 L418 240 L400 270 L385 300 L360 330 L330 350 L290 358 L250 352 L210 340 L175 320 L145 290 L125 250 L118 210 L125 170 L145 130 L170 90 L190 60 Z"
            />
            <path
              fill="#0a1016"
              stroke="#24303c"
              strokeWidth="1"
              d="M95 250 L130 235 L155 250 L170 290 L155 330 L120 345 L90 320 L80 280 Z"
            />
            <path
              fill="#0a1016"
              stroke="#24303c"
              strokeWidth="1"
              d="M300 20 L340 18 L370 40 L355 70 L320 78 L295 55 Z"
            />

            {CORRIDORS.map(([a, b]) => {
              const from = hubById(a);
              const to = hubById(b);
              return (
                <line
                  key={`${a}-${b}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="rgba(105,231,213,0.28)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              );
            })}

            {HUBS.map((hub) => {
              const active = hub.id === selectedId;
              const color =
                hub.role === "energy"
                  ? "#3dffc8"
                  : hub.role === "compute"
                    ? "#6aa9e9"
                    : hub.role === "zk"
                      ? "#eabf74"
                      : "#9a8cff";
              return (
                <g
                  key={hub.id}
                  className="europe-hub"
                  onClick={() => setSelectedId(hub.id)}
                  style={{ cursor: "pointer" }}
                >
                  {active ? (
                    <circle cx={hub.x} cy={hub.y} r="16" fill="none" stroke={color} strokeOpacity="0.45">
                      <animate attributeName="r" values="12;18;12" dur="2.4s" repeatCount="indefinite" />
                      <animate attributeName="stroke-opacity" values="0.55;0.15;0.55" dur="2.4s" repeatCount="indefinite" />
                    </circle>
                  ) : null}
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r={active ? 7 : 5}
                    fill={color}
                    stroke="#061018"
                    strokeWidth="1.5"
                  />
                  <text
                    x={hub.x + 10}
                    y={hub.y - 8}
                    fill="#c5d0d8"
                    fontSize="9"
                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                  >
                    {hub.country}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="europe-legend">
            <span>
              <i style={{ background: "#3dffc8" }} /> Energy
            </span>
            <span>
              <i style={{ background: "#6aa9e9" }} /> Compute
            </span>
            <span>
              <i style={{ background: "#9a8cff" }} /> Settlement
            </span>
            <span>
              <i style={{ background: "#eabf74" }} /> ZK desk
            </span>
          </div>
        </article>

        <div className="europe-side">
          <article className="panel">
            <div className="panel-title">
              <div>
                <small>Selected hub</small>
                <h2>{selected.name}</h2>
              </div>
              <span className={`pill ${selected.zkStatus === "attested" ? "live" : ""}`}>
                ZK {selected.zkStatus}
              </span>
            </div>
            <div className="asset-kpis">
              <div className="value">
                <small>Country</small>
                <strong>{selected.country}</strong>
              </div>
              <div className="value">
                <small>Role</small>
                <strong>{selected.role}</strong>
              </div>
              <div className="value">
                <small>Notional MW</small>
                <strong>{selected.mw}</strong>
              </div>
              <div className="value">
                <small>Proof mode</small>
                <strong className="mono">Groth16</strong>
              </div>
            </div>
            <p className="europe-hub-note">
              Click hubs on the map to inspect corridor roles. Values are illustrative for pitch
              narrative only.
            </p>
          </article>

          <article className="panel">
            <div className="panel-title">
              <div>
                <small>Zero-knowledge layer</small>
                <h2>ZK attestation board</h2>
              </div>
            </div>
            <div className="europe-zk-list">
              {HUBS.map((hub) => (
                <button
                  key={hub.id}
                  type="button"
                  className={`europe-zk-row ${hub.id === selectedId ? "active" : ""}`}
                  onClick={() => setSelectedId(hub.id)}
                >
                  <span className={`europe-zk-dot ${hub.zkStatus}`} />
                  <span>
                    <strong>{hub.country}</strong>
                    <small>{hub.name}</small>
                  </span>
                  <code>{hub.zkStatus}</code>
                </button>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="europe-markets">
        {MARKETS.map((item) => (
          <article key={item.title} className="panel">
            <small className="europe-market-kicker">European market vision</small>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="panel europe-zk-explain">
        <div className="panel-title">
          <div>
            <small>How ZK fits the stack</small>
            <h2>Prove P(t) / H(t) bounds without leaking site data</h2>
          </div>
        </div>
        <div className="europe-zk-flow">
          <div>
            <strong>1. Private telemetry</strong>
            <p>Site meters stay off public mempools.</p>
          </div>
          <div>
            <strong>2. Circuit witness</strong>
            <p>Prover attests utilization, carbon, and uptime ranges.</p>
          </div>
          <div>
            <strong>3. Public KSN signal</strong>
            <p>
              Verifiers accept <code>S(t)</code> updates + compliance flags.
            </p>
          </div>
          <div>
            <strong>4. EU market desk</strong>
            <p>Capacity and carbon claims clear across corridors (roadmap).</p>
          </div>
        </div>
      </section>
    </div>
  );
}
