"use client";

import type { WalletAccount } from "@mysten/wallet-standard";
import { useCallback, useEffect, useState } from "react";
import {
  connectSuiWallet,
  type SuiWalletInfo,
  subscribeSuiWallets,
} from "@/lib/sui-wallet";

export interface ConnectedWallet {
  name: string;
  account: WalletAccount;
  wallet: SuiWalletInfo["wallet"];
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Wallets that report a password/lock error without prompting are locked or in a
 * bad keyring state. The raw text alone sends users in circles, so add the fix.
 */
export function explainWalletError(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : fallback;
  return /password|locked|unlock|keyring/i.test(raw)
    ? `${raw} — open the Slush extension and unlock it (enter your wallet password there), then retry. If it persists, re-add this account in Slush.`
    : raw;
}

/**
 * Live list of injected Sui wallets plus the currently connected account.
 * Shared by every on-chain action surface (staking, cooling upgrades) so they
 * behave identically and stay in sync with wallet register/unregister events.
 */
export function useSuiWallet() {
  const [wallets, setWallets] = useState<SuiWalletInfo[]>([]);
  const [connected, setConnected] = useState<ConnectedWallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeSuiWallets(setWallets), []);

  const connect = useCallback(async (info: SuiWalletInfo) => {
    setError(null);
    try {
      const account = await connectSuiWallet(info.wallet);
      if (!account) {
        setError("Wallet returned no account.");
        return;
      }
      setConnected({ name: info.name, account, wallet: info.wallet });
    } catch (e) {
      setError(explainWalletError(e, "Connect failed."));
    }
  }, []);

  return { wallets, connected, connect, error, setError };
}

/**
 * The wallet picker / connected-account readout. Renders nothing above a bare
 * `.wallet-actions` row so it can be dropped into any `.panel`.
 */
export function SuiWalletConnect({
  wallets,
  connected,
  onConnect,
}: {
  wallets: SuiWalletInfo[];
  connected: ConnectedWallet | null;
  onConnect: (info: SuiWalletInfo) => void;
}) {
  if (connected) {
    return (
      <div className="signal-grid">
        <div className="value">
          <small>Wallet</small>
          <strong>{connected.name}</strong>
        </div>
        <div className="value">
          <small>Account</small>
          <strong className="mono">{shortenAddress(connected.account.address)}</strong>
        </div>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <p className="policy-description">
        No Sui wallet detected. Install{" "}
        <a href="https://slush.app" target="_blank" rel="noreferrer">
          Slush
        </a>{" "}
        and reload.
      </p>
    );
  }

  return (
    <div className="wallet-actions">
      {wallets.map((w) => (
        <button key={w.name} type="button" className="secondary" onClick={() => onConnect(w)}>
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
  );
}
