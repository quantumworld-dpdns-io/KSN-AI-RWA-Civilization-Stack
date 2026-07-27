import { describe, expect, it } from "vitest";
import { evaluatePolicy } from "../policy.js";
import type { MicrogridState } from "../types.js";

const baseState: MicrogridState = {
  objectId: "0x1",
  powerWatts: 8_500_000,
  hashrate: 420_000_000_000_000,
  ksnScore: 20_238_095,
  agencyStage: 1,
  treasuryMist: 0,
  dividendPoolMist: 0,
  dividendThreshold: 50_000_000,
  buyoutThreshold: 100_000_000,
};

describe("evaluatePolicy", () => {
  it("prefers telemetry update when oracle values differ", () => {
    const action = evaluatePolicy({
      state: baseState,
      telemetry: { powerWatts: 9_000_000, hashrate: 420_000_000_000_000 },
      dividendAmountMist: 10_000_000,
      depositAmountMist: 150_000_000,
      allowBuyout: true,
    });

    expect(action.action).toBe("update");
  });

  it("deposits yield when treasury is empty", () => {
    const action = evaluatePolicy({
      state: baseState,
      telemetry: { powerWatts: baseState.powerWatts, hashrate: baseState.hashrate },
      dividendAmountMist: 10_000_000,
      depositAmountMist: 150_000_000,
      allowBuyout: true,
    });

    expect(action.action).toBe("deposit");
  });

  it("executes buyout when treasury threshold is met", () => {
    const action = evaluatePolicy({
      state: { ...baseState, treasuryMist: 120_000_000, agencyStage: 2 },
      telemetry: { powerWatts: baseState.powerWatts, hashrate: baseState.hashrate },
      dividendAmountMist: 10_000_000,
      depositAmountMist: 150_000_000,
      allowBuyout: true,
    });

    expect(action.action).toBe("buyout");
  });
});
