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
const out = {
  network,
  graphqlUrl: GRAPHQL_BY_NETWORK[network] ?? GRAPHQL_BY_NETWORK.testnet,
  packageId: demo.packageId,
  microgridId: demo.microgridId,
  assetId: demo.fixture?.assetId ?? "type-07-taipei-microgrid-gpu",
  publishedAt: demo.updatedAt ?? new Date().toISOString(),
  explorer: EXPLORER_BY_NETWORK[network] ?? EXPLORER_BY_NETWORK.testnet,
};

const outPath = join(repoRoot, "apps/web/src/generated/sui.testnet.json");
writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
console.log(`✓ Wrote ${outPath}`);
console.log(JSON.stringify(out, null, 2));
