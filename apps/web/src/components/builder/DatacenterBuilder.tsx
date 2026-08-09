"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AgentTerminal } from "@/components/builder/AgentTerminal";
import { EfficiencyGauge } from "@/components/builder/EfficiencyGauge";
import { explainWalletError, SuiWalletConnect, useSuiWallet } from "@/components/SuiWalletConnect";
import deployment from "@/generated/sui.testnet.json";
import {
  COOLING_UPGRADE_PRICE_MIST,
  formatMist,
  MAX_COOLING_TIER,
  projectCoolingUpgrade,
} from "@/lib/efficiency";
import type { SuiMicrogridState } from "@/lib/sui";
import { upgradeCooling } from "@/lib/sui-wallet";

const REFRESH_MS = 4_000;

const microgridInitialSharedVersion = (deployment as { microgridInitialSharedVersion?: number })
  .microgridInitialSharedVersion;

function Value({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="value">
      <small>{label}</small>
      <strong>{children}</strong>
    </div>
  );
}

/**
 * The Datacenter Builder: a live view of the microgrid Sui object, a
 * wallet-signed cooling upgrade that measurably raises its efficiency score, and
 * a split-screen terminal showing the AI agent react to the result on-chain.
 */
export function DatacenterBuilder({ initialState }: { initialState: SuiMicrogridState | null }) {
  const [state, setState] = useState<SuiMicrogridState | null>(initialState);
  const [readError, setReadError] = useState<string | null>(null);
  const { wallets, connected, connect, error, setError } = useSuiWallet();
  const [busy, setBusy] = useState(false);
  const [txDigest, setTxDigest] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/chain/sui", { cache: "no-store" });
      const payload = (await response.json()) as SuiMicrogridState & { error?: string };
      if (!response.ok || payload.error) {
        setReadError(payload.error ?? `Chain read failed (${response.status})`);
        return;
      }
      setState(payload);
      setReadError(null);
    } catch (e) {
      setReadError(e instanceof Error ? e.message : "Chain read failed.");
    }
  }, []);

  // Poll so the gauge visibly crosses 85 moments after the upgrade lands.
  useEffect(() => {
    const timer = setInterval(() => void refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const projection =
    state && state.coolingTier < MAX_COOLING_TIER
      ? projectCoolingUpgrade(state.powerWatts, state.hashrate, state.dividendThreshold)
      : null;

  async function submitUpgrade() {
    if (!connected) return;
    setBusy(true);
    setError(null);
    setTxDigest(null);
    try {
      const digest = await upgradeCooling({
        wallet: connected.wallet,
        account: connected.account,
        packageId: deployment.packageId,
        microgridId: deployment.microgridId,
        microgridInitialSharedVersion,
        amountMist: COOLING_UPGRADE_PRICE_MIST,
        network: deployment.network as "testnet",
      });
      setTxDigest(digest);
      // Give the fullnode a moment to index the new version, then re-read.
      setTimeout(() => void refresh(), 1_500);
    } catch (e) {
      setError(explainWalletError(e, "Cooling upgrade failed."));
    } finally {
      setBusy(false);
    }
  }

  const atMaxTier = state != null && state.coolingTier >= MAX_COOLING_TIER;

  return (
    <div className="builder-shell">
      <header className="builder-head">
        <div>
          <small>Sui {deployment.network} · object-centric RWA</small>
          <h1>Datacenter Builder</h1>
          <p>
            Every physical microgrid is a distinct Sui object. Build it up, and its efficiency
            metrics update on-chain — where an autonomous agent is watching.
          </p>
        </div>
        <nav className="builder-nav">
          <Link href="/">Home</Link>
          <Link href="/architecture">Architecture</Link>
          <Link href="/console">Console</Link>
          <Link href="/future">Future</Link>
        </nav>
      </header>

      {readError ? <p className="safety-banner">Chain read error: {readError}</p> : null}

      <div className="builder-grid">
        <section className="builder-col">
          <article className="panel">
            <div className="panel-title">
              <div>
                <small>Microgrid object</small>
                <h2>{deployment.assetId}</h2>
              </div>
              <span className={state?.paused ? "pill" : "pill live"}>
                {state?.paused ? "PAUSED" : "LIVE"}
              </span>
            </div>

            {state ? (
              <>
                <EfficiencyGauge value={state.efficiency} projected={projection?.efficiency} />

                <div className="signal-grid">
                  <Value label="S(t) = P/H">{state.ksnScore}</Value>
                  <Value label="Dividend threshold">{state.dividendThreshold}</Value>
                  <Value label="P(t) power draw">{Number(state.powerWatts).toLocaleString()} W</Value>
                  <Value label="H(t) hashrate">{Number(state.hashrate).toLocaleString()}</Value>
                  <Value label="Cooling tier">
                    {state.coolingTier} / {MAX_COOLING_TIER}
                  </Value>
                  <Value label="Agency stage">{state.agencyLabel}</Value>
                  <Value label="Treasury">{formatMist(state.treasuryMist)}</Value>
                  <Value label="Dividend pool">{formatMist(state.dividendPoolMist)}</Value>
                  <Value label="Agent allowance">{formatMist(state.dividendAllowance)}</Value>
                  <Value label="Dividend round">{state.dividendRound}</Value>
                </div>

                <p className="policy-description">
                  <a
                    href={`${state.explorer}/object/${state.microgridId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View the object on Suiscan ↗
                  </a>
                </p>
              </>
            ) : (
              <p className="policy-description">Reading the microgrid object…</p>
            )}
          </article>

          <article className="panel">
            <div className="panel-title">
              <div>
                <small>Build action</small>
                <h2>Upgrade cooling</h2>
              </div>
              <span className="pill">{formatMist(COOLING_UPGRADE_PRICE_MIST)}</span>
            </div>

            <p className="policy-description">
              Better cooling cuts the microgrid&apos;s power draw P(t) by 20%. Since S(t) = P(t)/H(t)
              is a cost metric, that lowers S(t) and raises the efficiency score E(t). The
              transaction is a programmable transaction block your wallet signs — no capability
              required, anyone can build.
            </p>

            {state && projection ? (
              <div className="signal-grid">
                <Value label="P(t) after">{Number(projection.powerWatts).toLocaleString()} W</Value>
                <Value label="S(t) after">{projection.ksnScore.toString()}</Value>
                <Value label="E(t) after">{projection.efficiency.toFixed(2)}</Value>
                <Value label="Crosses 85?">{projection.crossesThreshold ? "YES" : "not yet"}</Value>
              </div>
            ) : null}

            <SuiWalletConnect
              wallets={wallets}
              connected={connected}
              onConnect={(w) => void connect(w)}
            />

            {connected ? (
              <div className="wallet-actions">
                <button
                  type="button"
                  className="refresh"
                  onClick={() => void submitUpgrade()}
                  disabled={busy || atMaxTier || state?.paused}
                >
                  {busy
                    ? "Awaiting signature…"
                    : atMaxTier
                      ? "Max cooling tier reached"
                      : "Submit Transaction"}
                </button>
              </div>
            ) : null}

            {txDigest && state ? (
              <p className="policy-description tx-ok">
                Cooling upgraded.{" "}
                <a href={`${state.explorer}/tx/${txDigest}`} target="_blank" rel="noreferrer">
                  {txDigest.slice(0, 12)}… ↗
                </a>
              </p>
            ) : null}
            {error ? (
              <p className="policy-description" style={{ color: "#e2726e" }}>
                {error}
              </p>
            ) : null}
          </article>
        </section>

        <section className="builder-col">
          <AgentTerminal onState={setState} />
        </section>
      </div>
    </div>
  );
}
