import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import deployment from "@/generated/sui.testnet.json";

/**
 * Server-side execution path for the autonomous agent.
 *
 * Protocol split, and why: public Sui fullnodes have deprecated JSON-RPC, so the
 * SDK's `SuiClient` cannot be used at all. Reads and object/gas resolution go
 * over **gRPC** (the official replacement), the transaction is built **locally**
 * with every input pre-resolved (the gRPC client cannot resolve inputs itself),
 * and execution goes over the **GraphQL** `executeTransaction` mutation. All
 * three are public endpoints; only the signing key is secret.
 *
 * This module deliberately does NOT import `@aks/agent`: that package shells out
 * to `node:child_process` (the Sui CLI) and its published entrypoint does not
 * match its build output, so it is not loadable from Next.js. The policy it
 * encodes is mirrored here in `decideAgentAction`.
 */

const SUI_TYPE = "0x2::sui::SUI";
/** Ample for one moveCall; set explicitly so we never need a gas dry-run. */
const GAS_BUDGET = 50_000_000;

export interface AgentEnv {
  packageId: string;
  microgridId: string;
  microgridInitialSharedVersion?: number;
  agentCapId?: string;
  grpcUrl: string;
  graphqlUrl: string;
  network: string;
  /** Per-transaction dividend size, in MIST. */
  dividendMist: bigint;
  /** Whether a signing key is configured. Without one the agent only observes. */
  armed: boolean;
  secretKey?: string;
}

export function loadAgentEnv(): AgentEnv {
  const secretKey = process.env.AGENT_SECRET_KEY?.trim() || undefined;
  return {
    packageId: process.env.SUI_PACKAGE_ID ?? deployment.packageId,
    microgridId: process.env.SUI_MICROGRID_ID ?? deployment.microgridId,
    microgridInitialSharedVersion: (deployment as { microgridInitialSharedVersion?: number })
      .microgridInitialSharedVersion,
    agentCapId:
      process.env.SUI_AGENT_CAP_ID ?? (deployment as { agentCapId?: string }).agentCapId,
    grpcUrl: process.env.SUI_GRPC_URL ?? "https://fullnode.testnet.sui.io:443",
    graphqlUrl: process.env.SUI_GRAPHQL_URL ?? deployment.graphqlUrl,
    network: deployment.network,
    dividendMist: BigInt(process.env.AGENT_DIVIDEND_MIST ?? "10000000"),
    armed: Boolean(secretKey),
    secretKey,
  };
}

export type AgentDecision =
  | { action: "noop"; reason: string }
  | { action: "dividend"; reason: string; amountMist: bigint };

export interface AgentObservation {
  paused: boolean;
  dividendEligible: boolean;
  efficiency: number;
  dividendAllowance: string;
  treasuryMist: string;
}

/**
 * The deterministic policy, mirroring `packages/agent/src/policy.ts`. Fails
 * closed: anything unexpected results in a noop rather than a transaction.
 */
export function decideAgentAction(
  observation: AgentObservation,
  dividendMist: bigint
): AgentDecision {
  if (observation.paused) {
    return { action: "noop", reason: "kill-switch engaged (microgrid paused)" };
  }
  if (!observation.dividendEligible) {
    return {
      action: "noop",
      reason: `efficiency ${observation.efficiency.toFixed(2)} below the 85.00 dividend threshold`,
    };
  }
  const allowance = BigInt(observation.dividendAllowance);
  if (allowance === 0n) {
    return { action: "noop", reason: "no human-authorized dividend allowance remaining" };
  }
  const amount = allowance < dividendMist ? allowance : dividendMist;
  if (BigInt(observation.treasuryMist) < amount) {
    return { action: "noop", reason: "treasury balance below the dividend amount" };
  }
  return {
    action: "dividend",
    reason: `efficiency ${observation.efficiency.toFixed(2)} >= 85.00 and allowance available`,
    amountMist: amount,
  };
}

interface GraphQLExecuteResult {
  status?: string;
  digest?: string;
  executionError?: { abortCode?: string; message?: string } | null;
}

