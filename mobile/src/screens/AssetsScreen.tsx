import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SAMPLE_ASSETS, describeAgencyStage, estimateAutonomyRisk, simulateYieldDistribution, snapshotAsset } from "@aks/core";
import { NothingCard, NothingPill, SectionTitle } from "../components/ui";
import { nothing } from "../theme/nothing";
import { formatKsn, formatMoney, formatPercent, formatWatts } from "../utils/format";

export function AssetsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SectionTitle
        eyebrow="Core Simulator"
        title="Asset explorer"
        subtitle="Uses repo-local KSN logic to render the existing sample assets on mobile."
      />

      {SAMPLE_ASSETS.map((asset) => {
        const snapshot = snapshotAsset(asset);
        const yields = simulateYieldDistribution(asset);
        const autonomyRisk = estimateAutonomyRisk(asset);

        return (
          <NothingCard key={asset.id}>
            <View style={styles.rowHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{asset.name}</Text>
                <Text style={styles.meta}>{describeAgencyStage(asset.agencyStage)}</Text>
              </View>
              <NothingPill label={asset.assetClass.replaceAll("_", " ")} />
            </View>

            <View style={styles.metrics}>
              <Metric label="Power" value={formatWatts(snapshot.powerWatts)} />
              <Metric label="KSN" value={formatKsn(snapshot.ksnScore)} />
              <Metric label="Yield" value={formatMoney(yields.grossRevenue)} />
              <Metric label="Risk" value={formatPercent(autonomyRisk)} />
            </View>
            <Text style={styles.small}>Stage label: {snapshot.stageLabel}</Text>
          </NothingCard>
        );
      })}
    </ScrollView>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{props.label}</Text>
      <Text style={styles.metricValue}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    gap: 16,
    paddingBottom: 40
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start"
  },
  name: {
    color: nothing.colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6
  },
  meta: {
    color: nothing.colors.muted,
    lineHeight: 20,
    fontSize: 13
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  metric: {
    flexGrow: 1,
    minWidth: 132,
    borderRadius: nothing.radius.md,
    backgroundColor: nothing.colors.panelSoft,
    borderWidth: 1,
    borderColor: nothing.colors.line,
    padding: 12,
    gap: 6
  },
  metricLabel: {
    color: nothing.colors.faint,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "700"
  },
  metricValue: {
    color: nothing.colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  small: {
    color: nothing.colors.muted,
    fontSize: 12,
    marginTop: 2
  }
});

