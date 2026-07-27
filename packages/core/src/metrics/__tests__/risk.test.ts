import { describe, it, expect } from 'vitest';
import { calculateRiskMetrics } from '../risk';

describe('Risk Metrics', () => {
  it('should calculate risk scores correctly', () => {
    const risk = calculateRiskMetrics(0.99, 0.1, 0.95, 2, 50);
    expect(risk.operationalRisk).toBeCloseTo(0.01, 2);
    expect(risk.marketRisk).toBe(0.1);
    expect(risk.regulatoryRisk).toBeCloseTo(0.05, 2);
  });

  it('should cap scores at 1', () => {
    const risk = calculateRiskMetrics(0, 2, 0, 20, 2000);
    expect(risk.operationalRisk).toBe(1);
    expect(risk.marketRisk).toBe(1);
    expect(risk.technicalRisk).toBe(1);
    expect(risk.environmentalRisk).toBe(1);
  });
});
