import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import { nothing } from "../theme/nothing";

export function SectionTitle(props: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.eyebrow}>{props.eyebrow}</Text>
      <Text style={styles.title}>{props.title}</Text>
      {props.subtitle ? <Text style={styles.subtitle}>{props.subtitle}</Text> : null}
    </View>
  );
}

export function NothingCard(props: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, props.style]}>{props.children}</View>;
}

export function NothingButton(props: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.button,
        props.active && styles.buttonActive,
        pressed && styles.buttonPressed
      ]}
    >
      <Text style={[styles.buttonLabel, props.active && styles.buttonLabelActive]}>{props.label}</Text>
    </Pressable>
  );
}

export function NothingPill(props: { label: string; tone?: "neutral" | "accent" | "success" }) {
  const toneStyle =
    props.tone === "accent" ? styles.pillAccent : props.tone === "success" ? styles.pillSuccess : styles.pillNeutral;

  return <Text style={[styles.pill, toneStyle]}>{props.label}</Text>;
}

export function StatBlock(props: { label: string; value: string; helper?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{props.label}</Text>
      <Text style={styles.statValue}>{props.value}</Text>
      {props.helper ? <Text style={styles.statHelper}>{props.helper}</Text> : null}
    </View>
  );
}

export function ProgressBar(props: { value: number; accent?: boolean }) {
  const width: DimensionValue = `${Math.max(0, Math.min(100, props.value * 100))}%`;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, props.accent ? styles.fillAccent : styles.fillNeutral, { width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    gap: 8,
    marginBottom: nothing.spacing.lg
  },
  eyebrow: {
    color: nothing.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 2.2,
    fontSize: 11,
    fontWeight: "700"
  },
  title: {
    color: nothing.colors.text,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
    letterSpacing: -0.6
  },
  subtitle: {
    color: nothing.colors.muted,
    lineHeight: 20,
    fontSize: 14
  },
  card: {
    borderRadius: nothing.radius.lg,
    borderWidth: 1,
    borderColor: nothing.colors.line,
    backgroundColor: nothing.colors.panel,
    padding: nothing.spacing.lg,
    gap: nothing.spacing.md
  },
  button: {
    borderRadius: nothing.radius.xl,
    borderWidth: 1,
    borderColor: nothing.colors.line,
    backgroundColor: nothing.colors.panelSoft,
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  buttonActive: {
    backgroundColor: nothing.colors.accentSoft,
    borderColor: "rgba(255,59,48,0.42)"
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }]
  },
  buttonLabel: {
    color: nothing.colors.text,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontSize: 12,
    fontWeight: "700"
  },
  buttonLabelActive: {
    color: nothing.colors.accent
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    overflow: "hidden",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontSize: 10,
    fontWeight: "800"
  },
  pillNeutral: {
    color: nothing.colors.text,
    borderColor: nothing.colors.line,
    backgroundColor: nothing.colors.panelAlt
  },
  pillAccent: {
    color: nothing.colors.accent,
    borderColor: "rgba(255,59,48,0.36)",
    backgroundColor: nothing.colors.accentSoft
  },
  pillSuccess: {
    color: nothing.colors.success,
    borderColor: "rgba(97,242,164,0.28)",
    backgroundColor: "rgba(97,242,164,0.12)"
  },
  stat: {
    flex: 1,
    minWidth: 140,
    borderRadius: nothing.radius.md,
    borderWidth: 1,
    borderColor: nothing.colors.line,
    backgroundColor: nothing.colors.panelSoft,
    padding: nothing.spacing.md,
    gap: 8
  },
  statLabel: {
    color: nothing.colors.faint,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontSize: 10,
    fontWeight: "700"
  },
  statValue: {
    color: nothing.colors.text,
    fontSize: 22,
    fontWeight: "800"
  },
  statHelper: {
    color: nothing.colors.muted,
    fontSize: 12,
    lineHeight: 16
  },
  track: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    borderRadius: 999
  },
  fillAccent: {
    backgroundColor: nothing.colors.accent
  },
  fillNeutral: {
    backgroundColor: "#f1f1ea"
  }
});
