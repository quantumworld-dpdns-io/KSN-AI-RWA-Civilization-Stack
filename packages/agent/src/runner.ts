import { loadAgentConfig, truncateAddress } from "./config.js";
import { decideWithLlm } from "./llm.js";
import { evaluatePolicy, filterAllowedAction } from "./policy.js";
import { SuiMicrogridClient } from "./sui-client.js";

async function runCycle(client: SuiMicrogridClient, once: boolean): Promise<void> {
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
  } else {
    client.logSafe("noop cycle");
  }

  if (!once) {
    setTimeout(() => {
      runCycle(client, false).catch((error) => {
        console.error(error);
      });
    }, config.pollIntervalMs);
  }
}

async function main(): Promise<void> {
  const config = loadAgentConfig();
  const client = new SuiMicrogridClient(config);
  const once = process.argv.includes("--once");

  console.log(
    `[agent] starting on ${config.suiRpcUrl} microgrid=${config.microgridId} agent=${truncateAddress(client.agentAddress)}`,
  );

  await runCycle(client, once);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
