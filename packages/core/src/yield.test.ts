import { describe, it, expect } from 'vitest';
import { simulateYieldDistribution, validatePolicy, DEFAULT_POLICY } from './yield';
import { SAMPLE_ASSETS } from './fixtures';

describe('Yield Calculations', () => {
  it('should validate policy correctly', () => {
    expect(() => validatePolicy(DEFAULT_POLICY)).not.toThrow();
    
    const badPolicy = { ...DEFAULT_POLICY, maintenanceReservePct: 0.9 };
    expect(() => validatePolicy(badPolicy)).toThrow(/policy reserves too much value/);
  });

  it('should calculate non-negative yields', () => {
    const asset = SAMPLE_ASSETS[0];
    const y = simulateYieldDistribution(asset);
    expect(y.humanInvestorYield).toBeGreaterThanOrEqual(0);
  });
});
