import { randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import { closeRedisClient } from "./redis";
import { MemoryTelemetryStore, RedisTelemetryStore, type TelemetryStore } from "./store";
import {
  buildTelemetry,
  getAssetTelemetry,
  isProductionSigningConfigured,
  listTelemetry,
  verifyTelemetrySignature,
  type AssetTelemetry
} from "./telemetry";
import type { AgencyStage, AssetClass, InfrastructureAsset } from "@aks/core";

const assetParamsSchema = z.object({ assetId: z.string().min(1).max(160) });
const historyQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(500).default(50) });
const simulationSchema = z.object({
  powerWatts: z.number().positive(),
  hashrate: z.number().positive(),
  utilization: z.number().min(0).max(1).default(0.75),
  revenuePerComputeUnit: z.number().nonnegative().default(1e-12),
  maintenanceCostRate: z.number().min(0).max(1).default(0.08),
  riskScore: z.number().min(0).max(1).default(0.25),
  carbonIntensityKgCo2ePerKwh: z.number().nonnegative().default(0.1),
  geopoliticalRiskScore: z.number().min(0).max(1).default(0.25),
  legalRiskScore: z.number().min(0).max(1).default(0.25),
  agencyStage: z.enum([
    "HUMAN_OWNED", "AI_MANAGED", "AI_ISSUED", "AI_CO_OWNED", "SOVEREIGN_AI_ASSET",
    "PLANETARY_AI_ALLOCATOR", "KARDASHEV_CONVERGENCE"
  ]).default("AI_MANAGED")
});

export interface BuildAppOptions {
  store?: TelemetryStore;
  logger?: boolean;
}

// Routes that mutate persisted state and therefore require an API key.
const PROTECTED_ROUTES = new Set(["/telemetry/:assetId/refresh"]);

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? true });
  const store = options.store ?? createTelemetryStore();

  // Require an API key on state-mutating routes. When ORACLE_API_KEY is
  // configured, protected routes must present a matching x-api-key header;
  // otherwise those routes are disabled. Read + pure-compute routes stay open
  // (protect them from abuse via rate limiting instead).
  const apiKey = process.env.ORACLE_API_KEY ?? process.env.API_KEY;
  app.addHook("onRequest", async (request, reply) => {
    const routeUrl = request.routeOptions?.url;
    if (!routeUrl || !PROTECTED_ROUTES.has(routeUrl)) return;
    if (!apiKey) {
      return reply.code(503).send({ error: "write_disabled", detail: "ORACLE_API_KEY not configured" });
    }
    if (request.headers["x-api-key"] !== apiKey) {
      return reply.code(401).send({ error: "unauthorized" });
    }
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: "validation_error", issues: error.issues });
    }
    app.log.error(error);
    return reply.code(500).send({ error: "internal_error" });
  });

  app.get("/health", async () => {
    const redis = await redisHealth(store);
    return {
      status: redis ? "ok" : "degraded",
      service: "aks-oracle-sim",
      redis: store.kind === "memory" ? "memory" : redis ? "connected" : "unavailable",
      persistence: store.kind,
      signing: isProductionSigningConfigured() ? "configured" : "development-key",
      timestamp: new Date().toISOString()
    };
  });

  app.get("/ready", async (_request, reply) => {
    const ready = await redisHealth(store);
    return reply.code(ready ? 200 : 503).send({
      status: ready ? "ready" : "not_ready",
      redis: store.kind === "memory" ? "memory" : ready ? "connected" : "unavailable",
      persistence: store.kind
    });
  });

  app.get("/health/redis", async (_request, reply) => {
    const connected = await redisHealth(store);
    return reply.code(connected ? 200 : 503).send({
      status: connected ? "ok" : "error",
      redis: store.kind === "memory" ? "memory" : connected ? "connected" : "unavailable",
      persistence: store.kind
    });
  });

  app.get("/capabilities", async () => ({
    service: "aks-oracle-sim",
    persistence: store.kind,
    sqlPersistence: false,
    telemetry: ["energy", "compute", "utilization", "maintenance", "carbon", "geopolitical-risk", "legal-risk"],
    calculations: ["ksn-score", "kardashev-type", "yield-distribution", "autonomy-risk", "oracle-confidence"],
    integrity: ["sha256-payload-hash", "hmac-sha256-signature", "bounded-audit-history"],
    endpoints: ["/health", "/ready", "/health/redis", "/telemetry", "/telemetry/:assetId", "/telemetry/:assetId/history", "/telemetry/:assetId/refresh", "/simulate"]
  }));

  app.get("/telemetry", async () => {
    const generated = listTelemetry();
    const assets = await Promise.all(generated.map((snapshot) => resolveSnapshot(store, snapshot, false)));
    return { assets };
  });

  app.get("/telemetry/:assetId/history", async (request, reply) => {
    const { assetId } = assetParamsSchema.parse(request.params);
    if (!getAssetTelemetry(assetId)) return reply.code(404).send({ error: "asset_not_found" });
    const { limit } = historyQuerySchema.parse(request.query);
    try {
      const items = await store.history(assetId, limit);
      return { assetId, count: items.length, items };
    } catch (error) {
      request.log.warn({ error, persistence: store.kind }, "Telemetry history unavailable");
      return reply.code(503).send({ error: "telemetry_history_unavailable" });
    }
  });

  app.post("/telemetry/:assetId/refresh", async (request, reply) => {
    const { assetId } = assetParamsSchema.parse(request.params);
    const snapshot = getAssetTelemetry(assetId);
    if (!snapshot) return reply.code(404).send({ error: "asset_not_found" });
    return reply.code(201).send(await resolveSnapshot(store, snapshot, true));
  });

  app.get("/telemetry/:assetId", async (request, reply) => {
    const { assetId } = assetParamsSchema.parse(request.params);
    const snapshot = getAssetTelemetry(assetId);
    if (!snapshot) return reply.code(404).send({ error: "asset_not_found" });
    return resolveSnapshot(store, snapshot, false);
  });

  app.post("/simulate", async (request) => {
    const input = simulationSchema.parse(request.body);
    const asset: InfrastructureAsset = {
      id: "custom-simulation",
      name: "Custom KSN Scenario",
      assetClass: "MICROGRID_GPU_CLUSTER" as AssetClass,
      powerWatts: input.powerWatts,
      hashrate: input.hashrate,
      utilization: input.utilization,
      revenuePerComputeUnit: input.revenuePerComputeUnit,
      maintenanceCostRate: input.maintenanceCostRate,
      riskScore: input.riskScore,
      agencyStage: input.agencyStage as AgencyStage,
      carbonIntensityKgCo2ePerKwh: input.carbonIntensityKgCo2ePerKwh,
      geopoliticalRiskScore: input.geopoliticalRiskScore,
      legalRiskScore: input.legalRiskScore,
      energySource: "SOLAR",
      computeArchitecture: "GPU",
      topology: "MESH",
      region: "APAC",
      complianceStatus: "PENDING_REVIEW"
    };
    const result = buildTelemetry(asset, new Date().toISOString(), false);
    return {
      ...result,
      input,
      ksnScore: result.ksn.ksnScore,
      note: "Full KSN, Kardashev, yield, autonomy, risk, and integrity model computed by @aks/core and @aks/oracle-sim.",
      signatureValid: verifyTelemetrySignature(result)
    };
  });

  if (!options.store && store.kind === "redis") app.addHook("onClose", async () => closeRedisClient());
  return app;
}

