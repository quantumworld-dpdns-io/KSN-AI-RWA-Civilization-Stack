"use client";

import { Transaction } from "@mysten/sui/transactions";
import { getWallets, type Wallet, type WalletAccount } from "@mysten/wallet-standard";

const SIGN_EXEC = "sui:signAndExecuteTransaction";
const SIGN_EXEC_BLOCK = "sui:signAndExecuteTransactionBlock";
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
    .filter(
      (w) => (SIGN_EXEC in w.features || SIGN_EXEC_BLOCK in w.features) && CONNECT in w.features
    )
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
  /**
   * The microgrid's initialSharedVersion. When provided we pass an explicit
   * shared-object reference so the wallet never has to resolve it over the
   * (now-deprecated) public JSON-RPC — a common cause of execute failures.
   */
  microgridInitialSharedVersion?: number | string;
  network?: "testnet" | "mainnet" | "devnet";
}

/**
 * Build and submit a `microgrid::stake` transaction through the connected
 * wallet: split `amountMist` off the gas coin and stake it, receiving a
 * StakeReceipt token. Returns the transaction digest.
 *
 * Handles the two common failure modes: (1) the connected account being on the
 * wrong Sui network (the package/object are testnet-only — Slush defaults to
 * mainnet), and (2) wallets that only expose the legacy
 * `signAndExecuteTransactionBlock` feature.
 */
export async function stakeToMicrogrid(params: StakeParams): Promise<string> {
  const { wallet, account, packageId, microgridId, amountMist, network = "testnet" } = params;
  const targetChain = `sui:${network}` as const;

  // Guard the network mismatch up front with a clear, actionable message.
  if (account.chains?.length && !account.chains.includes(targetChain)) {
    throw new Error(
      `Wallet account is on ${account.chains.join(", ")}, but the microgrid is on ${targetChain}. ` +
        `Switch your wallet to Sui ${network} and reconnect.`
    );
  }

  const tx = new Transaction();
  tx.setSenderIfNotSet(account.address);
  const [coin] = tx.splitCoins(tx.gas, [amountMist]);
  tx.moveCall({
    target: `${packageId}::microgrid::stake`,
    arguments: [tx.object(microgridId), coin],
  });

  // Preferred: the current Wallet Standard feature.
  const modern = wallet.features[SIGN_EXEC] as
    | {
        signAndExecuteTransaction: (input: {
          transaction: Transaction;
          account: WalletAccount;
          chain: `sui:${string}`;
        }) => Promise<{ digest: string }>;
      }
    | undefined;
  if (modern) {
    const result = await modern.signAndExecuteTransaction({
      transaction: tx,
      account,
      chain: targetChain,
    });
    return result.digest;
  }

  // Fallback: legacy feature exposed by older wallet builds.
  const legacy = wallet.features[SIGN_EXEC_BLOCK] as
    | {
        signAndExecuteTransactionBlock: (input: {
          transactionBlock: Transaction;
          account: WalletAccount;
          chain: `sui:${string}`;
          options?: { showEffects?: boolean };
        }) => Promise<{ digest: string }>;
      }
    | undefined;
  if (legacy) {
    const result = await legacy.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      account,
      chain: targetChain,
      options: { showEffects: true },
    });
    return result.digest;
  }

  throw new Error("Connected wallet cannot sign and execute transactions.");
}
