import { loadAgentConfig, truncateAddress } from "./config.js";
import { decideWithLlm } from "./llm.js";
import { filterAllowedAction } from "./policy.js";
import { SuiMicrogridClient } from "./sui-client.js";
import type { AgentAction } from "./types.js";
import { AGENCY_STAGE_LABELS } from "./types.js";

async function runSingleCycle(
  client: SuiMicrogridClient,
): Promise<{ action: AgentAction; digest: string | null }> {
  const config = loadAgentConfig();
  const state = await client.readMicrogridState();
  const telemetry = await client.fetchTelemetry();

  const policyInput = {
    state,
    telemetry,
    dividendAmountMist: config.dividendAmountMist,
    depositAmountMist: config.depositAmountMist,
    allowBuyout: config.allowBuyout,
  };

  const proposed = await decideWithLlm({
    state,
    telemetry,
    policyInput,
    model: config.llmModel,
    openAiApiKey: config.openAiApiKey,
    ollamaBaseUrl: config.ollamaBaseUrl,
  });

  const action = filterAllowedAction(proposed, policyInput);
  client.logSafe(`decision=${action.action} reason=${action.reason}`);

  const digest = await client.executeAction(action, telemetry);
  if (digest) {
    client.logSafe(`executed tx=${digest}`);
    await client.waitForDigest(digest);
  } else {
    client.logSafe("noop cycle");
  }

  return { action, digest };
}

async function runDemoSequence(client: SuiMicrogridClient, maxCycles: number): Promise<void> {
  const seen = new Set<string>();

  for (let cycle = 1; cycle <= maxCycles; cycle += 1) {
    client.logSafe(`--- demo cycle ${cycle}/${maxCycles} ---`);
    const { action, digest } = await runSingleCycle(client);
    if (digest) {
      seen.add(action.action);
    }

    if (action.action === "noop") {
      break;
    }
  }

  const state = await client.readMicrogridState();
  console.log(
    JSON.stringify(
      {
        sceneTrace: [...seen],
        agencyStage: AGENCY_STAGE_LABELS[state.agencyStage] ?? state.agencyStage,
        ksnScore: state.ksnScore,
        treasuryMist: state.treasuryMist,
        dividendPoolMist: state.dividendPoolMist,
      },
      null,
      2,
    ),
  );
}

async function runContinuous(client: SuiMicrogridClient, pollIntervalMs: number): Promise<void> {
  const loop = async (): Promise<void> => {
    try {
      await runSingleCycle(client);
    } catch (error) {
      console.error(error);
    }
    setTimeout(() => {
      void loop();
    }, pollIntervalMs);
  };
  await loop();
}

async function main(): Promise<void> {
  const config = loadAgentConfig();
  const client = new SuiMicrogridClient(config);
  const once = process.argv.includes("--once");
  const demo = process.argv.includes("--demo");
  const maxCycles = Number(process.env.AGENT_DEMO_MAX_CYCLES ?? "8");

  console.log(
    `[agent] starting on ${config.suiRpcUrl} microgrid=${config.microgridId} agent=${truncateAddress(client.agentAddress)}`,
  );

  if (demo) {
    await runDemoSequence(client, maxCycles);
    return;
  }

  if (once) {
    await runSingleCycle(client);
    return;
  }

  await runContinuous(client, config.pollIntervalMs);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
