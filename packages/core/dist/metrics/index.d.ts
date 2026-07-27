import { EfficiencyMetrics } from './efficiency';
import { RiskMetrics } from './risk';
export * from './efficiency';
export * from './kardashev';
export * from './risk';
export * from './composite';
export declare const validateMetrics: (value: number, min?: number, max?: number) => boolean;
export declare const compareEfficiency: (a: EfficiencyMetrics, b: EfficiencyMetrics) => number;
export declare const compareRisk: (a: RiskMetrics, b: RiskMetrics) => number;
//# sourceMappingURL=index.d.ts.map