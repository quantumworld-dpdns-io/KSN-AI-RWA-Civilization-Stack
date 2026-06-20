import type { AssetTelemetry, OracleCapabilities, ServiceHealth, SimulationResult, TelemetryHistory } from "./types";

const DEFAULT_ORACLE_URL = "http://127.0.0.1:8787";

function baseUrl() {
  return (process.env.ORACLE_API_URL ?? process.env.ORACLE_URL ?? DEFAULT_ORACLE_URL).replace(/\/$/, "");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(4_000),
    headers: { "content-type": "application/json", ...init?.headers }
  });
  if (!response.ok) throw new Error(`Oracle request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function getTelemetry(): Promise<AssetTelemetry[]> {
  const data = await request<{ assets: AssetTelemetry[] }>("/telemetry");
  return data.assets;
}

export async function getHealth(): Promise<ServiceHealth> {
  const checkedAt = new Date().toISOString();
  try {
    const [oracle, redis] = await Promise.all([
      request<{ status: string; signing?: ServiceHealth["signing"] }>("/health"),
      request<{ status: string; redis?: string }>("/health/redis").catch((): { status: string; redis?: string } => ({ status: "error" }))
    ]);
    return {
      oracle: oracle.status === "ok" || oracle.status === "degraded" ? "online" : "offline",
      redis: redis.status === "ok" && redis.redis === "connected" ? "connected" : "offline",
      signing: oracle.signing ?? "unknown",
      checkedAt
    };
  } catch (error) {
    return { oracle: "offline", redis: "unknown", signing: "unknown", checkedAt, message: error instanceof Error ? error.message : "Unavailable" };
  }
}

export function getCapabilities(): Promise<OracleCapabilities> {
  return request<OracleCapabilities>("/capabilities");
}

export function getTelemetryHistory(assetId: string, limit = 50): Promise<TelemetryHistory> {
  return request<TelemetryHistory>(`/telemetry/${encodeURIComponent(assetId)}/history?limit=${limit}`);
}

export function refreshTelemetry(assetId: string): Promise<AssetTelemetry> {
  return request<AssetTelemetry>(`/telemetry/${encodeURIComponent(assetId)}/refresh`, { method: "POST" });
}

export function simulate(input: { powerWatts: number; hashrate: number; utilization: number }) {
  return request<SimulationResult>("/simulate", { method: "POST", body: JSON.stringify(input) });
}
