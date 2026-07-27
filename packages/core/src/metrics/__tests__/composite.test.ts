import { describe, it, expect } from 'vitest';
import { calculateCompositeMetrics } from '../composite';

describe('Composite Metrics', () => {
  it('should calculate composite scores', () => {
    const risk = {
      operationalRisk: 0.1,
      marketRisk: 0.1,
      regulatoryRisk: 0.1,
      technicalRisk: 0.1,
      environmentalRisk: 0.1,
    };
    const efficiency = {
      computePerWatt: 1,
      costPerCompute: 1,
      carbonIntensity: 50,
      availabilityScore: 0.9,
      redundancyFactor: 1,
    };
    
    const composite = calculateCompositeMetrics(risk, efficiency, 0.5);
    expect(composite.totalRiskScore).toBeCloseTo(0.1, 1);
    expect(composite.sustainabilityIndex).toBeGreaterThan(0.5);
    expect(composite.aiReadinessScore).toBeGreaterThan(0);
  });
});
