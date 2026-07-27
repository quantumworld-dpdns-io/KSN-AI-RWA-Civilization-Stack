export const calculateCompositeMetrics = (risk, efficiency, aiAutonomyLevel // 0 to 1
) => {
    const totalRiskScore = (risk.operationalRisk * 0.3 +
        risk.marketRisk * 0.2 +
        risk.regulatoryRisk * 0.2 +
        risk.technicalRisk * 0.15 +
        risk.environmentalRisk * 0.15);
    const sustainabilityIndex = Math.max(0, 1 - risk.environmentalRisk) *
        (efficiency.carbonIntensity < 100 ? 1 : 0.5);
    const investmentAttractiveness = Math.max(0, 1 - totalRiskScore) * efficiency.availabilityScore;
    const aiReadinessScore = Math.max(0, Math.min(1, aiAutonomyLevel * (1 - risk.technicalRisk)));
    return {
        totalRiskScore,
        investmentAttractiveness,
        sustainabilityIndex,
        aiReadinessScore
    };
};
//# sourceMappingURL=composite.js.map