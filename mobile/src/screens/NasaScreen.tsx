import { useMemo } from "react";
import { Linking, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NasaApod } from "../data/nasa";
import { NothingCard, NothingPill, SectionTitle } from "../components/ui";
import { nothing } from "../theme/nothing";

export function NasaScreen(props: { apod: NasaApod | null; loading: boolean; error: string | null; onRetry: () => void; apiKeyState: "configured" | "demo" }) {
  const imageSource = useMemo(() => {
    if (!props.apod || props.apod.media_type !== "image") return null;
    return { uri: props.apod.hdurl ?? props.apod.url };
  }, [props.apod]);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <SectionTitle
        eyebrow="NASA Open API"
        title="Astronomy Picture of the Day"
        subtitle="Live APOD content with a local fallback so the app stays readable even without an API key."
      />

      <NothingCard>
        <View style={styles.rowHeader}>
          <NothingPill label={props.apiKeyState === "configured" ? "API key active" : "DEMO key"} tone={props.apiKeyState === "configured" ? "success" : "neutral"} />
          <NothingPill label={props.apod?.date ?? "Loading"} />
        </View>

        {props.loading ? (
          <PlaceholderBox label="Loading APOD..." />
        ) : props.error ? (
          <ErrorBox message={props.error} onRetry={props.onRetry} />
        ) : props.apod ? (
          <View style={styles.story}>
            {imageSource ? <Image source={imageSource} style={styles.image} resizeMode="cover" /> : <PlaceholderBox label="Video APOD detected. Open the source link to view it." />}
            <Text style={styles.storyTitle}>{props.apod.title}</Text>
            <Text style={styles.storyBody}>{props.apod.explanation}</Text>
            <Pressable
              onPress={() => Linking.openURL(props.apod?.url ?? "https://api.nasa.gov/")}
              style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
            >
              <Text style={styles.linkLabel}>Open source</Text>
            </Pressable>
          </View>
        ) : (
          <PlaceholderBox label="No APOD loaded yet." />
        )}
      </NothingCard>
    </ScrollView>
  );
}

function PlaceholderBox(props: { label: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderLabel}>{props.label}</Text>
    </View>
  );
}

function ErrorBox(props: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderLabel}>{props.message}</Text>
      <Pressable onPress={props.onRetry} style={styles.retryButton}>
        <Text style={styles.retryLabel}>Retry</Text>
      </Pressable>
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
    alignItems: "center"
  },
  story: {
    gap: 14
  },
  image: {
    width: "100%",
    aspectRatio: 1.2,
    borderRadius: nothing.radius.lg,
    backgroundColor: nothing.colors.panelAlt
  },
  storyTitle: {
    color: nothing.colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  storyBody: {
    color: nothing.colors.muted,
    lineHeight: 20,
    fontSize: 14
  },
  linkButton: {
    alignSelf: "flex-start",
    borderRadius: nothing.radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.4)",
    backgroundColor: nothing.colors.accentSoft,
    paddingVertical: 11,
    paddingHorizontal: 16
  },
  linkButtonPressed: {
    transform: [{ scale: 0.98 }]
  },
  linkLabel: {
    color: nothing.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.3,
    fontSize: 11,
    fontWeight: "800"
  },
  placeholder: {
    minHeight: 220,
    borderRadius: nothing.radius.lg,
    borderWidth: 1,
    borderColor: nothing.colors.line,
    backgroundColor: nothing.colors.panelSoft,
    padding: 18,
    justifyContent: "center",
    alignItems: "center",
    gap: 14
  },
  placeholderLabel: {
    color: nothing.colors.muted,
    textAlign: "center",
    lineHeight: 20,
    fontSize: 14
  },
  retryButton: {
    borderRadius: nothing.radius.xl,
    borderWidth: 1,
    borderColor: nothing.colors.line,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: nothing.colors.panel
  },
  retryLabel: {
    color: nothing.colors.text,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: "800"
  }
});

