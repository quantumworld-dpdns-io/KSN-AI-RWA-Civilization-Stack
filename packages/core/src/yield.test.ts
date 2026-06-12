import { describe, it, expect } from "vitest";
import { DEFAULT_POLICY, simulateYieldDistribution, validatePolicy } from "./yield";
import { SAMPLE_ASSETS } from "./fixtures";

describe("Yield Calculations", () => {
  it("validates policy correctly", () => {
    expect(() => validatePolicy(DEFAULT_POLICY)).not.toThrow();

    const badPolicy = { ...DEFAULT_POLICY, maintenanceReservePct: 0.9 };
    expect(() => validatePolicy(badPolicy)).toThrow(/policy reserves too much value/);
    expect(() => validatePolicy({ ...DEFAULT_POLICY, insurancePct: -0.1 })).toThrow(/between 0 and 1/);
  });

  it("calculates non-negative yields", () => {
    const asset = SAMPLE_ASSETS[0];
    const y = simulateYieldDistribution(asset);
    expect(y.humanInvestorYield).toBeGreaterThanOrEqual(0);
    expect(y.maintenanceReserve).toBeGreaterThanOrEqual(0);
    expect(y.insurancePool).toBeGreaterThanOrEqual(0);
    expect(y.retainedForExpansion).toBeGreaterThanOrEqual(0);
  });

  it("keeps the split bounded by gross revenue", () => {
    const asset = SAMPLE_ASSETS[1];
    const y = simulateYieldDistribution(asset);
    const total =
      y.maintenanceReserve +
      y.insurancePool +
      y.humanInvestorYield +
      y.aiTreasury +
      y.planetaryDividend +
      y.retainedForExpansion;

    expect(total).toBeCloseTo(y.grossRevenue, 8);
  });
});
