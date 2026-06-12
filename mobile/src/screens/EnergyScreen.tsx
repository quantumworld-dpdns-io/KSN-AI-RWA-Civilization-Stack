import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { ElectricityPriceRow } from "../data/electricity";
import { NothingCard, NothingPill, ProgressBar, SectionTitle } from "../components/ui";
import { nothing } from "../theme/nothing";
import { formatMoney } from "../utils/format";

export function EnergyScreen(props: {
  rows: ElectricityPriceRow[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  apiState: "configured" | "fallback";
}) {
  const highest = Math.max(...props.rows.map((row) => row.maximumPrice || row.currentPrice || 1), 1);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SectionTitle
        eyebrow="Apify Actor"
        title="Global electricity monitor"
        subtitle="The actor is normalized into a stable native shape so the app can show energy-market pressure at a glance."
      />

      <NothingCard>
        <View style={styles.rowHeader}>
          <NothingPill label={props.apiState === "configured" ? "Apify live" : "Fallback data"} tone={props.apiState === "configured" ? "success" : "neutral"} />
          <NothingPill label={`${props.rows.length} markets`} />
        </View>

        {props.loading ? (
          <Text style={styles.message}>Loading electricity prices...</Text>
        ) : props.error ? (
          <Text style={styles.message}>{props.error}</Text>
        ) : (
          <View style={styles.list}>
            {props.rows.map((row) => {
              const ratio = row.currentPrice / highest;
              return (
                <View key={row.region} style={styles.row}>
                  <View style={styles.rowTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.region}>{row.region}</Text>
                      <Text style={styles.meta}>
                        {row.source} · {row.updatedAt.slice(0, 10)}
                      </Text>
                    </View>
                    <NothingPill label={row.alert ? "Alert" : "Stable"} tone={row.alert ? "accent" : "success"} />
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{formatMoney(row.currentPrice)}</Text>
                    <Text style={styles.priceMeta}>
                      avg {formatMoney(row.averagePrice)} · min {formatMoney(row.minimumPrice)} · max {formatMoney(row.maximumPrice)}
                    </Text>
                  </View>
                  <ProgressBar value={ratio} accent={row.alert} />
                </View>
              );
            })}
          </View>
        )}
      </NothingCard>
    </ScrollView>
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
    alignItems: "center"
  },
  list: {
    gap: 14
  },
  row: {
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: nothing.colors.line
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start"
  },
  region: {
    color: nothing.colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  meta: {
    color: nothing.colors.muted,
    fontSize: 12,
    marginTop: 4
  },
  priceRow: {
    gap: 4
  },
  price: {
    color: nothing.colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  priceMeta: {
    color: nothing.colors.faint,
    fontSize: 12,
    lineHeight: 16
  },
  message: {
    color: nothing.colors.muted,
    fontSize: 14,
    lineHeight: 20
  }
});

