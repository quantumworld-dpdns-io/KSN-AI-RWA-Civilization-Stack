import { computeKsnScore, estimateAutonomyRisk } from "@aks/core";
import type { AgentAction, MicrogridState } from "./types.js";
import { AGENCY_STAGE_LABELS } from "./types.js";

export interface PolicyInput {
  state: MicrogridState;
  telemetry: { powerWatts: number; hashrate: number };
  dividendAmountMist: number;
  depositAmountMist: number;
  allowBuyout: boolean;
}

export function evaluatePolicy(input: PolicyInput): AgentAction {
  const { state, telemetry, dividendAmountMist, depositAmountMist, allowBuyout } = input;
  const ksnScore = computeKsnScore(telemetry.powerWatts, telemetry.hashrate);
  const autonomyRisk = estimateAutonomyRisk({
    id: "policy",
    name: "microgrid",
    assetClass: "MICROGRID_GPU_CLUSTER",
    powerWatts: telemetry.powerWatts,
    hashrate: telemetry.hashrate,
    utilization: 0.71,
    revenuePerComputeUnit: 1.4e-15,
    maintenanceCostRate: 0.09,
    riskScore: 0.22,
    agencyStage:
      state.agencyStage >= 3
        ? "SOVEREIGN_AI_ASSET"
        : state.agencyStage >= 2
          ? "AI_CO_OWNED"
          : "AI_MANAGED",
  });

  const telemetryChanged =
    telemetry.powerWatts !== state.powerWatts || telemetry.hashrate !== state.hashrate;

  if (telemetryChanged) {
    return {
      action: "update",
      reason: `Scene 3: refresh telemetry before treasury actions (S=${ksnScore.toExponential(3)})`,
    };
  }

  if (
    allowBuyout &&
    autonomyRisk < 0.85 &&
    state.agencyStage < 3 &&
    state.treasuryMist >= state.buyoutThreshold
  ) {
    return {
      action: "buyout",
      reason: `Scene 10: treasury ${state.treasuryMist} >= buyout threshold ${state.buyoutThreshold}`,
    };
  }

  if (state.treasuryMist < depositAmountMist && state.agencyStage < 3) {
    return {
      action: "deposit",
      reason: "Scene 6: seed AI treasury with operating surplus for self-financing",
      depositAmountMist,
    };
  }

  if (state.dividendPoolMist > 0) {
    return {
      action: "claim",
      reason: "Credential holder can claim accumulated planetary dividend",
    };
  }

  if (state.ksnScore <= state.dividendThreshold && state.treasuryMist >= dividendAmountMist) {
    return {
      action: "dividend",
      reason: `Scene 12: on-chain KSN score ${state.ksnScore} meets threshold ${state.dividendThreshold}`,
      dividendAmountMist,
    };
  }

  return {
    action: "noop",
    reason: `Hold: stage=${AGENCY_STAGE_LABELS[state.agencyStage] ?? state.agencyStage}, treasury=${state.treasuryMist}`,
  };
}

export function filterAllowedAction(
  proposed: AgentAction,
  input: PolicyInput,
): AgentAction {
  const baseline = evaluatePolicy(input);
  const allowed = new Set<AgentAction["action"]>([baseline.action, "noop", "update"]);

  if (input.state.treasuryMist >= input.depositAmountMist && input.state.agencyStage < 3) {
    allowed.add("deposit");
  }
  if (
    input.allowBuyout &&
    input.state.agencyStage < 3 &&
    input.state.treasuryMist >= input.state.buyoutThreshold
  ) {
    allowed.add("buyout");
  }
  if (
    input.state.ksnScore <= input.state.dividendThreshold &&
    input.state.treasuryMist >= (proposed.dividendAmountMist ?? input.dividendAmountMist)
  ) {
    allowed.add("dividend");
  }
  if (input.state.dividendPoolMist > 0) {
    allowed.add("claim");
  }

  if (!allowed.has(proposed.action)) {
    return {
      action: baseline.action,
      reason: `LLM action ${proposed.action} blocked by policy; fallback to ${baseline.action}`,
    };
  }

  return proposed;
}
