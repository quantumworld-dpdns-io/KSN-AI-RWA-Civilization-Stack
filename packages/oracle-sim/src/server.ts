import Fastify from "fastify";
import { z } from "zod";
import { getAssetTelemetry, listTelemetry } from "./telemetry";
import { getRedisClient } from "./redis.js";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ status: "ok", service: "aks-oracle-sim" }));

app.get("/health/redis", async (request, reply) => {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return { status: "ok", redis: result === "PONG" ? "connected" : "unknown" };
  } catch (err: any) {
    return reply.code(503).send({ status: "error", error: err.message });
  }
});

app.get("/telemetry", async () => ({ assets: listTelemetry() }));

app.get("/telemetry/:assetId", async (request, reply) => {
  const schema = z.object({ assetId: z.string().min(1) });
  const { assetId } = schema.parse(request.params);
  const telemetry = getAssetTelemetry(assetId);

  if (!telemetry) {
    return reply.code(404).send({ error: "asset not found" });
  }

  return telemetry;
});

app.post("/simulate", async (request) => {
  const body = z.object({
    powerWatts: z.number().positive(),
    hashrate: z.number().positive(),
    utilization: z.number().min(0).max(1).default(0.75)
  }).parse(request.body);

  return {
    timestamp: new Date().toISOString(),
    input: body,
    ksnScore: body.powerWatts / body.hashrate,
    note: "Use @aks/core for full classification and yield simulation."
  };
});

const port = Number(process.env.ORACLE_PORT ?? 8787);
app.listen({ port, host: "0.0.0.0" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
