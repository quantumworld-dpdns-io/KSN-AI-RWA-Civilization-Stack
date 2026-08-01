"use client";

import type { WalletAccount } from "@mysten/wallet-standard";
import { useEffect, useState } from "react";
import deployment from "@/generated/sui.testnet.json";
import {
  connectSuiWallet,
  type SuiWalletInfo,
  stakeToMicrogrid,
  subscribeSuiWallets,
} from "@/lib/sui-wallet";

const MIST_PER_SUI = 1_000_000_000;

// Read optional fields defensively so the build never breaks if the committed
// deployment JSON is regenerated without them (the value is a runtime optimization).
const microgridInitialSharedVersion = (deployment as { microgridInitialSharedVersion?: number })
  .microgridInitialSharedVersion;

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function SuiWalletStake() {
  const [wallets, setWallets] = useState<SuiWalletInfo[]>([]);
  const [connected, setConnected] = useState<{
    name: string;
    account: WalletAccount;
    wallet: SuiWalletInfo["wallet"];
  } | null>(null);
  const [amountSui, setAmountSui] = useState("0.01");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => subscribeSuiWallets(setWallets), []);

  async function connect(info: SuiWalletInfo) {
    setStatus(null);
    try {
      const account = await connectSuiWallet(info.wallet);
      if (!account) {
        setStatus({ kind: "err", msg: "Wallet returned no account." });
        return;
      }
      setConnected({ name: info.name, account, wallet: info.wallet });
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : "Connect failed." });
    }
  }

  async function stake() {
    if (!connected) return;
    const sui = Number(amountSui);
    if (!Number.isFinite(sui) || sui <= 0) {
      setStatus({ kind: "err", msg: "Enter a positive amount of SUI." });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const amountMist = BigInt(Math.round(sui * MIST_PER_SUI));
      const digest = await stakeToMicrogrid({
        wallet: connected.wallet,
        account: connected.account,
        packageId: deployment.packageId,
        microgridId: deployment.microgridId,
        microgridInitialSharedVersion,
        amountMist,
        network: deployment.network as "testnet",
      });
      setStatus({
        kind: "ok",
        msg: `Staked ${sui} SUI — received a StakeReceipt token. Tx ${digest.slice(0, 10)}…`,
      });
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Stake failed.";
      // A wallet that reports a password/lock error without prompting is locked
      // or in a bad keyring state — surface an actionable hint, not just the raw text.
      const msg = /password|locked|unlock|keyring/i.test(raw)
        ? `${raw} — open the Slush extension and unlock it (enter your wallet password there), then retry. If it persists, re-add this account in Slush.`
        : raw;
      setStatus({ kind: "err", msg });
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

      {!connected ? (
        wallets.length === 0 ? (
          <p className="policy-description">
            No Sui wallet detected. Install{" "}
            <a href="https://slush.app" target="_blank" rel="noreferrer">
              Slush
            </a>{" "}
            and reload.
          </p>
        ) : (
          <div className="wallet-actions">
            {wallets.map((w) => (
              <button
                key={w.name}
                type="button"
                className="secondary"
                onClick={() => void connect(w)}
              >
                {w.icon ? (
                  // biome-ignore lint/performance/noImgElement: wallet-provided data-URI icon; next/image can't optimize it
                  <img
                    src={w.icon}
                    alt=""
                    width={16}
                    height={16}
                    style={{ verticalAlign: "middle", marginRight: 6 }}
                  />
                ) : null}
                {w.name}
              </button>
            ))}
          </div>
        )
      ) : (
        <>
          <div className="signal-grid">
            <div className="value">
              <small>Wallet</small>
              <strong>{connected.name}</strong>
            </div>
            <div className="value">
              <small>Account</small>
              <strong className="mono">{shorten(connected.account.address)}</strong>
            </div>
          </div>
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
        </>
      )}

      {status ? (
        <p
          className="policy-description"
          style={{ color: status.kind === "ok" ? "var(--cyan)" : "#e2726e" }}
        >
          {status.msg}
        </p>
      ) : null}
    </article>
  );
}
