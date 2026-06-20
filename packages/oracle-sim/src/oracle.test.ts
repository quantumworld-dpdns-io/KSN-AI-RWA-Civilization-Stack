import { describe, expect, it } from "vitest";
import { buildApp } from "./server";
import type { TelemetryStore } from "./store";
import { getAssetTelemetry, verifyTelemetrySignature, type AssetTelemetry } from "./telemetry";

class MemoryTelemetryStore implements TelemetryStore {
  currentById = new Map<string, AssetTelemetry>();
  historyById = new Map<string, AssetTelemetry[]>();

  async ping() { return true; }
  async current(assetId: string) { return this.currentById.get(assetId) ?? null; }
  async history(assetId: string, limit: number) { return (this.historyById.get(assetId) ?? []).slice(-limit).reverse(); }
  async save(snapshot: AssetTelemetry) {
    this.currentById.set(snapshot.asset.id, snapshot);
    this.historyById.set(snapshot.asset.id, [...(this.historyById.get(snapshot.asset.id) ?? []), snapshot]);
  }
}

describe("oracle telemetry", () => {
  it("includes every signal promised by the README and a valid signature", () => {
    const telemetry = getAssetTelemetry("type-07-taipei-microgrid-gpu");
    expect(telemetry).not.toBeNull();
    expect(telemetry?.asset.powerWatts).toBeGreaterThan(0);
    expect(telemetry?.asset.hashrate).toBeGreaterThan(0);
    expect(telemetry?.asset.utilization).toBeGreaterThan(0);
    expect(telemetry?.signals.maintenanceCostRate).toBeGreaterThan(0);
    expect(telemetry?.signals.carbonIntensityKgCo2ePerKwh).toBeGreaterThanOrEqual(0);
    expect(telemetry?.signals.geopoliticalRiskScore).toBeGreaterThanOrEqual(0);
    expect(telemetry?.signals.legalRiskScore).toBeGreaterThanOrEqual(0);
    expect(telemetry?.agency.operatingPolicy.dynamicPriceMultiplier).toBeGreaterThanOrEqual(1);
    expect(telemetry?.agency.operatingPolicy.reserveMaintenanceCapital).toBe(true);
    expect(telemetry?.agency.safetyControls.externalExecutionEnabled).toBe(false);
    expect(telemetry?.agency.safetyControls.killSwitchAvailable).toBe(true);
    expect(verifyTelemetrySignature(telemetry!)).toBe(true);
    const tampered = structuredClone(telemetry!);
    tampered.asset.powerWatts += 1;
    expect(verifyTelemetrySignature(tampered)).toBe(false);
  });

  it("serves capabilities, cached telemetry, refreshes, and audit history", async () => {
    const store = new MemoryTelemetryStore();
    const app = buildApp({ store, logger: false });

    const capabilities = await app.inject({ method: "GET", url: "/capabilities" });
    expect(capabilities.statusCode).toBe(200);
    expect(capabilities.json().telemetry).toContain("carbon");

    const first = await app.inject({ method: "GET", url: "/telemetry/type-07-taipei-microgrid-gpu" });
    expect(first.statusCode).toBe(200);
    expect(store.historyById.get("type-07-taipei-microgrid-gpu")).toHaveLength(1);

    const refresh = await app.inject({ method: "POST", url: "/telemetry/type-07-taipei-microgrid-gpu/refresh" });
    expect(refresh.statusCode).toBe(201);

    const history = await app.inject({ method: "GET", url: "/telemetry/type-07-taipei-microgrid-gpu/history?limit=10" });
    expect(history.statusCode).toBe(200);
    expect(history.json().count).toBe(2);
    await app.close();
  });

  it("runs the full core model for custom simulations", async () => {
    const app = buildApp({ store: new MemoryTelemetryStore(), logger: false });
    const response = await app.inject({
      method: "POST",
      url: "/simulate",
      payload: { powerWatts: 1_000_000, hashrate: 1_000_000_000_000, utilization: 0.8 }
    });
    const result = response.json();
    expect(response.statusCode).toBe(200);
    expect(result.ksn.ksnScore).toBe(0.000001);
    expect(result.yieldDistribution).toBeDefined();
    expect(result.autonomyRisk).toBeGreaterThanOrEqual(0);
    expect(result.signatureValid).toBe(true);
    await app.close();
  });

  it("returns validation and not-found errors without leaking internals", async () => {
    const app = buildApp({ store: new MemoryTelemetryStore(), logger: false });
    const invalid = await app.inject({ method: "POST", url: "/simulate", payload: { powerWatts: -1, hashrate: 0 } });
    const missing = await app.inject({ method: "GET", url: "/telemetry/not-real" });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json().error).toBe("validation_error");
    expect(missing.statusCode).toBe(404);
    await app.close();
  });
});
