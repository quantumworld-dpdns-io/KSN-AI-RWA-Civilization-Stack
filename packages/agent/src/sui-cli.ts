import type { AgentAction, AgentConfig } from "./types.js";

export interface CliCommand {
  command: string;
  args: string[];
}

export function shouldUseCliBackend(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message;
  return (
    message.includes("sui_getNormalizedMoveFunction") ||
    (message.includes("Unexpected status code: 404") && message.includes("normalized")) ||
    message.includes("No metadata found for function")
  );
}

export function buildCliCommand(
  config: AgentConfig,
  action: AgentAction,
  telemetry: { powerWatts: number; hashrate: number },
): CliCommand | null {
  const baseArgs = ["client"];

  switch (action.action) {
    case "update":
      return {
        command: "sui",
        args: [
          ...baseArgs,
          "call",
          "--package",
          config.packageId,
          "--module",
          "microgrid",
          "--function",
          "update_telemetry",
          "--args",
          config.microgridId,
          config.agentCapId,
          String(Math.round(telemetry.powerWatts)),
          String(Math.round(telemetry.hashrate)),
          "--json",
        ],
      };
    case "deposit": {
      const amount = String(action.depositAmountMist ?? config.depositAmountMist);
      return {
        command: "sui",
        args: [
          ...baseArgs,
          "ptb",
          "--split-coins",
          "gas",
          `[${amount}]`,
          "--assign",
          "coin",
          "--move-call",
          `${config.packageId}::microgrid::deposit_yield`,
          `@${config.microgridId}`,
          `@${config.agentCapId}`,
          "coin.0",
          "--summary",
        ],
      };
    }
    case "buyout":
      if (!config.adminCapId) {
        throw new Error("execute_buyout requires operator AdminCap (SUI_ADMIN_CAP_ID unset)");
      }
      return {
        command: "sui",
        args: [
          ...baseArgs,
          "call",
          "--package",
          config.packageId,
          "--module",
          "microgrid",
          "--function",
          "execute_buyout",
          "--args",
          config.microgridId,
          config.agentCapId,
          config.adminCapId,
          "--json",
        ],
      };
    case "dividend":
      if (!config.adminCapId) {
        throw new Error("distribute_planetary_dividend requires operator AdminCap (SUI_ADMIN_CAP_ID unset)");
      }
      return {
        command: "sui",
        args: [
          ...baseArgs,
          "call",
          "--package",
          config.packageId,
          "--module",
          "microgrid",
          "--function",
          "distribute_planetary_dividend",
          "--args",
          config.microgridId,
          config.agentCapId,
          config.adminCapId,
          String(action.dividendAmountMist ?? config.dividendAmountMist),
          "--json",
        ],
      };
    case "claim":
      if (!config.credentialId) {
        throw new Error("Missing credential ID for claim action");
      }
      return {
        command: "sui",
        args: [
          ...baseArgs,
          "call",
          "--package",
          config.packageId,
          "--module",
          "microgrid",
          "--function",
          "claim_dividend",
          "--args",
          config.microgridId,
          config.credentialId,
          "--json",
        ],
      };
    case "noop":
      return null;
  }
}

export function parseCliDigest(output: string): string {
  try {
    const parsed = JSON.parse(output) as {
      digest?: string;
      effects?: { transactionDigest?: string; status?: { status?: string } };
    };
    const status = parsed.effects?.status?.status;
    if (status && status !== "success") {
      throw new Error(`CLI transaction failed with status=${status}`);
    }
    const digest = parsed.digest ?? parsed.effects?.transactionDigest;
    if (digest) {
      return digest;
    }
  } catch {
    // Some `sui client ptb` modes ignore --json and print a text summary.
  }

  const statusMatch = output.match(/Status:\s+([A-Za-z]+)/);
  if (statusMatch && statusMatch[1].toLowerCase() !== "success") {
    throw new Error(`CLI transaction failed with status=${statusMatch[1]}`);
  }

  const digestMatch = output.match(/Digest:\s+([A-Za-z0-9]+)/);
  if (digestMatch) {
    return digestMatch[1];
  }

  throw new Error(`Unable to parse transaction digest from CLI output: ${output}`);
}
