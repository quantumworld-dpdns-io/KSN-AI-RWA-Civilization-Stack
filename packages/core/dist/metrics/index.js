export * from './efficiency';
export * from './kardashev';
export * from './risk';
export * from './composite';
export const validateMetrics = (value, min = 0, max = 1) => {
    return value >= min && value <= max && !isNaN(value) && isFinite(value);
};
export const compareEfficiency = (a, b) => {
    return a.computePerWatt - b.computePerWatt;
};
export const compareRisk = (a, b) => {
    // Return negative if a is less risky than b
    const avgA = (a.operationalRisk + a.marketRisk + a.regulatoryRisk + a.technicalRisk + a.environmentalRisk) / 5;
    const avgB = (b.operationalRisk + b.marketRisk + b.regulatoryRisk + b.technicalRisk + b.environmentalRisk) / 5;
    return avgA - avgB;
};
//# sourceMappingURL=index.js.map