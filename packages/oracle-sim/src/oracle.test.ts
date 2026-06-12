import { describe, expect, it } from "vitest";
import { getAssetTelemetry, listTelemetry } from "./telemetry";

describe("Oracle simulator", () => {
  it("returns telemetry for known assets", () => {
    const telemetry = getAssetTelemetry("type-07-taipei-microgrid-gpu");
    expect(telemetry).not.toBeNull();
    expect(telemetry?.ksn.ksnScore).toBeGreaterThan(0);
    expect(telemetry?.oracleConfidence).toBeGreaterThanOrEqual(0);
    expect(telemetry?.oracleConfidence).toBeLessThanOrEqual(1);
    expect(telemetry?.telemetrySignature).toMatch(/^mock-signature-/);
  });

  it("returns null for unknown assets", () => {
    expect(getAssetTelemetry("missing-asset")).toBeNull();
  });

  it("lists telemetry for every sample asset", () => {
    expect(listTelemetry()).toHaveLength(3);
  });
});