function createTelemetryStore(): TelemetryStore {
  return process.env.ORACLE_STORE === "memory" ? new MemoryTelemetryStore() : new RedisTelemetryStore();
}

function telemetryFreshnessMs(): number {
  const seconds = Number(process.env.TELEMETRY_CACHE_TTL_SECONDS ?? "300");
  return (Number.isFinite(seconds) && seconds > 0 ? seconds : 300) * 1000;
}

function isFresh(telemetry: AssetTelemetry): boolean {
  const ageMs = Date.now() - Date.parse(telemetry.timestamp);
  return Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= telemetryFreshnessMs();
}

async function resolveSnapshot(store: TelemetryStore, generated: AssetTelemetry, force: boolean): Promise<AssetTelemetry> {
  if (!force) {
    try {
      const cached = await store.current(generated.asset.id);
      // Reject replay of a stale-but-signed snapshot: a valid signature is not
      // enough, the timestamp must also be within the freshness window.
      if (cached && verifyTelemetrySignature(cached) && isFresh(cached)) return cached;
    } catch {
      // Serve signed simulator data when Redis is temporarily unavailable.
    }
  }
  try {
    await store.save(generated);
  } catch {
    // Redis readiness exposes persistence failure; telemetry remains available.
  }
  return generated;
}

async function redisHealth(store: TelemetryStore): Promise<boolean> {
  try {
    return await store.ping();
  } catch {
    return false;
  }
}

export async function start(): Promise<void> {
  validateRuntimeConfiguration();
  const app = buildApp();
  const port = Number(process.env.ORACLE_PORT ?? 8787);
  await app.listen({ port, host: "0.0.0.0" });
  installShutdownHandlers(app);
}

export function validateRuntimeConfiguration(): void {
  if (process.env.NODE_ENV !== "production") return;

  // Signing key: prefer an operator-provided persistent secret. If absent, mint
  // a strong EPHEMERAL one instead of crash-looping the container. This still
  // signs telemetry with an unguessable key (unlike the old public dev key) —
  // it just isn't stable across restarts/replicas, so set a persistent value
  // (ORACLE_SIGNING_SECRET) for signatures that verify off-box.
  if (!process.env.ORACLE_SIGNING_SECRET) {
    process.env.ORACLE_SIGNING_SECRET = randomBytes(32).toString("hex");
    console.warn(
      "[oracle] ORACLE_SIGNING_SECRET not set — generated an ephemeral signing key. " +
        "Set a persistent ORACLE_SIGNING_SECRET for cross-restart, off-box-verifiable signatures.",
    );
  } else if (process.env.ORACLE_SIGNING_SECRET.length < 16) {
    // A provided secret that's too weak is a real misconfiguration — fail loudly.
    throw new Error("Production secret ORACLE_SIGNING_SECRET must contain at least 16 characters.");
  }

  // Redis auth is genuinely required when the Redis store is used.
  if (process.env.ORACLE_STORE !== "memory") {
    if (!process.env.REDIS_PASSWORD) {
      throw new Error("Missing required production environment variables: REDIS_PASSWORD");
    }
    if (process.env.REDIS_PASSWORD.length < 16) {
      throw new Error("Production secret REDIS_PASSWORD must contain at least 16 characters.");
    }
  }

  // ORACLE_API_KEY only gates the write route — its absence disables writes but
  // must NOT take the whole (read-serving) service down. Warn, don't throw.
  if (!process.env.ORACLE_API_KEY) {
    console.warn("[oracle] ORACLE_API_KEY not set — state-mutating routes are disabled (reads still served).");
  }
}

function installShutdownHandlers(app: FastifyInstance): void {
  let closing = false;
  const shutdown = async (signal: NodeJS.Signals) => {
    if (closing) return;
    closing = true;
    app.log.info({ signal }, "Shutting down Oracle service");
    try {
      await app.close();
      process.exitCode = 0;
    } catch (error) {
      app.log.error(error, "Oracle shutdown failed");
      process.exitCode = 1;
    }
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
