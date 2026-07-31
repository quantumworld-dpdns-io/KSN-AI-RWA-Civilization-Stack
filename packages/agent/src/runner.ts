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
  // Read chain state and telemetry in parallel — neither reads the other's
  // result (the "fake edge" between them is removed per task-graph guidance).
  const [state, telemetry] = await Promise.all([
    client.readMicrogridState(),
    client.fetchTelemetry(),
  ]);

  // Verifier gate: never act on untrusted oracle data. Fail closed to noop.
  if (!telemetry.trusted && !config.allowUnverifiedTelemetry) {
    const action: AgentAction = {
      action: "noop",
      reason: `Blocked: untrusted telemetry (${telemetry.reason ?? "unknown"})`,
    };
    client.logSafe(`decision=noop reason=${action.reason}`);
    return { action, digest: null };
  }

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

  let action = filterAllowedAction(proposed, policyInput);

  // Human gate: buyout (irreversible ownership) and dividend (capital movement)
  // require the human-held AdminCap on-chain. If the operator has not armed the
  // agent with an AdminCap id, the agent must not attempt them — it holds the
  // decision pending human approval instead of executing.
  if ((action.action === "buyout" || action.action === "dividend") && !config.adminCapId) {
    action = {
      action: "noop",
      reason: `Human gate: ${action.action} requires operator AdminCap approval (SUI_ADMIN_CAP_ID unset)`,
    };
  }

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

/** Mist a given action will spend, for the per-run budget guardrail. */
function actionSpendMist(action: AgentAction, config: ReturnType<typeof loadAgentConfig>): number {
  switch (action.action) {
    case "deposit":
      return action.depositAmountMist ?? config.depositAmountMist;
    case "dividend":
      return action.dividendAmountMist ?? config.dividendAmountMist;
    default:
      return 0;
  }
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
  const config = loadAgentConfig();
  let cycle = 0;
  let spentMist = 0;
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 5;

  const loop = async (): Promise<void> => {
    // Guardrail: bounded number of rounds per run (task-graph loop cap).
    if (cycle >= config.maxCycles) {
      client.logSafe(`stop: reached max cycles (${config.maxCycles}); requires human re-arm`);
      return;
    }
    cycle += 1;

    try {
      const { action } = await runSingleCycle(client);
      consecutiveErrors = 0;

      // Guardrail: bounded cumulative spend per run.
      spentMist += actionSpendMist(action, config);
      if (spentMist >= config.maxSpendMistPerRun) {
        client.logSafe(
          `stop: per-run spend cap reached (${spentMist} >= ${config.maxSpendMistPerRun} mist); requires human re-arm`,
        );
        return;
      }
    } catch (error) {
      consecutiveErrors += 1;
      console.error(error);
      // Guardrail: do not swallow a persistent failure forever.
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        client.logSafe(`stop: ${consecutiveErrors} consecutive errors; requires human intervention`);
        return;
      }
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
