import { describe, expect, it } from "vitest";
import { buildCliCommand, parseCliDigest, shouldUseCliBackend } from "../sui-cli.js";
import type { AgentConfig } from "../types.js";

const baseConfig: AgentConfig = {
  suiRpcUrl: "https://fullnode.testnet.sui.io:443",
  suiTxBackend: "auto",
  packageId: "0xpackage",
  microgridId: "0xmicrogrid",
  agentCapId: "0xagentcap",
  credentialId: "0xcredential",
  assetId: "type-07-taipei-microgrid-gpu",
  pollIntervalMs: 5000,
  dividendAmountMist: 10_000_000,
  depositAmountMist: 150_000_000,
  allowBuyout: true,
  llmModel: "gpt-4o-mini",
  telemetryMaxAgeMs: 120_000,
  allowUnverifiedTelemetry: false,
  maxCycles: 1000,
  maxSpendMistPerRun: 1_000_000_000,
};

describe("shouldUseCliBackend", () => {
  it("detects normalized metadata 404 failures", () => {
    const error = new Error(
      "SuiHTTPStatusError: Unexpected status code: 404 for sui_getNormalizedMoveFunction",
    );

    expect(shouldUseCliBackend(error)).toBe(true);
  });

  it("ignores unrelated execution errors", () => {
    expect(shouldUseCliBackend(new Error("insufficient gas"))).toBe(false);
  });
});

describe("buildCliCommand", () => {
  it("builds a direct CLI move call for update", () => {
    const command = buildCliCommand(
      baseConfig,
      { action: "update", reason: "refresh telemetry" },
      { powerWatts: 8_500_000, hashrate: 420_000_000_000_000 },
    );

    expect(command).toEqual({
      command: "sui",
      args: [
        "client",
        "call",
        "--package",
        "0xpackage",
        "--module",
        "microgrid",
        "--function",
        "update_telemetry",
        "--args",
        "0xmicrogrid",
        "0xagentcap",
        "8500000",
        "420000000000000",
        "--json",
      ],
    });
  });

  it("builds a PTB command for deposit", () => {
    const command = buildCliCommand(
      baseConfig,
      { action: "deposit", reason: "seed treasury", depositAmountMist: 150_000_000 },
      { powerWatts: 8_500_000, hashrate: 420_000_000_000_000 },
    );

    expect(command).toEqual({
      command: "sui",
      args: [
        "client",
        "ptb",
        "--split-coins",
        "gas",
        "[150000000]",
        "--assign",
        "coin",
        "--move-call",
        "0xpackage::microgrid::deposit_yield",
        "@0xmicrogrid",
        "@0xagentcap",
        "coin.0",
        "--summary",
      ],
    });
  });
});

describe("parseCliDigest", () => {
  it("reads digest from JSON output", () => {
    const output = JSON.stringify({
      effects: {
        status: { status: "success" },
        transactionDigest: "abc123",
      },
    });

    expect(parseCliDigest(output)).toBe("abc123");
  });

  it("reads digest from PTB summary output", () => {
    const output = "Digest: GV7NNy3YTANpVGYyLyRvDGWbfAqo18U8EuqCaKRqHcbJ\nStatus: Success";

    expect(parseCliDigest(output)).toBe("GV7NNy3YTANpVGYyLyRvDGWbfAqo18U8EuqCaKRqHcbJ");
  });
});
