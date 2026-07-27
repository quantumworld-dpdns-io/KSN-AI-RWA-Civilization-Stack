import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export interface CredentialSettings {
  nasaApiKey: string;
  apifyToken: string;
}

const STORAGE_KEY = "ksn-mobile.credentials.v1";

function getWebStorage(): StorageLike | null {
  const storage = (globalThis as GlobalThisWithStorage).localStorage;
  return storage ?? null;
}

export async function loadCredentialSettings(): Promise<CredentialSettings | null> {
  const raw = await readStoredValue();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CredentialSettings>;
    return {
      nasaApiKey: typeof parsed.nasaApiKey === "string" ? parsed.nasaApiKey : "",
      apifyToken: typeof parsed.apifyToken === "string" ? parsed.apifyToken : ""
    };
  } catch {
    return null;
  }
}

export async function saveCredentialSettings(settings: CredentialSettings): Promise<void> {
  const raw = JSON.stringify(settings);
  if (Platform.OS === "web") {
    getWebStorage()?.setItem(STORAGE_KEY, raw);
    return;
  }

  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.setItemAsync(STORAGE_KEY, raw);
  }
}

export async function clearCredentialSettings(): Promise<void> {
  if (Platform.OS === "web") {
    getWebStorage()?.removeItem(STORAGE_KEY);
    return;
  }

  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  }
}

async function readStoredValue(): Promise<string | null> {
  if (Platform.OS === "web") {
    return getWebStorage()?.getItem(STORAGE_KEY) ?? null;
  }

  if (await SecureStore.isAvailableAsync()) {
    return SecureStore.getItemAsync(STORAGE_KEY);
  }

  return null;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface GlobalThisWithStorage {
  localStorage?: StorageLike;
}
