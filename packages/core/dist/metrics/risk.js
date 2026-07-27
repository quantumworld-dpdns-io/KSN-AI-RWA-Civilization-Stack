export const calculateRiskMetrics = (uptime, priceVolatility, complianceScore, architectureAgeYears, carbonIntensity) => {
    return {
        operationalRisk: 1 - uptime, // lower uptime = higher risk
        marketRisk: Math.min(1, priceVolatility),
        regulatoryRisk: 1 - complianceScore,
        technicalRisk: Math.min(1, architectureAgeYears / 10), // assumes obsolete in 10 years
        environmentalRisk: Math.min(1, carbonIntensity / 1000) // normalize roughly
    };
};
//# sourceMappingURL=risk.js.map