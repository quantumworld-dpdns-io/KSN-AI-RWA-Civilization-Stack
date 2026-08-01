import "server-only";
import { randomBytes } from "node:crypto";
import { SAMPLE_ASSETS } from "@aks/core";
import {
  buildTelemetry,
  isProductionSigningConfigured,
  listTelemetry,
  type AssetTelemetry as OracleAssetTelemetry,
  getAssetTelemetry as osGetAssetTelemetry,
} from "@aks/oracle-sim";
import { normalizeTelemetry, normalizeTelemetryList } from "./normalize";
import type {
  AssetTelemetry,
  OracleCapabilities,
  ServiceHealth,
  SimulationResult,
  TelemetryHistory,
} from "./types";

const DEFAULT_ORACLE_URL = "http://127.0.0.1:8787";

// Whether a persistent signing secret was supplied by the operator (captured
// BEFORE we auto-provision an ephemeral one below).
const SIGNING_CONFIGURED = isProductionSigningConfigured();
// So the in-process telemetry builder can sign without crashing when the web
// deployment has no ORACLE_SIGNING_SECRET (the dashboard only displays data).
if (!process.env.ORACLE_SIGNING_SECRET) {
  process.env.ORACLE_SIGNING_SECRET = randomBytes(32).toString("hex");
}

export function resolveOracleBaseUrl(): string {
  return (process.env.ORACLE_API_URL ?? process.env.ORACLE_URL ?? DEFAULT_ORACLE_URL).replace(
    /\/$/,
    ""
  );
}

