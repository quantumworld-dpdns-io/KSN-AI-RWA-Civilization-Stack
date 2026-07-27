import { describe, it, expect } from 'vitest';
import { calculateEfficiencyMetrics } from '../efficiency';

describe('Efficiency Metrics', () => {
  it('should calculate compute per watt correctly', () => {
    const metrics = calculateEfficiencyMetrics(1000, 500, 100, 10, 24, 24, 1);
    expect(metrics.computePerWatt).toBe(2);
  });

  it('should handle zero power gracefully', () => {
    const metrics = calculateEfficiencyMetrics(1000, 0, 100, 10, 24, 24, 1);
    expect(metrics.computePerWatt).toBe(0);
  });

  it('should calculate availability score correctly', () => {
    const metrics = calculateEfficiencyMetrics(1000, 500, 100, 10, 12, 24, 1);
    expect(metrics.availabilityScore).toBe(0.5);
  });
});
