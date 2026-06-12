import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SAMPLE_ASSETS, describeAgencyStage, estimateAutonomyRisk, simulateYieldDistribution, snapshotAsset } from "@aks/core";
import { NothingCard, NothingPill, ProgressBar, SectionTitle, StatBlock } from "../components/ui";
import { nothing } from "../theme/nothing";
import { formatKsn, formatMoney, formatPercent, formatWatts } from "../utils/format";

export function DashboardScreen() {
  const selected = SAMPLE_ASSETS[0];
  const snapshot = useMemo(() => snapshotAsset(selected), [selected]);
  const yieldDistribution = useMemo(() => simulateYieldDistribution(selected), [selected]);
  const autonomyRisk = useMemo(() => estimateAutonomyRisk(selected), [selected]);

  const totalYield = yieldDistribution.grossRevenue || 1;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SectionTitle
        eyebrow="Civilization Signal"
        title="Energy × Compute × Agency"
        subtitle="The mobile control surface for the KSN asset ladder, with live telemetry, APOD context, and electricity pricing."
      />

      <NothingCard>
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <NothingPill label={`Stage ${selected.agencyStage.replaceAll("_", " ")}`} tone="accent" />
            <Text style={styles.heroTitle}>{selected.name}</Text>
            <Text style={styles.heroBody}>{describeAgencyStage(selected.agencyStage)}</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeLabel}>KSN</Text>
            <Text style={styles.heroBadgeValue}>{formatKsn(snapshot.ksnScore)}</Text>
          </View>
        </View>
      </NothingCard>

      <View style={styles.statGrid}>
        <StatBlock label="Power" value={formatWatts(snapshot.powerWatts)} helper="Energy output" />
        <StatBlock label="Hashrate" value={snapshot.hashrate.toExponential(2)} helper="Compute proxy" />
        <StatBlock label="Kardashev" value={`Type ${snapshot.kardashevType.toFixed(2)}`} helper="Civilization scale" />
        <StatBlock label="Autonomy risk" value={formatPercent(autonomyRisk)} helper="Policy pressure" />
      </View>

      <NothingCard>
        <View style={styles.rowHeader}>
          <Text style={styles.cardTitle}>24h yield split</Text>
          <NothingPill label={formatMoney(yieldDistribution.grossRevenue)} />
        </View>
        <YieldLine label="Maintenance" value={yieldDistribution.maintenanceReserve / totalYield} amount={yieldDistribution.maintenanceReserve} />
        <YieldLine label="Insurance" value={yieldDistribution.insurancePool / totalYield} amount={yieldDistribution.insurancePool} />
        <YieldLine label="Human yield" value={yieldDistribution.humanInvestorYield / totalYield} amount={yieldDistribution.humanInvestorYield} />
        <YieldLine label="AI treasury" value={yieldDistribution.aiTreasury / totalYield} amount={yieldDistribution.aiTreasury} />
        <YieldLine label="Dividend" value={yieldDistribution.planetaryDividend / totalYield} amount={yieldDistribution.planetaryDividend} />
        <YieldLine label="Expansion" value={yieldDistribution.retainedForExpansion / totalYield} amount={yieldDistribution.retainedForExpansion} />
      </NothingCard>

      <NothingCard>
        <Text style={styles.cardTitle}>Asset ladder</Text>
        <View style={styles.assetList}>
          {SAMPLE_ASSETS.map((asset) => {
            const itemSnapshot = snapshotAsset(asset);
            const itemRisk = estimateAutonomyRisk(asset);
            return (
              <View key={asset.id} style={styles.assetRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assetName}>{asset.name}</Text>
                  <Text style={styles.assetMeta}>{describeAgencyStage(asset.agencyStage)}</Text>
                </View>
                <View style={styles.assetMetric}>
                  <Text style={styles.assetMetricLabel}>KSN</Text>
                  <Text style={styles.assetMetricValue}>{formatKsn(itemSnapshot.ksnScore)}</Text>
                  <Text style={styles.assetMetricLabel}>{formatPercent(itemRisk)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </NothingCard>
    </ScrollView>
  );
}

function YieldLine(props: { label: string; value: number; amount: number }) {
  return (
    <View style={styles.yieldLine}>
      <View style={styles.yieldTopRow}>
        <Text style={styles.yieldLabel}>{props.label}</Text>
        <Text style={styles.yieldAmount}>{formatMoney(props.amount)}</Text>
      </View>
      <ProgressBar value={props.value} accent={props.label === "AI treasury"} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    gap: 16,
    paddingBottom: 40
  },
  heroRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "stretch"
  },
  heroTitle: {
    color: nothing.colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "900",
    marginTop: 12,
    marginBottom: 8
  },
  heroBody: {
    color: nothing.colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  heroBadge: {
    width: 96,
    borderRadius: nothing.radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.24)",
    backgroundColor: nothing.colors.accentSoft,
    padding: 14,
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  heroBadgeLabel: {
    color: nothing.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    fontSize: 10,
    fontWeight: "800"
  },
  heroBadgeValue: {
    color: nothing.colors.text,
    fontSize: 24,
    fontWeight: "900"
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  cardTitle: {
    color: nothing.colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  yieldLine: {
    gap: 8
  },
  yieldTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  yieldLabel: {
    color: nothing.colors.muted,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "700"
  },
  yieldAmount: {
    color: nothing.colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  assetList: {
    gap: 12
  },
  assetRow: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: nothing.colors.line
  },
  assetName: {
    color: nothing.colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4
  },
  assetMeta: {
    color: nothing.colors.muted,
    lineHeight: 18,
    fontSize: 12
  },
  assetMetric: {
    width: 88,
    alignItems: "flex-end"
  },
  assetMetricLabel: {
    color: nothing.colors.faint,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "700"
  },
  assetMetricValue: {
    color: nothing.colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginVertical: 3
  }
});

