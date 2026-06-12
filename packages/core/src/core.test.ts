import { computeKsnScore, estimateKardashevType, simulateYieldDistribution, SAMPLE_ASSETS } from "./index";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

assert(computeKsnScore(100, 10) === 10, "KSN score should be P/H");
assert(Math.abs(estimateKardashevType(1e16) - 1) < 1e-9, "1e16 W should approximate Type 1");

const y = simulateYieldDistribution(SAMPLE_ASSETS[0]);
assert(y.grossRevenue > 0, "gross revenue should be positive");
assert(y.humanInvestorYield >= 0, "human yield should not be negative");

console.log("core tests passed");
