"use client";

import { useState } from "react";
import deployment from "@/generated/sui.testnet.json";
import { MIST_PER_SUI } from "@/lib/efficiency";
import { stakeToMicrogrid } from "@/lib/sui-wallet";
import { explainWalletError, SuiWalletConnect, useSuiWallet } from "@/components/SuiWalletConnect";

// Read optional fields defensively so the build never breaks if the committed
// deployment JSON is regenerated without them (the value is a runtime optimization).
const microgridInitialSharedVersion = (deployment as { microgridInitialSharedVersion?: number })
  .microgridInitialSharedVersion;

export function SuiWalletStake() {
  const { wallets, connected, connect, error, setError } = useSuiWallet();
  const [amountSui, setAmountSui] = useState("0.01");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);

  async function stake() {
    if (!connected) return;
    const sui = Number(amountSui);
    if (!Number.isFinite(sui) || sui <= 0) {
      setError("Enter a positive amount of SUI.");
      return;
    }
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const digest = await stakeToMicrogrid({
        wallet: connected.wallet,
        account: connected.account,
        packageId: deployment.packageId,
        microgridId: deployment.microgridId,
        microgridInitialSharedVersion,
        amountMist: BigInt(Math.round(sui * MIST_PER_SUI)),
        network: deployment.network as "testnet",
      });
      setOk(`Staked ${sui} SUI — received a StakeReceipt token. Tx ${digest.slice(0, 10)}…`);
    } catch (e) {
      setError(explainWalletError(e, "Stake failed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="panel">
      <div className="panel-title">
        <div>
          <small>On-chain participation</small>
          <h2>Connect wallet &amp; stake</h2>
        </div>
        <span className="pill">Sui {deployment.network}</span>
      </div>

      <p className="policy-description">
        Stake test SUI into the microgrid treasury and receive a <strong>StakeReceipt</strong> token
        representing your contribution. Any Sui wallet works (Slush, Suiet, …).
      </p>

      <SuiWalletConnect wallets={wallets} connected={connected} onConnect={(w) => void connect(w)} />

      {connected ? (
        <div className="wallet-actions" style={{ alignItems: "center", gap: 8 }}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amountSui}
            onChange={(e) => setAmountSui(e.target.value)}
            aria-label="Amount in SUI"
            style={{
              width: 120,
              padding: 9,
              borderRadius: 8,
              border: "1px solid #2a303b",
              background: "#12161d",
              color: "inherit",
            }}
          />
          <button type="button" className="refresh" onClick={() => void stake()} disabled={busy}>
            {busy ? "Staking…" : "Stake SUI"}
          </button>
        </div>
      ) : null}

      {ok ? (
        <p className="policy-description" style={{ color: "var(--cyan)" }}>
          {ok}
        </p>
      ) : null}
      {error ? (
        <p className="policy-description" style={{ color: "#e2726e" }}>
          {error}
        </p>
      ) : null}
    </article>
  );
}
