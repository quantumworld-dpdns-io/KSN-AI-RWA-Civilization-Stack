import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { loadActiveKeypair } from "./keypair.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, "..");

const TAIPEI_FIXTURE = {
  name: "Type 0.7 Taipei Microgrid GPU Cluster",
  assetId: "type-07-taipei-microgrid-gpu",
  // Seed slightly below oracle/fixture so the first agent cycle shows Scene 3 update_telemetry.
  powerWatts: 8_000_000n,
  hashrate: 420_000_000_000_000n,
  dividendThreshold: 30_000_000_000n,
  buyoutThreshold: 100_000_000n,
};

function loadDeployment(): { packageId: string; adminCap?: string } {
  const path = join(packageRoot, "deployments", "localnet.json");
  return JSON.parse(readFileSync(path, "utf8")) as { packageId: string; adminCap?: string };
}

function findCreatedObjectId(
  objectChanges: Array<{ type?: string; objectType?: string; objectId?: string }> | undefined,
  structName: string,
): string | undefined {
  return objectChanges?.find(
    (change) =>
      change.type === "created" &&
      typeof change.objectType === "string" &&
      change.objectType.endsWith(`::${structName}`),
  )?.objectId;
}

async function main(): Promise<void> {
  const deployment = loadDeployment();
  if (!deployment.adminCap) {
    throw new Error("AdminCap missing from deployment file");
  }

  const client = new SuiClient({
    url: process.env.SUI_RPC_URL ?? "http://127.0.0.1:9000",
  });
  const keypair = loadActiveKeypair();
  const sender = keypair.getPublicKey().toSuiAddress();

  const setupTx = new Transaction();
  setupTx.moveCall({
    target: `${deployment.packageId}::microgrid::create_microgrid`,
    arguments: [
      setupTx.object(deployment.adminCap),
      setupTx.pure.vector("u8", Buffer.from(TAIPEI_FIXTURE.name)),
      setupTx.pure.vector("u8", Buffer.from(TAIPEI_FIXTURE.assetId)),
      setupTx.pure.u64(TAIPEI_FIXTURE.powerWatts),
      setupTx.pure.u64(TAIPEI_FIXTURE.hashrate),
      setupTx.pure.u64(TAIPEI_FIXTURE.dividendThreshold),
      setupTx.pure.u64(TAIPEI_FIXTURE.buyoutThreshold),
    ],
  });

  const createResult = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: setupTx,
    options: { showObjectChanges: true, showEffects: true },
  });

  if (createResult.effects?.status?.status !== "success") {
    throw new Error(`create_microgrid failed: ${JSON.stringify(createResult.effects?.status)}`);
  }

  const microgridId = findCreatedObjectId(createResult.objectChanges, "Microgrid");
  if (!microgridId) {
    throw new Error(`Microgrid object not found: ${JSON.stringify(createResult.objectChanges)}`);
  }

  await client.waitForTransaction({ digest: createResult.digest });

  const issueTx = new Transaction();
  issueTx.moveCall({
    target: `${deployment.packageId}::microgrid::issue_agent_cap`,
    arguments: [
      issueTx.object(microgridId),
      issueTx.object(deployment.adminCap),
      issueTx.pure.address(sender),
    ],
  });
  issueTx.moveCall({
    target: `${deployment.packageId}::microgrid::mint_credential`,
    arguments: [
      issueTx.object(microgridId),
      issueTx.object(deployment.adminCap),
      issueTx.pure.address(sender),
      issueTx.pure.u64(10_000n),
    ],
  });

  const issueResult = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: issueTx,
    options: { showObjectChanges: true, showEffects: true },
  });

  if (issueResult.effects?.status?.status !== "success") {
    throw new Error(`issue/mint failed: ${JSON.stringify(issueResult.effects?.status)}`);
  }

  const demoState = {
    packageId: deployment.packageId,
    adminCap: deployment.adminCap,
    microgridId,
    agentCapId: findCreatedObjectId(issueResult.objectChanges, "AgentCap"),
    credentialId: findCreatedObjectId(issueResult.objectChanges, "DividendCredential"),
    agentAddress: sender,
    fixture: TAIPEI_FIXTURE,
    updatedAt: new Date().toISOString(),
  };

  const outPath = join(packageRoot, "deployments", "demo-state.json");
  writeFileSync(
    outPath,
    JSON.stringify(demoState, (_, value) => (typeof value === "bigint" ? value.toString() : value), 2),
  );
  console.log(JSON.stringify(demoState, (_, value) => (typeof value === "bigint" ? value.toString() : value), 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
