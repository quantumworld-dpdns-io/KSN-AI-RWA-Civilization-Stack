import { RiskMetrics } from './risk';
import { EfficiencyMetrics } from './efficiency';
export interface CompositeMetrics {
    totalRiskScore: number;
    investmentAttractiveness: number;
    sustainabilityIndex: number;
    aiReadinessScore: number;
}
export declare const calculateCompositeMetrics: (risk: RiskMetrics, efficiency: EfficiencyMetrics, aiAutonomyLevel: number) => CompositeMetrics;
//# sourceMappingURL=composite.d.ts.map