function oracleUpstreamMeta(baseUrl: string) {
  try {
    const parsed = new URL(baseUrl);
    return {
      upstreamHost: parsed.host,
      upstreamPath: parsed.pathname,
      isLoopback: parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost",
      looksLikeNextOracleProxy:
        parsed.pathname.includes("/api/oracle") || parsed.host.includes("dennisleehappy.org"),
    };
  } catch {
    return {
      upstreamHost: "invalid",
      upstreamPath: "",
      isLoopback: false,
      looksLikeNextOracleProxy: false,
    };
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const resolvedBaseUrl = resolveOracleBaseUrl();
  const meta = oracleUpstreamMeta(resolvedBaseUrl);
  const response = await fetch(`${resolvedBaseUrl}${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(4_000),
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const err = new Error(`Oracle request failed (${response.status})`) as Error & {
      upstream?: Record<string, unknown>;
    };
    err.upstream = { ...meta, status: response.status, path };
    throw err;
  }
  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// In-process fallback: when the upstream oracle service is unreachable (e.g.
// the Choreo backend is suspended/down), the web app computes telemetry itself
// via @aks/oracle-sim + @aks/core so the dashboard stays live. Backed by a
// bounded in-memory history — the "in-memory" cache the health card reports.
// ---------------------------------------------------------------------------
const HISTORY_LIMIT = 500;
const memoryHistory = new Map<string, OracleAssetTelemetry[]>();

function recordHistory(snapshot: OracleAssetTelemetry): void {
  const list = memoryHistory.get(snapshot.asset.id) ?? [];
  list.push(snapshot);
  if (list.length > HISTORY_LIMIT) list.splice(0, list.length - HISTORY_LIMIT);
  memoryHistory.set(snapshot.asset.id, list);
}

function localTelemetry(): OracleAssetTelemetry[] {
  const generated = listTelemetry();
  for (const snapshot of generated) recordHistory(snapshot);
  return generated;
}

function localCapabilities(): OracleCapabilities {
  return {
    service: "aks-oracle-sim",
    persistence: "memory",
    sqlPersistence: false,
    telemetry: [
      "energy",
      "compute",
      "utilization",
      "maintenance",
      "carbon",
      "geopolitical-risk",
      "legal-risk",
    ],
    calculations: [
      "ksn-score",
      "kardashev-type",
      "yield-distribution",
      "autonomy-risk",
      "oracle-confidence",
    ],
    integrity: ["sha256-payload-hash", "hmac-sha256-signature", "bounded-audit-history"],
    endpoints: [
      "/health",
      "/ready",
      "/health/redis",
      "/telemetry",
      "/telemetry/:assetId",
      "/telemetry/:assetId/history",
      "/telemetry/:assetId/refresh",
      "/simulate",
    ],
  };
}

export async function getTelemetry(): Promise<AssetTelemetry[]> {
  try {
    const data = await request<{ assets: AssetTelemetry[] }>("/telemetry");
    return normalizeTelemetryList(data.assets);
  } catch {
    return normalizeTelemetryList(localTelemetry() as unknown as AssetTelemetry[]);
  }
}

export async function getHealth(): Promise<ServiceHealth & { debug?: Record<string, unknown> }> {
  const checkedAt = new Date().toISOString();
  const meta = oracleUpstreamMeta(resolveOracleBaseUrl());
  try {
    const [oracle, redis] = await Promise.all([
      request<{ status: string; signing?: ServiceHealth["signing"] }>("/health"),
      request<{ status: string; redis?: string }>("/health/redis").catch(
        (): { status: string; redis?: string } => ({
          status: "error",
        })
      ),
    ]);
    return {
      oracle: oracle.status === "ok" || oracle.status === "degraded" ? "online" : "offline",
      redis:
        redis.redis === "memory"
          ? "memory"
          : redis.status === "ok" && redis.redis === "connected"
            ? "connected"
            : "offline",
      signing: oracle.signing ?? "unknown",
      checkedAt,
      debug: meta,
    };
  } catch {
    // Upstream unreachable → serve health for the in-process oracle.
    return {
      oracle: "online",
      redis: "memory",
      signing: SIGNING_CONFIGURED ? "configured" : "development-key",
      checkedAt,
      debug: { ...meta, mode: "in-process-fallback" },
    };
  }
}

export async function getCapabilities(): Promise<OracleCapabilities> {
  try {
    return await request<OracleCapabilities>("/capabilities");
  } catch {
    return localCapabilities();
  }
}

export async function getTelemetryHistory(assetId: string, limit = 50): Promise<TelemetryHistory> {
  try {
    const history = await request<TelemetryHistory>(
      `/telemetry/${encodeURIComponent(assetId)}/history?limit=${limit}`
    );
    return { ...history, items: normalizeTelemetryList(history.items) };
  } catch {
    // Ensure at least one snapshot exists so the history view isn't empty.
    if (!memoryHistory.get(assetId)?.length) localTelemetry();
    const items = (memoryHistory.get(assetId) ?? []).slice(-limit).reverse();
    return {
      assetId,
      count: items.length,
      items: normalizeTelemetryList(items as unknown as AssetTelemetry[]),
    };
  }
}

export async function refreshTelemetry(assetId: string): Promise<AssetTelemetry> {
  try {
    return normalizeTelemetry(
      await request<AssetTelemetry>(`/telemetry/${encodeURIComponent(assetId)}/refresh`, {
        method: "POST",
      })
    );
  } catch {
    const snapshot = osGetAssetTelemetry(assetId);
    if (!snapshot) throw new Error("asset_not_found");
    recordHistory(snapshot);
    return normalizeTelemetry(snapshot as unknown as AssetTelemetry);
  }
}

export async function simulate(input: {
  powerWatts: number;
  hashrate: number;
  utilization: number;
}): Promise<SimulationResult> {
  try {
    return await request<SimulationResult>("/simulate", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch {
    const base = SAMPLE_ASSETS[0];
    const result = buildTelemetry(
      {
        ...base,
        id: "custom-simulation",
        name: "Custom KSN Scenario",
        powerWatts: input.powerWatts,
        hashrate: input.hashrate,
        utilization: input.utilization,
      },
      new Date().toISOString(),
      false
    );
    return {
      ...(result as unknown as SimulationResult),
      input,
      ksnScore: result.ksn.ksnScore,
      note: "Computed in-process by @aks/core + @aks/oracle-sim (upstream oracle unavailable).",
      signatureValid: true,
    };
  }
}