async function executeOverGraphQL(
  graphqlUrl: string,
  txBytes: Uint8Array,
  signature: string
): Promise<GraphQLExecuteResult> {
  const mutation =
    "mutation($tx:Base64!,$sigs:[String!]!){ executeTransaction(transactionDataBcs:$tx,signatures:$sigs){ effects { status digest executionError { abortCode message } } } }";
  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: mutation,
      variables: { tx: Buffer.from(txBytes).toString("base64"), sigs: [signature] },
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Sui GraphQL responded ${response.status}`);
  }
  const payload = (await response.json()) as {
    errors?: Array<{ message?: string }>;
    data?: { executeTransaction?: { effects?: GraphQLExecuteResult } };
  };
  if (payload.errors?.length) {
    throw new Error(`Sui GraphQL error: ${payload.errors[0]?.message ?? "unknown"}`);
  }
  return payload.data?.executeTransaction?.effects ?? {};
}

export interface ExecutionOutcome {
  digest: string;
  success: boolean;
  error?: string;
}

/**
 * Sign and submit `distribute_planetary_dividend_auto` — the AgentCap-only path,
 * which spends inside the allowance a human pre-authorized via the AdminCap.
 * No AdminCap is present in this transaction by design.
 */
export async function executeAutonomousDividend(
  env: AgentEnv,
  amountMist: bigint
): Promise<ExecutionOutcome> {
  if (!env.secretKey) {
    throw new Error("AGENT_SECRET_KEY is not configured");
  }
  if (!env.agentCapId) {
    throw new Error("No AgentCap configured (SUI_AGENT_CAP_ID unset and absent from deployment)");
  }

  const keypair = Ed25519Keypair.fromSecretKey(env.secretKey);
  const sender = keypair.getPublicKey().toSuiAddress();
  const grpc = new SuiGrpcClient({
    network: env.network as "testnet",
    baseUrl: env.grpcUrl,
  });

  // Resolve every input up front: the gRPC client cannot resolve them for us.
  const [capResult, coinResult, gasPriceResult] = await Promise.all([
    grpc.core.getObject({ objectId: env.agentCapId }),
    grpc.core.getCoins({ address: sender, coinType: SUI_TYPE }),
    grpc.core.getReferenceGasPrice(),
  ]);

  const cap = capResult.object;
  const gas = [...coinResult.objects].sort((a, b) =>
    Number(BigInt(b.balance) - BigInt(a.balance))
  )[0];
  if (!gas) {
    throw new Error(`Agent address ${sender} holds no SUI to pay for gas.`);
  }

  const tx = new Transaction();
  tx.setSender(sender);
  tx.setGasBudget(GAS_BUDGET);
  tx.setGasPrice(BigInt(gasPriceResult.referenceGasPrice));
  tx.setGasPayment([{ objectId: gas.id, version: gas.version, digest: gas.digest }]);
  tx.moveCall({
    target: `${env.packageId}::microgrid::distribute_planetary_dividend_auto`,
    arguments: [
      env.microgridInitialSharedVersion != null
        ? tx.sharedObjectRef({
            objectId: env.microgridId,
            initialSharedVersion: env.microgridInitialSharedVersion,
            mutable: true,
          })
        : tx.object(env.microgridId),
      tx.objectRef({ objectId: cap.id, version: cap.version, digest: cap.digest }),
      tx.pure.u64(amountMist),
    ],
  });

  const bytes = await tx.build();
  const { signature } = await keypair.signTransaction(bytes);
  const effects = await executeOverGraphQL(env.graphqlUrl, bytes, signature);

  const success = effects.status === "SUCCESS";
  return {
    digest: effects.digest ?? "",
    success,
    error: success
      ? undefined
      : (effects.executionError?.message ??
        `execution status ${effects.status ?? "unknown"}`),
  };
}

/** The address the configured signing key controls, for display. */
export function agentAddress(env: AgentEnv): string | null {
  if (!env.secretKey) return null;
  try {
    return Ed25519Keypair.fromSecretKey(env.secretKey).getPublicKey().toSuiAddress();
  } catch {
    return null;
  }
}
