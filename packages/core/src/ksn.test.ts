import { describe, it, expect } from 'vitest';
import { computeKsnScore, estimateKardashevType } from "./ksn";
import { simulateYieldDistribution } from "./yield";
import { SAMPLE_ASSETS } from "./fixtures";

describe('KSN Score Calculations', () => {
  it('should compute KSN score as P/H', () => {
    expect(computeKsnScore(100, 10)).toBe(10);
  });

  it('should estimate Kardashev Type correctly', () => {
    // 1e16 W should approximate Type 1
    expect(estimateKardashevType(1e16)).toBeCloseTo(1, 1);
  });
});

describe('Yield Distribution', () => {
  it('should simulate yield distribution correctly', () => {
    const asset = SAMPLE_ASSETS[0];
    const y = simulateYieldDistribution(asset);
    
    expect(y.grossRevenue).toBeGreaterThan(0);
    expect(y.humanInvestorYield).toBeGreaterThanOrEqual(0);
    expect(y.aiTreasury).toBeGreaterThanOrEqual(0);
  });
});
