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

export interface MicrogridCallParams {
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

export type StakeParams = MicrogridCallParams;

/**
 * Guard the common "wallet is on the wrong network" failure up front with an
 * actionable message — the package and object are testnet-only, while wallets
 * such as Slush default to mainnet.
 */
function assertChain(account: WalletAccount, network: string): `sui:${string}` {
  const targetChain = `sui:${network}` as const;
  if (account.chains?.length && !account.chains.includes(targetChain)) {
    throw new Error(
      `Wallet account is on ${account.chains.join(", ")}, but the microgrid is on ${targetChain}. ` +
        `Switch your wallet to Sui ${network} and reconnect.`
    );
  }
  return targetChain;
}

/**
 * Reference the shared Microgrid object. With a known initialSharedVersion we
 * pass an explicit shared-object ref; otherwise we fall back to tx.object(),
 * which requires the wallet to resolve the object itself over the deprecated
 * JSON-RPC (a common execute failure).
 */
function microgridArgument(
  tx: Transaction,
  microgridId: string,
  initialSharedVersion?: number | string
) {
  return initialSharedVersion != null
    ? tx.sharedObjectRef({
        objectId: microgridId,
        initialSharedVersion: Number(initialSharedVersion),
        mutable: true,
      })
    : tx.object(microgridId);
}

/**
 * Submit a built transaction through the connected wallet, preferring the
 * current Wallet Standard feature and falling back to the legacy one exposed by
 * older wallet builds. Returns the transaction digest.
 */
async function signAndExecute(
  wallet: Wallet,
  account: WalletAccount,
  tx: Transaction,
  targetChain: `sui:${string}`
): Promise<string> {
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

/**
 * Build and submit a single-moveCall PTB that splits `amountMist` off the gas
 * coin and passes it to `microgrid::<fn>(microgrid, coin)`. Both public,
 * permissionless entry points (`stake` and `upgrade_cooling`) have this shape.
 */
async function payToMicrogrid(
  fn: "stake" | "upgrade_cooling",
  params: MicrogridCallParams
): Promise<string> {
  const {
    wallet,
    account,
    packageId,
    microgridId,
    amountMist,
    microgridInitialSharedVersion,
    network = "testnet",
  } = params;
  const targetChain = assertChain(account, network);

  const tx = new Transaction();
  tx.setSenderIfNotSet(account.address);
  const [coin] = tx.splitCoins(tx.gas, [amountMist]);
  tx.moveCall({
    target: `${packageId}::microgrid::${fn}`,
    arguments: [microgridArgument(tx, microgridId, microgridInitialSharedVersion), coin],
  });
  // Set an explicit gas budget so the wallet does NOT run its own gas-estimation
  // dry-run before signing. That dry-run hits an RPC that can hang/fail (~28s),
  // which some wallets surface as a misleading generic error. 0.05 SUI is ample
  // for this single moveCall + coin split.
  tx.setGasBudget(50_000_000);

  return signAndExecute(wallet, account, tx, targetChain);
}

/**
 * `microgrid::stake` — stake `amountMist` into the treasury and receive a
 * StakeReceipt token. Returns the transaction digest.
 */
export async function stakeToMicrogrid(params: StakeParams): Promise<string> {
  return payToMicrogrid("stake", params);
}

/**
 * `microgrid::upgrade_cooling` — the Datacenter Builder action. Pays for one
 * cooling tier, which cuts the microgrid's power draw P(t) by 20% and therefore
 * raises its efficiency score E(t) toward (and past) the dividend threshold of
 * 85. Permissionless: any connected wallet can build.
 *
 * Pass exactly COOLING_UPGRADE_PRICE_MIST as `amountMist` — the contract does
 * not refund surplus, it just banks it in the treasury.
 */
export async function upgradeCooling(params: MicrogridCallParams): Promise<string> {
  return payToMicrogrid("upgrade_cooling", params);
}
