"use client";

import {
  BandwidthGraph,
  EstwaldEquation,
  NothingCard,
  PillBadge,
  PlanetaryTerraform,
  PositronicBrain,
  PowerConsumption,
  ProgressDots,
  TerminalBlink,
  ThreeLawsDiagnostic,
} from "@dennislee928/nothingx-react-components";
import type { AssetTelemetry } from "@/lib/types";

type ConsoleNothingStripProps = {
  selected: AssetTelemetry;
  totalPowerWatts: number;
  avgConfidence: number;
};

export function ConsoleNothingStrip({
  selected,
  totalPowerWatts,
  avgConfidence,
}: ConsoleNothingStripProps) {
  const agencyPct = Math.round(
    Math.min(100, Math.max(0, (selected.agency.stageIndex / 11) * 100)),
  );
  const humanityPct = Math.max(5, 100 - Math.round(selected.autonomyRisk * 100));

  return (
    <section className="nothing-strip" aria-label="NothingX operations strip">
      <div className="nothing-strip-head">
        <PillBadge variant="live">NothingX</PillBadge>
        <TerminalBlink>
          <span className="nothing-strip-title">Agent diagnostic bus</span>
        </TerminalBlink>
        <ProgressDots value={agencyPct} max={100} count={14} color="#69e7d5" />
      </div>
      <div className="nothing-strip-grid">
        <PowerConsumption watts={totalPowerWatts} />
        <BandwidthGraph />
        <ThreeLawsDiagnostic
          weights={[
            100,
            Math.round(avgConfidence * 100),
            Math.max(40, 100 - Math.round(selected.autonomyRisk * 100)),
          ]}
        />
        <PositronicBrain active={selected.agency.stageIndex >= 3} />
        <PlanetaryTerraform progress={Math.round(selected.ksn.kardashevType * 40)} />
        <NothingCard dark style={{ minHeight: 96 }}>
          <div className="nothing-strip-ksn">
            <small>Human dependency</small>
            <strong>{humanityPct}%</strong>
            <ProgressDots value={humanityPct} max={100} count={10} color="#e2201f" />
          </div>
        </NothingCard>
        <EstwaldEquation />
      </div>
    </section>
  );
}
