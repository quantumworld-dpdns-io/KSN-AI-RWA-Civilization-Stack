import { useMemo } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { NothingButton, NothingCard, NothingPill, SectionTitle } from "../components/ui";
import { nothing } from "../theme/nothing";
import type { CredentialSettings } from "../storage/credentials";

export function SettingsScreen(props: {
  draft: CredentialSettings;
  active: CredentialSettings;
  onChange: (next: CredentialSettings) => void;
  onSave: () => Promise<void>;
  onClear: () => Promise<void>;
  onReset: () => void;
  loading: boolean;
  savedAt: string | null;
}) {
  const statusText = useMemo(() => {
    if (props.loading) {
      return "Loading saved credentials...";
    }
    if (props.savedAt) {
      return props.savedAt === "stored" ? "Credentials are stored locally on this device." : `Saved locally at ${props.savedAt}`;
    }
    return "Using environment defaults until you save a local override.";
  }, [props.loading, props.savedAt]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionTitle
          eyebrow="Local Settings"
          title="Persisted API credentials"
          subtitle="NASA and Apify keys are stored locally on the device. Empty fields fall back to the environment values already available to the app."
        />

        <NothingCard>
          <View style={styles.rowHeader}>
            <NothingPill label={props.loading ? "Loading" : "Ready"} tone={props.loading ? "neutral" : "success"} />
            <Text style={styles.meta}>{statusText}</Text>
          </View>

          <LabeledInput
            label="NASA API key"
            value={props.draft.nasaApiKey}
            placeholder="DEMO_KEY or your API key"
            onChangeText={(value) => props.onChange({ ...props.draft, nasaApiKey: value })}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <LabeledInput
            label="Apify token"
            value={props.draft.apifyToken}
            placeholder="apify_..."
            onChangeText={(value) => props.onChange({ ...props.draft, apifyToken: value })}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />

          <View style={styles.statusGrid}>
            <StatusChip label={props.active.nasaApiKey ? "NASA stored" : "NASA fallback"} />
            <StatusChip label={props.active.apifyToken ? "Apify stored" : "Apify fallback"} />
          </View>

          <View style={styles.actions}>
            <NothingButton label="Save settings" active onPress={() => void props.onSave()} />
            <NothingButton label="Reset draft" onPress={props.onReset} />
            <NothingButton
              label="Clear storage"
              onPress={() =>
                void props.onClear().catch((error) => {
                  Alert.alert("Clear failed", error instanceof Error ? error.message : "Unable to clear local storage.");
                })
              }
            />
          </View>
        </NothingCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function LabeledInput(props: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  autoCapitalize: "none" | "sentences" | "words" | "characters";
  autoCorrect: boolean;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        placeholder={props.placeholder}
        placeholderTextColor={nothing.colors.faint}
        onChangeText={props.onChangeText}
        autoCapitalize={props.autoCapitalize}
        autoCorrect={props.autoCorrect}
        secureTextEntry={props.secureTextEntry}
        style={styles.input}
      />
    </View>
  );
}

function StatusChip(props: { label: string }) {
  return <Text style={styles.statusChip}>{props.label}</Text>;
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    gap: 16,
    paddingBottom: 40
  },
  rowHeader: {
    gap: 10
  },
  meta: {
    color: nothing.colors.muted,
    lineHeight: 20,
    fontSize: 13
  },
  field: {
    gap: 10
  },
  label: {
    color: nothing.colors.faint,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontSize: 10,
    fontWeight: "800"
  },
  input: {
    color: nothing.colors.text,
    borderWidth: 1,
    borderColor: nothing.colors.line,
    borderRadius: nothing.radius.md,
    backgroundColor: nothing.colors.panelSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  statusChip: {
    color: nothing.colors.text,
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
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  }
});
