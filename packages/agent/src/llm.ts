import OpenAI from "openai";
import { AgentActionSchema, type AgentAction, type MicrogridState } from "./types.js";
import { AGENCY_STAGE_LABELS } from "./types.js";
import { evaluatePolicy, type PolicyInput } from "./policy.js";

export interface LlmDecisionInput {
  state: MicrogridState;
  telemetry: { powerWatts: number; hashrate: number };
  policyInput: PolicyInput;
  model: string;
  openAiApiKey?: string;
  ollamaBaseUrl?: string;
}

function buildPrompt(input: LlmDecisionInput): string {
  const baseline = evaluatePolicy(input.policyInput);
  return [
    "You are an autonomous microgrid agent for KSN Scene 3/6/10/12.",
    "Return JSON only: { action, reason, dividendAmountMist?, depositAmountMist? }",
    "Allowed actions: noop, update, deposit, dividend, buyout, claim",
    `On-chain state: ${JSON.stringify({
      agencyStage: AGENCY_STAGE_LABELS[input.state.agencyStage] ?? input.state.agencyStage,
      powerWatts: input.state.powerWatts,
      hashrate: input.state.hashrate,
      ksnScore: input.state.ksnScore,
      treasuryMist: input.state.treasuryMist,
      dividendPoolMist: input.state.dividendPoolMist,
      dividendThreshold: input.state.dividendThreshold,
      buyoutThreshold: input.state.buyoutThreshold,
    })}`,
    `Telemetry: ${JSON.stringify(input.telemetry)}`,
    `Deterministic recommendation: ${JSON.stringify(baseline)}`,
  ].join("\n");
}

export async function decideWithLlm(input: LlmDecisionInput): Promise<AgentAction> {
  const baseline = evaluatePolicy(input.policyInput);

  if (!input.openAiApiKey && !input.ollamaBaseUrl) {
    return baseline;
  }

  const client = new OpenAI({
    apiKey: input.openAiApiKey ?? "ollama",
    baseURL: input.ollamaBaseUrl ? `${input.ollamaBaseUrl.replace(/\/$/, "")}/v1` : undefined,
  });

  try {
    const response = await client.chat.completions.create({
      model: input.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You coordinate a Sui microgrid. Prefer the deterministic recommendation unless you have a concise operational reason not to.",
        },
        { role: "user", content: buildPrompt(input) },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return baseline;
    }

    const parsed = AgentActionSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      return baseline;
    }

    return parsed.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown LLM error";
    return {
      action: baseline.action,
      reason: `LLM unavailable (${message}); using deterministic policy`,
    };
  }
}
