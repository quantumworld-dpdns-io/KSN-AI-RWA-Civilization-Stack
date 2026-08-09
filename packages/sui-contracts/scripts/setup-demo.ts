// Seeds the demo microgrid: creates the shared object, issues the AgentCap and a
// dividend credential, funds the treasury, and arms the human-authorized
// dividend allowance.
//
// This drives the `sui` CLI rather than the TypeScript SDK's SuiClient: public
// Sui fullnodes have deprecated JSON-RPC (`sui_getNormalizedMoveFunction`), which
// the SDK needs to resolve move-call arguments, so SDK execution fails against
// testnet/mainnet. The CLI resolves against its own configured endpoint and is
// the same path `publish.ts` already uses.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, "..");

const TAIPEI_FIXTURE = {
  name: "Type 0.7 Taipei Microgrid GPU Cluster",
  assetId: "type-07-taipei-microgrid-gpu",
  // Seeded deliberately ABOVE the dividend threshold (i.e. a LOW efficiency
  // score) so the recorded demo starts at E(t) = 71.40 and a single wallet-signed
  // cooling upgrade carries it across 85:
  //   S(0) = 15_000_000 * 1e18 / 4.2e14 = 3.571e10 > 3.0e10  → E = 71.40
  //   S(1) = 12_000_000 * 1e18 / 4.2e14 = 2.857e10 <= 3.0e10 → E = 89.25
  powerWatts: 15_000_000n,
  hashrate: 420_000_000_000_000n,
  dividendThreshold: 30_000_000_000n,
  buyoutThreshold: 100_000_000n,
};

/// SUI seeded into the treasury so an autonomous dividend has something to pay.
const SEED_TREASURY_MIST = 50_000_000n;
/// Human-authorized ceiling the agent may distribute on its own, set once via
/// the AdminCap. Comfortably above the agent's per-cycle AGENT_DIVIDEND_MIST.
const SEED_DIVIDEND_ALLOWANCE_MIST = 30_000_000n;

const GAS_BUDGET = "100000000";

interface ObjectChange {
  type?: string;
  objectType?: string;
  objectId?: string;
}

interface TxResult {
  digest?: string;
  objectChanges?: ObjectChange[];
  effects?: { status?: { status?: string; error?: string } };
}

function activeEnv(): string {
  return process.env.SUI_NETWORK ?? process.env.SUI_ENV ?? "local";
}

function loadDeployment(): { packageId: string; adminCap?: string } {
  const fileName = activeEnv() === "local" ? "localnet.json" : `${activeEnv()}.json`;
  const path = join(packageRoot, "deployments", fileName);
  return JSON.parse(readFileSync(path, "utf8")) as { packageId: string; adminCap?: string };
}

function activeAddress(): string {
  return execFileSync("sui", ["client", "active-address"], { encoding: "utf8" }).trim();
}

/** Run a `sui client ptb` invocation and return its parsed, success-checked result. */
function runPtb(label: string, args: string[]): TxResult {
  const output = execFileSync(
    "sui",
    ["client", "ptb", "--gas-budget", GAS_BUDGET, "--json", ...args],
    { cwd: packageRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );

  let parsed: TxResult;
  try {
    parsed = JSON.parse(output) as TxResult;
  } catch {
    throw new Error(`${label}: could not parse CLI output as JSON:\n${output}`);
  }

  const status = parsed.effects?.status?.status;
  if (status !== "success") {
    throw new Error(`${label} failed: ${JSON.stringify(parsed.effects?.status)}`);
  }
  return parsed;
}

function findCreatedObjectId(changes: ObjectChange[] | undefined, structName: string): string | undefined {
  return changes?.find(
    (change) =>
      change.type === "created" &&
      typeof change.objectType === "string" &&
      change.objectType.endsWith(`::${structName}`),
  )?.objectId;
}

/** `vector<u8>` literal in the shape `sui client ptb` expects for a byte string. */
function byteVector(text: string): string {
  return `vector[${[...Buffer.from(text)].join(",")}]`;
}

function main(): void {
  const deployment = loadDeployment();
  if (!deployment.adminCap) {
    throw new Error("AdminCap missing from deployment file");
  }
  const pkg = deployment.packageId;
  const sender = activeAddress();

  // tx1 — create the shared Microgrid object.
  const createResult = runPtb("create_microgrid", [
    "--move-call",
    `${pkg}::microgrid::create_microgrid`,
    `@${deployment.adminCap}`,
    byteVector(TAIPEI_FIXTURE.name),
    byteVector(TAIPEI_FIXTURE.assetId),
    String(TAIPEI_FIXTURE.powerWatts),
    String(TAIPEI_FIXTURE.hashrate),
    String(TAIPEI_FIXTURE.dividendThreshold),
    String(TAIPEI_FIXTURE.buyoutThreshold),
  ]);

  const microgridId = findCreatedObjectId(createResult.objectChanges, "Microgrid");
  if (!microgridId) {
    throw new Error(`Microgrid object not found: ${JSON.stringify(createResult.objectChanges)}`);
  }

  // tx2 — issue the AgentCap and a full-share dividend credential to the operator.
  const issueResult = runPtb("issue_agent_cap + mint_credential", [
    "--move-call",
    `${pkg}::microgrid::issue_agent_cap`,
    `@${microgridId}`,
    `@${deployment.adminCap}`,
    `@${sender}`,
    "--move-call",
    `${pkg}::microgrid::mint_credential`,
    `@${microgridId}`,
    `@${deployment.adminCap}`,
    `@${sender}`,
    "10000",
  ]);

  const agentCapId = findCreatedObjectId(issueResult.objectChanges, "AgentCap");
  if (!agentCapId) {
    throw new Error(`AgentCap not found: ${JSON.stringify(issueResult.objectChanges)}`);
  }

  // tx3 — arm the demo: fund the treasury (so a dividend has capital to move) and
  // set the human-authorized allowance ONCE, so the agent can later distribute
  // autonomously without an AdminCap in each transaction.
  runPtb("deposit_yield + set_dividend_allowance", [
    "--split-coins",
    "gas",
    `[${SEED_TREASURY_MIST}]`,
    "--assign",
    "seed",
    "--move-call",
    `${pkg}::microgrid::deposit_yield`,
    `@${microgridId}`,
    `@${agentCapId}`,
    "seed.0",
    "--move-call",
    `${pkg}::microgrid::set_dividend_allowance`,
    `@${microgridId}`,
    `@${deployment.adminCap}`,
    String(SEED_DIVIDEND_ALLOWANCE_MIST),
  ]);

  const demoState = {
    network: activeEnv(),
    packageId: pkg,
    adminCap: deployment.adminCap,
    microgridId,
    agentCapId,
    credentialId: findCreatedObjectId(issueResult.objectChanges, "DividendCredential"),
    agentAddress: sender,
    fixture: TAIPEI_FIXTURE,
    seedTreasuryMist: SEED_TREASURY_MIST,
    dividendAllowanceMist: SEED_DIVIDEND_ALLOWANCE_MIST,
    updatedAt: new Date().toISOString(),
  };

  const outPath = join(packageRoot, "deployments", "demo-state.json");
  const scopedOutPath = join(
    packageRoot,
    "deployments",
    activeEnv() === "local" ? "demo-state.localnet.json" : `demo-state.${activeEnv()}.json`,
  );
  const serialized = JSON.stringify(
    demoState,
    (_, value) => (typeof value === "bigint" ? value.toString() : value),
    2,
  );
  writeFileSync(outPath, serialized);
  writeFileSync(scopedOutPath, serialized);
  console.log(serialized);
}

main();
