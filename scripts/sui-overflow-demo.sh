#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> KSN Sui Overflow demo (Agentic Microgrid MVP)"

if ! command -v sui >/dev/null 2>&1; then
  echo "ERROR: sui CLI not found. Install: brew install sui"
  exit 1
fi

SUI_ENV="${SUI_ENV:-local}"
echo "==> Using Sui environment: ${SUI_ENV}"

if [[ "${SUI_ENV}" == "local" || "${SUI_ENV}" == "localnet" ]]; then
  if curl -sf "http://127.0.0.1:9000" >/dev/null 2>&1; then
    echo "==> Local Sui validator already running"
  else
    echo "==> Starting sui local validator in background..."
    rm -f "${ROOT}/packages/sui-contracts/Pub.local.toml"
    sui start --with-faucet --force-regenesis >/tmp/ksn-sui-localnet.log 2>&1 &
    SUI_PID=$!
    trap 'kill ${SUI_PID} >/dev/null 2>&1 || true' EXIT

    for _ in $(seq 1 30); do
      if curl -sf "http://127.0.0.1:9000" >/dev/null 2>&1; then
        break
      fi
      sleep 2
    done
  fi
  sui client switch --env local >/dev/null 2>&1 || true
fi

ACTIVE_ADDR="$(sui client active-address)"
echo "==> Active address: ${ACTIVE_ADDR}"

echo "==> Requesting test SUI from faucet"
if [[ "${SUI_ENV}" == "local" || "${SUI_ENV}" == "localnet" ]]; then
  curl -sf "http://127.0.0.1:9123/gas" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"FixedAmountRequest\":{\"recipient\":\"${ACTIVE_ADDR}\"}}" >/dev/null || true
else
  sui client faucet >/dev/null 2>&1 || true
fi
sleep 3

echo "==> Building Move package"
pnpm --filter @aks/sui-contracts build

echo "==> Publishing package"
pnpm --filter @aks/sui-contracts exec tsx scripts/publish.ts

echo "==> Seeding microgrid, AgentCap, credential"
pnpm --filter @aks/sui-contracts exec tsx scripts/setup-demo.ts

echo "==> Running agent demo sequence (Scene 3→6→10→12 until settle)"
pnpm --filter @aks/agent start:demo

echo "==> Verifying on-chain microgrid state"
node --input-type=module <<'EOF'
import { readFileSync } from "node:fs";
import { SuiClient } from "@mysten/sui/client";

const demo = JSON.parse(
  readFileSync("packages/sui-contracts/deployments/demo-state.json", "utf8"),
);
const client = new SuiClient({ url: process.env.SUI_RPC_URL ?? "http://127.0.0.1:9000" });
const object = await client.getObject({
  id: demo.microgridId,
  options: { showContent: true },
});

if (object.data?.content?.dataType !== "moveObject") {
  throw new Error(`Microgrid missing: ${JSON.stringify(object)}`);
}

const fields = object.data.content.fields;
const nested = (fields?.fields ?? fields) ?? {};
const balanceValue = (field) =>
  field?.fields?.value ?? field?.value ?? field ?? "0";

console.log(
  JSON.stringify(
    {
      agency_stage: nested.agency_stage,
      ksn_score: nested.ksn_score,
      treasury_balance: balanceValue(nested.treasury_balance),
      dividend_pool: balanceValue(nested.dividend_pool),
    },
    null,
    2,
  ),
);
EOF

echo "==> Demo complete. See packages/sui-contracts/deployments/demo-state.json"
