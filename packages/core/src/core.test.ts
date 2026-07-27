import { describe, expect, it } from "vitest";
import { computeKsnScore, estimateKardashevType, simulateYieldDistribution } from "./index";
import { SAMPLE_ASSETS } from "./fixtures.ts";

describe("KSN core model", () => {
  it("computes energy per compute unit", () => {
    expect(computeKsnScore(100, 10)).toBe(10);
  });

  it("approximates a Type 1 civilization at 1e16 watts", () => {
    expect(estimateKardashevType(1e16)).toBeCloseTo(1, 9);
  });

  it("distributes positive revenue without a negative human yield", () => {
    const distribution = simulateYieldDistribution(SAMPLE_ASSETS[0]);
    expect(distribution.grossRevenue).toBeGreaterThan(0);
    expect(distribution.humanInvestorYield).toBeGreaterThanOrEqual(0);
  });

  it("fixtures include the complete oracle risk and sustainability metadata", () => {
    for (const asset of SAMPLE_ASSETS) {
      expect(asset.energySource).toBeDefined();
      expect(asset.region).toBeDefined();
      expect(asset.complianceStatus).toBeDefined();
      expect(asset.carbonIntensityKgCo2ePerKwh).toBeGreaterThanOrEqual(0);
      expect(asset.geopoliticalRiskScore).toBeGreaterThanOrEqual(0);
      expect(asset.legalRiskScore).toBeGreaterThanOrEqual(0);
    }
  });
});
