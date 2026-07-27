import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AgentConfig, DemoDeployment } from "./types.js";

function readDemoDeployment(): DemoDeployment | null {
  const path = join(process.cwd(), "packages/sui-contracts/deployments/demo-state.json");
  try {
    return JSON.parse(readFileSync(path, "utf8")) as DemoDeployment;
  } catch {
    const repoPath = join(process.cwd(), "../../packages/sui-contracts/deployments/demo-state.json");
    try {
      return JSON.parse(readFileSync(repoPath, "utf8")) as DemoDeployment;
    } catch {
      return null;
    }
  }
}

export function loadAgentConfig(): AgentConfig {
  const demo = readDemoDeployment();
  const packageId = process.env.SUI_PACKAGE_ID ?? demo?.packageId;
  const microgridId = process.env.SUI_MICROGRID_ID ?? demo?.microgridId;
  const agentCapId = process.env.SUI_AGENT_CAP_ID ?? demo?.agentCapId;

  if (!packageId || !microgridId || !agentCapId) {
    throw new Error(
      "Missing Sui deployment config. Run setup-demo or set SUI_PACKAGE_ID, SUI_MICROGRID_ID, SUI_AGENT_CAP_ID.",
    );
  }

  return {
    suiRpcUrl: process.env.SUI_RPC_URL ?? "http://127.0.0.1:9000",
    packageId,
    microgridId,
    agentCapId,
    credentialId: process.env.SUI_CREDENTIAL_ID ?? demo?.credentialId,
    privateKeyHex: process.env.SUI_AGENT_PRIVATE_KEY,
    oracleUrl: process.env.ORACLE_URL ?? "http://127.0.0.1:8787",
    assetId: process.env.KSN_ASSET_ID ?? "type-07-taipei-microgrid-gpu",
    pollIntervalMs: Number(process.env.AGENT_POLL_MS ?? "5000"),
    dividendAmountMist: Number(process.env.AGENT_DIVIDEND_MIST ?? "10000000"),
    depositAmountMist: Number(process.env.AGENT_DEPOSIT_MIST ?? "150000000"),
    allowBuyout: process.env.AGENT_ALLOW_BUYOUT !== "false",
    openAiApiKey: process.env.OPENAI_API_KEY,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
    llmModel: process.env.AGENT_LLM_MODEL ?? "gpt-4o-mini",
  };
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
