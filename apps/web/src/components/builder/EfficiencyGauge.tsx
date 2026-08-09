"use client";

import { EFFICIENCY_THRESHOLD } from "@/lib/efficiency";

/**
 * The number the demo narration points at: E(t) on a 0-100 scale with the 85.00
 * dividend threshold marked. Crossing the marker is the same on-chain event as
 * `ksn_score <= dividend_threshold` — see lib/efficiency.ts.
 *
 * `projected` optionally draws where one more cooling upgrade would land, so the
 * builder can see the payoff before signing.
 */
export function EfficiencyGauge({
  value,
  projected,
}: {
  value: number;
  projected?: number;
}) {
  const crossed = value >= EFFICIENCY_THRESHOLD;
  const clamp = (n: number) => Math.max(0, Math.min(100, n));

  return (
    <div className="gauge">
      <div className="gauge-head">
        <div>
          <small>Efficiency score E(t)</small>
          <strong className={crossed ? "gauge-value crossed" : "gauge-value"}>
            {value.toFixed(2)}
          </strong>
        </div>
        <span className={crossed ? "pill live" : "pill"}>
          {crossed ? "DIVIDEND ELIGIBLE" : `BELOW ${EFFICIENCY_THRESHOLD}`}
        </span>
      </div>

      <div className="gauge-track" role="img" aria-label={`Efficiency score ${value.toFixed(2)} of 100`}>
        {projected != null && projected > value ? (
          <div className="gauge-projected" style={{ width: `${clamp(projected)}%` }} />
        ) : null}
        <div
          className={crossed ? "gauge-fill crossed" : "gauge-fill"}
          style={{ width: `${clamp(value)}%` }}
        />
        <div className="gauge-marker" style={{ left: `${EFFICIENCY_THRESHOLD}%` }}>
          <span>{EFFICIENCY_THRESHOLD}</span>
        </div>
      </div>

      <p className="gauge-note">
        {crossed
          ? "Above 85.00 the on-chain dividend gate is open: the AI agent may distribute a Planetary Dividend."
          : projected != null
            ? `One cooling upgrade projects to ${projected.toFixed(2)}.`
            : "Upgrade cooling to lower P(t) and raise the score."}
      </p>
    </div>
  );
}
