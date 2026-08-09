"use client";

import {
  BandwidthGraph,
  BarcodeGenerator,
  CarbonPPM,
  DotMatrixText,
  DottedDivider,
  ElectronPump,
  HumanityIndex,
  LoadingDataStream,
  NewsTicker,
  NothingCard,
  PillBadge,
  PositronicBrain,
  PowerConsumption,
  ProgressDots,
  RadarScan,
  SegmentedDisplay,
  TerminalBlink,
  TerminalPrompt,
  ThreeLawsDiagnostic,
} from "@dennislee928/nothingx-react-components";

type LandingNothingHudProps = {
  agencyProgress?: number;
};

export function LandingNothingHud({ agencyProgress = 72 }: LandingNothingHudProps) {
  return (
    <div className="landing-nothing" aria-label="NothingX telemetry HUD">
      <div className="landing-nothing-top">
        <NothingCard dark style={{ padding: 12, display: "grid", gap: 10, minWidth: 0 }}>
          <div className="landing-nothing-row">
            <PillBadge variant="live">Live</PillBadge>
            <TerminalBlink>
              <span className="landing-nothing-label">ORACLE LINK</span>
            </TerminalBlink>
          </div>
          <DotMatrixText color="#5cf0ff" dotSize={2} gap={1}>
            10
          </DotMatrixText>
          <SegmentedDisplay value="10" color="#3dffc8" size={28} />
          <ProgressDots value={agencyProgress} max={100} count={12} color="#3dffc8" />
        </NothingCard>

        <NothingCard dark style={{ padding: 10, display: "grid", placeItems: "center" }}>
          <RadarScan size={118}>
            <span className="landing-nothing-radar-label">GRID</span>
          </RadarScan>
        </NothingCard>

        <NothingCard dark style={{ padding: 12, minWidth: 0 }}>
          <TerminalPrompt prompt="ksn@sovereign ~ " />
          <div style={{ marginTop: 10 }}>
            <LoadingDataStream />
          </div>
        </NothingCard>
      </div>

      <div className="landing-hero-laws visible">
        <ThreeLawsDiagnostic weights={[100, 92, 78]} />
        <PositronicBrain active />
      </div>

      <DottedDivider length={36} color="rgba(92, 240, 255, 0.35)" />

      <div className="landing-nothing-metrics">
        <PowerConsumption watts={12840} />
        <BandwidthGraph />
        <CarbonPPM ppm={412} />
        <ElectronPump efficiency={86} />
        <HumanityIndex percent={28} />
        <NothingCard dark style={{ display: "grid", placeItems: "center", padding: 14 }}>
          <BarcodeGenerator value="KSN-SCENE-10" width={140} height={36} />
        </NothingCard>
      </div>

      <div className="landing-nothing-ticker">
        <NewsTicker
          speed={42}
          items={[
            "Scene 10 — Sovereign Asset: AI buyout threshold approaching.",
            "S(t) = P(t) / H(t) · civilization efficiency signal rising.",
            "Microgrid oracle HMAC signed · Redis cache online.",
            "Sui agentic microgrid staking window open.",
            "Energy → compute routing optimized for lowest carbon intensity.",
          ]}
        />
      </div>
    </div>
  );
}
