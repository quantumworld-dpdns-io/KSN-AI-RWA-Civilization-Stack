#!/usr/bin/env node
// Regenerates the committed web Sui deployment
// (apps/web/src/generated/sui.testnet.json) from the Sui deployment artifacts,
// so the production web read stays in sync after (re)publishing to testnet.
//
// Usage: node scripts/emit-web-sui-deployment.mjs [network]   (default: testnet)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const network = process.argv[2] ?? "testnet";

const GRAPHQL_BY_NETWORK = {
  testnet: "https://graphql.testnet.sui.io/graphql",
  mainnet: "https://graphql.mainnet.sui.io/graphql",
  devnet: "https://graphql.devnet.sui.io/graphql",
};
const EXPLORER_BY_NETWORK = {
  testnet: "https://suiscan.xyz/testnet",
  mainnet: "https://suiscan.xyz/mainnet",
  devnet: "https://suiscan.xyz/devnet",
};

const demoStatePath = join(
  repoRoot,
  "packages/sui-contracts/deployments",
  `demo-state.${network}.json`,
);
if (!existsSync(demoStatePath)) {
  console.error(`✖ ${demoStatePath} not found. Publish + setup the demo to ${network} first.`);
  process.exit(1);
}

const demo = JSON.parse(readFileSync(demoStatePath, "utf8"));
const graphqlUrl = GRAPHQL_BY_NETWORK[network] ?? GRAPHQL_BY_NETWORK.testnet;

// The wallet needs the shared object's initialSharedVersion to build a PTB
// without asking the wallet to resolve the object over the deprecated public
// JSON-RPC (a common cause of execute failures). Read it from GraphQL rather
// than relying on it being hand-maintained in the committed JSON.
async function readInitialSharedVersion(objectId) {
  const query =
    "query($id:SuiAddress!){ object(address:$id){ asMoveObject { hasPublicTransfer } owner { __typename ... on Shared { initialSharedVersion } } } }";
  try {
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { id: objectId } }),
    });
    if (!response.ok) {
      throw new Error(`GraphQL responded ${response.status}`);
    }
    const payload = await response.json();
    if (payload.errors?.length) {
      throw new Error(payload.errors[0]?.message ?? "unknown GraphQL error");
    }
    const version = payload.data?.object?.owner?.initialSharedVersion;
    if (version == null) {
      throw new Error("object is not shared, or owner.initialSharedVersion is absent");
    }
    return Number(version);
  } catch (error) {
    console.warn(
      `⚠ Could not read initialSharedVersion for ${objectId}: ${error.message}\n` +
        "  Wallet transactions will fall back to letting the wallet resolve the object.",
    );
    return undefined;
  }
}

const microgridInitialSharedVersion = await readInitialSharedVersion(demo.microgridId);

const out = {
  network,
  graphqlUrl,
  packageId: demo.packageId,
  microgridId: demo.microgridId,
  ...(microgridInitialSharedVersion == null ? {} : { microgridInitialSharedVersion }),
  // The AgentCap the server-side agent presents to call
  // `distribute_planetary_dividend_auto`. Public object id, not a secret — the
  // capability is only usable by the address that holds it.
  agentCapId: demo.agentCapId,
  assetId: demo.fixture?.assetId ?? "type-07-taipei-microgrid-gpu",
  publishedAt: demo.updatedAt ?? new Date().toISOString(),
  explorer: EXPLORER_BY_NETWORK[network] ?? EXPLORER_BY_NETWORK.testnet,
};

// Output filename tracks the network, so emitting devnet never clobbers testnet.
const outPath = join(repoRoot, "apps/web/src/generated", `sui.${network}.json`);
writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
console.log(`✓ Wrote ${outPath}`);
console.log(JSON.stringify(out, null, 2));
