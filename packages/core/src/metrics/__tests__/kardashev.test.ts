import { describe, it, expect } from 'vitest';
import { calculateKardashevMetrics } from '../kardashev';

describe('Kardashev Metrics', () => {
  it('should calculate extended Kardashev type', () => {
    const metrics = calculateKardashevMetrics(1e16, 1e20);
    expect(metrics.extendedKardashevType).toBeGreaterThan(0);
    expect(metrics.kardashevProgress).toBeLessThan(1);
  });

  it('should handle zero inputs', () => {
    const metrics = calculateKardashevMetrics(0, 0);
    expect(metrics.extendedKardashevType).toBe(0);
  });
});
