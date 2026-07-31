"use client";

import { Transaction } from "@mysten/sui/transactions";
import { getWallets, type Wallet, type WalletAccount } from "@mysten/wallet-standard";

const SIGN_EXEC = "sui:signAndExecuteTransaction";
const CONNECT = "standard:connect";

export interface SuiWalletInfo {
  name: string;
  icon: string;
  wallet: Wallet;
}

/**
 * Discover installed Sui wallets via the Wallet Standard (Slush and any other
 * Sui-compatible wallet register themselves here — the Sui analogue of EIP-6963).
 * We only surface wallets that can sign+execute a transaction.
 */
export function listSuiWallets(): SuiWalletInfo[] {
  if (typeof window === "undefined") return [];
  return getWallets()
    .get()
    .filter((w) => SIGN_EXEC in w.features && CONNECT in w.features)
    .map((w) => ({ name: w.name, icon: w.icon as string, wallet: w }));
}

/** Subscribe to wallet register/unregister events so the picker stays live. */
export function subscribeSuiWallets(onChange: (list: SuiWalletInfo[]) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const wallets = getWallets();
  onChange(listSuiWallets());
  const un1 = wallets.on("register", () => onChange(listSuiWallets()));
  const un2 = wallets.on("unregister", () => onChange(listSuiWallets()));
  return () => {
    un1();
    un2();
  };
}

export async function connectSuiWallet(wallet: Wallet): Promise<WalletAccount | null> {
  const feature = wallet.features[CONNECT] as {
    connect: () => Promise<{ accounts: readonly WalletAccount[] }>;
  };
  const res = await feature.connect();
  return res.accounts[0] ?? wallet.accounts[0] ?? null;
}

export interface StakeParams {
  wallet: Wallet;
  account: WalletAccount;
  packageId: string;
  microgridId: string;
  amountMist: bigint;
  network?: "testnet" | "mainnet" | "devnet";
}

/**
 * Build and submit a `microgrid::stake` transaction through the connected
 * wallet: split `amountMist` off the gas coin and stake it, receiving a
 * StakeReceipt token. Returns the transaction digest.
 */
export async function stakeToMicrogrid(params: StakeParams): Promise<string> {
  const { wallet, account, packageId, microgridId, amountMist, network = "testnet" } = params;

  const tx = new Transaction();
  const [coin] = tx.splitCoins(tx.gas, [amountMist]);
  tx.moveCall({
    target: `${packageId}::microgrid::stake`,
    arguments: [tx.object(microgridId), coin],
  });

  const feature = wallet.features[SIGN_EXEC] as {
    signAndExecuteTransaction: (input: {
      transaction: Transaction;
      account: WalletAccount;
      chain: `sui:${string}`;
    }) => Promise<{ digest: string }>;
  };

  const result = await feature.signAndExecuteTransaction({
    transaction: tx,
    account,
    chain: `sui:${network}`,
  });
  return result.digest;
}
