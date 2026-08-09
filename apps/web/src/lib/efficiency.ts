/**
 * The human-facing Efficiency Score E(t).
 *
 * The chain stores the raw *cost* metric S(t) = P(t) / H(t) (scaled by 1e18),
 * where LOWER is better, and gates dividends on `ksn_score <= dividend_threshold`.
 * "Efficiency" as a 0-100 score is the inverted, normalized view of that:
 *
 *     E(t) = min(100, 85 * dividend_threshold / S(t))
 *
 * The 85 scaling is not cosmetic — it makes `E >= 85` hold *exactly* when
 * `S(t) <= dividend_threshold`. Crossing 85 and becoming dividend-eligible
 * on-chain are therefore the same event, by construction.
 *
 * This mirrors `microgrid::efficiency_score_bps` in
 * packages/sui-contracts/sources/microgrid.move, which is the authoritative
 * definition; this module exists so the UI can *project* the score for an
 * upgrade that has not been submitted yet.
 */

/** The score at which the microgrid becomes dividend-eligible. */
export const EFFICIENCY_THRESHOLD = 85;

/** Each cooling tier cuts power draw P(t) by this fraction (COOLING_STEP_BPS). */
export const COOLING_STEP = 0.2;

/** Maximum cooling tiers the contract will install (MAX_COOLING_TIER). */
export const MAX_COOLING_TIER = 5;

/** Price of one cooling tier in MIST (COOLING_UPGRADE_PRICE_MIST). */
export const COOLING_UPGRADE_PRICE_MIST = BigInt(10_000_000);

export const MIST_PER_SUI = 1_000_000_000;

/** Scale factor between watts and the stored S(t) (KSN_SCALE). */
const KSN_SCALE = BigInt("1000000000000000000");

/**
 * E(t) on a 0-100 scale, from the raw on-chain values. Accepts the decimal
 * strings the GraphQL read returns. Returns 100 for a zero score (infinitely
 * efficient) and clamps to 100.
 */
export function efficiencyScore(ksnScore: bigint | string, dividendThreshold: bigint | string): number {
  const score = BigInt(ksnScore);
  const threshold = BigInt(dividendThreshold);
  if (score <= BigInt(0)) return 100;
  if (threshold <= BigInt(0)) return 0;
  // Compute in basis points to match the Move implementation exactly, then scale.
  const bps = (BigInt(8500) * threshold) / score;
  return Math.min(100, Number(bps) / 100);
}

/** S(t) = P(t) * 1e18 / H(t), matching `microgrid::compute_ksn_score`. */
export function computeKsnScore(powerWatts: bigint | string, hashrate: bigint | string): bigint {
  const h = BigInt(hashrate);
  if (h === BigInt(0)) return BigInt(0);
  return (BigInt(powerWatts) * KSN_SCALE) / h;
}

/** Power draw after applying one more cooling tier (integer math, as in Move). */
export function powerAfterCoolingUpgrade(powerWatts: bigint | string): bigint {
  return (BigInt(powerWatts) * BigInt(8000)) / BigInt(10_000);
}

export interface ProjectedUpgrade {
  powerWatts: bigint;
  ksnScore: bigint;
  efficiency: number;
  crossesThreshold: boolean;
}

/**
 * What the microgrid would look like after one more cooling upgrade — used to
 * show the builder the payoff *before* they sign the transaction.
 */
export function projectCoolingUpgrade(
  powerWatts: bigint | string,
  hashrate: bigint | string,
  dividendThreshold: bigint | string,
): ProjectedUpgrade {
  const nextPower = powerAfterCoolingUpgrade(powerWatts);
  const nextScore = computeKsnScore(nextPower, hashrate);
  const efficiency = efficiencyScore(nextScore, dividendThreshold);
  return {
    powerWatts: nextPower,
    ksnScore: nextScore,
    efficiency,
    crossesThreshold: efficiency >= EFFICIENCY_THRESHOLD,
  };
}

export function formatMist(mist: bigint | string): string {
  const value = Number(BigInt(mist)) / MIST_PER_SUI;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 4 })} SUI`;
}
