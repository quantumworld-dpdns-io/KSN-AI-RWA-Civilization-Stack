import type { AssetTelemetry, OracleCapabilities, ServiceHealth, SimulationResult, TelemetryHistory } from "./types";
import { normalizeTelemetry, normalizeTelemetryList } from "./normalize";

const DEFAULT_ORACLE_URL = "http://127.0.0.1:8787";

// #region agent log
function debugOracleLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  runId: string,
  hypothesisId: string,
) {
  fetch("http://127.0.0.1:7887/ingest/0ca80672-2cb4-4338-821b-09fb9789ab7f", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "52a969" },
    body: JSON.stringify({
      sessionId: "52a969",
      location,
      message,
      data,
      runId,
      hypothesisId,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}
// #endregion

export function resolveOracleBaseUrl(): string {
  return (process.env.ORACLE_API_URL ?? process.env.ORACLE_URL ?? DEFAULT_ORACLE_URL).replace(/\/$/, "");
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
  // #region agent log
  debugOracleLog(
    "apps/web/src/lib/oracle.ts:request:start",
    "oracle request start",
    { path, method: init?.method ?? "GET", ...meta, baseUrl: resolvedBaseUrl },
    "pre-fix",
    "H1|H2|H3",
  );
  // #endregion
  try {
    const response = await fetch(`${resolvedBaseUrl}${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
      headers: { "content-type": "application/json", ...init?.headers },
    });
    // #region agent log
    debugOracleLog(
      "apps/web/src/lib/oracle.ts:request:response",
      "oracle request response",
      {
        path,
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get("content-type"),
        ...meta,
      },
      "pre-fix",
      "H2|H3|H4",
    );
    // #endregion
    if (!response.ok) {
      const err = new Error(`Oracle request failed (${response.status})`) as Error & {
        upstream?: Record<string, unknown>;
      };
      err.upstream = { ...meta, status: response.status, path };
      throw err;
    }
    return response.json() as Promise<T>;
  } catch (error) {
    // #region agent log
    debugOracleLog(
      "apps/web/src/lib/oracle.ts:request:error",
      "oracle request error",
      {
        path,
        ...meta,
        baseUrl: resolvedBaseUrl,
        error: error instanceof Error ? error.message : "unknown",
      },
      "pre-fix",
      "H1|H2|H5",
    );
    // #endregion
    throw error;
  }
}

export async function getTelemetry(): Promise<AssetTelemetry[]> {
  const data = await request<{ assets: AssetTelemetry[] }>("/telemetry");
  return normalizeTelemetryList(data.assets);
}

export async function getHealth(): Promise<ServiceHealth & { debug?: Record<string, unknown> }> {
  const checkedAt = new Date().toISOString();
  const meta = oracleUpstreamMeta(resolveOracleBaseUrl());
  try {
    const [oracle, redis] = await Promise.all([
      request<{ status: string; signing?: ServiceHealth["signing"] }>("/health"),
      request<{ status: string; redis?: string }>("/health/redis").catch((): { status: string; redis?: string } => ({
        status: "error",
      })),
    ]);
    return {
      oracle: oracle.status === "ok" || oracle.status === "degraded" ? "online" : "offline",
      redis: redis.status === "ok" && redis.redis === "connected" ? "connected" : "offline",
      signing: oracle.signing ?? "unknown",
      checkedAt,
      // #region agent log
      debug: { ...meta, runId: "pre-fix" },
      // #endregion
    };
  } catch (error) {
    const upstream =
      error && typeof error === "object" && "upstream" in error
        ? (error as { upstream?: Record<string, unknown> }).upstream
        : meta;
    return {
      oracle: "offline",
      redis: "unknown",
      signing: "unknown",
      checkedAt,
      message: error instanceof Error ? error.message : "Unavailable",
      // #region agent log
      debug: { ...upstream, runId: "pre-fix", hypothesisId: "H1|H2|H3" },
      // #endregion
    };
  }
}

export function getCapabilities(): Promise<OracleCapabilities> {
  return request<OracleCapabilities>("/capabilities");
}

export async function getTelemetryHistory(assetId: string, limit = 50): Promise<TelemetryHistory> {
  const history = await request<TelemetryHistory>(
    `/telemetry/${encodeURIComponent(assetId)}/history?limit=${limit}`,
  );
  // #region agent log
  debugOracleLog(
    "apps/web/src/lib/oracle.ts:history",
    "oracle history payload",
    {
      assetId,
      limit,
      itemCount: Array.isArray(history.items) ? history.items.length : -1,
      count: history.count ?? null,
    },
    "pre-fix",
    "H3|H4",
  );
  // #endregion
  return { ...history, items: normalizeTelemetryList(history.items) };
}

export async function refreshTelemetry(assetId: string): Promise<AssetTelemetry> {
  return normalizeTelemetry(
    await request<AssetTelemetry>(`/telemetry/${encodeURIComponent(assetId)}/refresh`, { method: "POST" }),
  );
}

export function simulate(input: { powerWatts: number; hashrate: number; utilization: number }) {
  return request<SimulationResult>("/simulate", { method: "POST", body: JSON.stringify(input) });
}
