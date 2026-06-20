import { pathToFileURL } from "node:url";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import { closeRedisClient } from "./redis";
import { RedisTelemetryStore, type TelemetryStore } from "./store";
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

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: options.logger ?? true });
  const store = options.store ?? new RedisTelemetryStore();

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
      redis: redis ? "connected" : "unavailable",
      signing: isProductionSigningConfigured() ? "configured" : "development-key",
      timestamp: new Date().toISOString()
    };
  });

  app.get("/ready", async (_request, reply) => {
    const ready = await redisHealth(store);
    return reply.code(ready ? 200 : 503).send({ status: ready ? "ready" : "not_ready", redis: ready ? "connected" : "unavailable" });
  });

  app.get("/health/redis", async (_request, reply) => {
    const connected = await redisHealth(store);
    return reply.code(connected ? 200 : 503).send({ status: connected ? "ok" : "error", redis: connected ? "connected" : "unavailable" });
  });

  app.get("/capabilities", async () => ({
    service: "aks-oracle-sim",
    persistence: "redis",
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
      request.log.warn({ error }, "Redis history unavailable");
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

  if (!options.store) app.addHook("onClose", async () => closeRedisClient());
  return app;
}

async function resolveSnapshot(store: TelemetryStore, generated: AssetTelemetry, force: boolean): Promise<AssetTelemetry> {
  if (!force) {
    try {
      const cached = await store.current(generated.asset.id);
      if (cached && verifyTelemetrySignature(cached)) return cached;
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
}

function validateRuntimeConfiguration(): void {
  if (process.env.NODE_ENV !== "production") return;
  const missing = ["REDIS_PASSWORD", "ORACLE_SIGNING_SECRET"].filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
