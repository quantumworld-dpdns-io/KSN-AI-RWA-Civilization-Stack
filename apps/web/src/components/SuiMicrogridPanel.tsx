"use client";

import { useCallback, useEffect, useState } from "react";

interface SuiMicrogridState {
  ok: boolean;
  network: string;
  graphqlUrl: string;
  explorer: string;
  packageId: string;
  microgridId: string;
  fetchedAt: string;
  agencyStage: number;
  agencyLabel: string;
  powerWatts: string;
  hashrate: string;
  ksnScore: string;
  treasuryMist: string;
  dividendPoolMist: string;
  paused: boolean;
  sovereignOwner: string | null;
  totalIssuedBps: number;
  dividendRound: number;
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function Value({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="value">
      <small>{label}</small>
      <strong className={mono ? "mono" : ""}>{value}</strong>
    </div>
  );
}

export function SuiMicrogridPanel() {
  const [state, setState] = useState<SuiMicrogridState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/chain/sui", { cache: "no-store" });
      const payload = (await response.json()) as SuiMicrogridState & { error?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Unable to read the Sui microgrid object.");
        setState(null);
        return;
      }
      setState(payload);
    } catch {
      setError("Unable to reach the Sui chain read endpoint.");
      setState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <article className="panel">
      <div className="panel-title">
        <div>
          <small>Agentic web MVP</small>
          <h2>Sui Microgrid (on-chain)</h2>
        </div>
        {state ? (
          <span className={`pill ${state.paused ? "" : "live"}`}>
            {state.network} · {state.paused ? "⏸ paused" : "live"}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="policy-description">{error}</p>
      ) : !state ? (
        <p className="policy-description">Reading microgrid object from Sui testnet…</p>
      ) : (
        <>
          <div className="signal-grid">
            <Value label="Agency stage" value={humanize(state.agencyLabel)} />
            <Value label="KSN score S(t)" value={state.ksnScore} mono />
            <Value label="Power P(t)" value={`${state.powerWatts} W`} mono />
            <Value label="Hashrate H(t)" value={state.hashrate} mono />
            <Value label="Treasury (MIST)" value={state.treasuryMist} mono />
            <Value label="Dividend pool (MIST)" value={state.dividendPoolMist} mono />
            <Value label="Issued shares" value={`${(state.totalIssuedBps / 100).toFixed(2)}%`} />
            <Value label="Dividend round" value={String(state.dividendRound)} />
          </div>
          <div className="safety-banner">
            <span>◉</span>
            <div>
              <strong>Live on Sui {state.network}</strong>
              <small>
                Object{" "}
                <a
                  href={`${state.explorer}/object/${state.microgridId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {state.microgridId.slice(0, 10)}…{state.microgridId.slice(-6)}
                </a>{" "}
                · read via GraphQL · {new Date(state.fetchedAt).toLocaleTimeString()}
              </small>
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        className="refresh"
        onClick={() => void load()}
        disabled={loading}
        style={{ marginTop: 14 }}
      >
        <span className={loading ? "spin" : ""}>↻</span>
        {loading ? "Reading" : "Refresh on-chain"}
      </button>
    </article>
  );
}
