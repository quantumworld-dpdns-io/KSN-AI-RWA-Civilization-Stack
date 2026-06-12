import { describe, it, expect } from "vitest";
import { computeKsnScore, estimateKardashevType, snapshotAsset } from "./ksn";
import { simulateYieldDistribution } from "./yield";
import { SAMPLE_ASSETS } from "./fixtures";

describe("KSN Score Calculations", () => {
  it("computes KSN score as P/H", () => {
    expect(computeKsnScore(100, 10)).toBe(10);
  });

  it("rejects invalid inputs", () => {
    expect(() => computeKsnScore(-1, 10)).toThrow(/non-negative/);
    expect(() => computeKsnScore(1, 0)).toThrow(/positive/);
    expect(() => computeKsnScore(Number.POSITIVE_INFINITY, 10)).toThrow(/finite/);
    expect(() => estimateKardashevType(0)).toThrow(/positive/);
    expect(() => estimateKardashevType(Number.NaN)).toThrow(/positive/);
  });

  it("estimates Kardashev type correctly", () => {
    // 1e16 W should approximate Type 1
    expect(estimateKardashevType(1e16)).toBeCloseTo(1, 1);
  });

  it("snapshots sample assets with finite values", () => {
    const snapshot = snapshotAsset(SAMPLE_ASSETS[0]);
    expect(snapshot.assetId).toBe(SAMPLE_ASSETS[0].id);
    expect(Number.isFinite(snapshot.ksnScore)).toBe(true);
    expect(Number.isFinite(snapshot.kardashevType)).toBe(true);
    expect(snapshot.stageLabel).toContain("Type");
  });
});

describe("Yield Distribution", () => {
  it("simulates yield distribution correctly", () => {
    const asset = SAMPLE_ASSETS[0];
    const y = simulateYieldDistribution(asset);

    expect(y.grossRevenue).toBeGreaterThan(0);
    expect(y.humanInvestorYield).toBeGreaterThanOrEqual(0);
    expect(y.aiTreasury).toBeGreaterThanOrEqual(0);
    const total =
      y.maintenanceReserve +
      y.insurancePool +
      y.humanInvestorYield +
      y.aiTreasury +
      y.planetaryDividend +
      y.retainedForExpansion;
    expect(total).toBeCloseTo(y.grossRevenue, 10);
  });

  it("handles zero utilization without producing revenue", () => {
    const asset = { ...SAMPLE_ASSETS[0], utilization: 0 };
    const y = simulateYieldDistribution(asset);
    expect(y.grossRevenue).toBe(0);
    expect(y.humanInvestorYield).toBe(0);
    expect(y.aiTreasury).toBe(0);
  });
});
