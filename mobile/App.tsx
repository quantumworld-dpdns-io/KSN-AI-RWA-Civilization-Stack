import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { NasaScreen } from "./src/screens/NasaScreen";
import { EnergyScreen } from "./src/screens/EnergyScreen";
import { AssetsScreen } from "./src/screens/AssetsScreen";
import { NothingButton, NothingCard, NothingPill, SectionTitle } from "./src/components/ui";
import { nothing } from "./src/theme/nothing";
import { fetchApod, type NasaApod } from "./src/data/nasa";
import { fetchElectricityPrices, type ElectricityPriceRow } from "./src/data/electricity";

type TabKey = "dashboard" | "nasa" | "energy" | "assets";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "dashboard", label: "Overview" },
  { key: "nasa", label: "NASA" },
  { key: "energy", label: "Energy" },
  { key: "assets", label: "Assets" }
];

const nasaApiKey = process.env.EXPO_PUBLIC_NASA_API_KEY ?? "";
const apifyToken = process.env.EXPO_PUBLIC_APIFY_TOKEN ?? "";

export default function App() {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [apod, setApod] = useState<NasaApod | null>(null);
  const [apodError, setApodError] = useState<string | null>(null);
  const [apodLoading, setApodLoading] = useState(true);
  const [electricityRows, setElectricityRows] = useState<ElectricityPriceRow[]>([]);
  const [energyError, setEnergyError] = useState<string | null>(null);
  const [energyLoading, setEnergyLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const apiKeyState = nasaApiKey ? "configured" : "demo";
  const apifyState = apifyToken ? "configured" : "fallback";

  const loadData = useCallback(async () => {
    setApodLoading(true);
    setEnergyLoading(true);
    setApodError(null);
    setEnergyError(null);

    const [apodResult, energyResult] = await Promise.allSettled([
      fetchApod(nasaApiKey),
      fetchElectricityPrices(apifyToken)
    ]);

    if (apodResult.status === "fulfilled") {
      setApod(apodResult.value);
    } else {
      setApodError(apodResult.reason instanceof Error ? apodResult.reason.message : "Failed to load APOD");
    }
    setApodLoading(false);

    if (energyResult.status === "fulfilled") {
      setElectricityRows(energyResult.value);
    } else {
      setEnergyError(energyResult.reason instanceof Error ? energyResult.reason.message : "Failed to load electricity data");
    }
    setEnergyLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const CurrentScreen = useMemo(() => {
    switch (tab) {
      case "nasa":
        return <NasaScreen apod={apod} loading={apodLoading} error={apodError} onRetry={loadData} apiKeyState={apiKeyState} />;
      case "energy":
        return <EnergyScreen rows={electricityRows} loading={energyLoading} error={energyError} onRetry={loadData} apiState={apifyState} />;
      case "assets":
        return <AssetsScreen />;
      case "dashboard":
      default:
        return <DashboardScreen />;
    }
  }, [apiKeyState, apod, apodError, apodLoading, apifyState, electricityRows, energyError, energyLoading, loadData, tab]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.backdrop} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>KSN Mobile</Text>
            <Text style={styles.tagline}>Nothing-style control surface for the civilization stack.</Text>
          </View>
          <NothingPill label={tab.toUpperCase()} tone="accent" />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={nothing.colors.text} />}
          showsVerticalScrollIndicator={false}
        >
          <NothingCard>
            <SectionTitle
              eyebrow="Runtime status"
              title="Live feeds and core logic"
              subtitle="NASA APOD and the Apify electricity monitor are fetched on demand. Core asset math comes from the repo’s shared simulation package."
            />
            <View style={styles.statusRow}>
              <StatusChip label={`NASA ${apiKeyState}`} />
              <StatusChip label={`Apify ${apifyState}`} />
              <StatusChip label={`APOD ${apodLoading ? "loading" : "ready"}`} />
            </View>
          </NothingCard>

          {CurrentScreen}
        </ScrollView>

        <View style={styles.tabBar}>
          {tabs.map((item) => (
            <NothingButton key={item.key} label={item.label} active={tab === item.key} onPress={() => setTab(item.key)} />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

function StatusChip(props: { label: string }) {
  return <Text style={styles.statusChip}>{props.label}</Text>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: nothing.colors.bg
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: nothing.colors.bg,
    opacity: 1
  },
  safe: {
    flex: 1
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16
  },
  brand: {
    color: nothing.colors.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.8
  },
  tagline: {
    color: nothing.colors.muted,
    marginTop: 6,
    lineHeight: 18,
    fontSize: 13
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  statusChip: {
    color: nothing.colors.muted,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: nothing.colors.line,
    paddingVertical: 6,
    paddingHorizontal: 10,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontSize: 10,
    fontWeight: "800"
  },
  scrollContent: {
    paddingBottom: 16
  },
  tabBar: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: nothing.colors.line,
    backgroundColor: "rgba(5,5,5,0.96)"
  }
});
