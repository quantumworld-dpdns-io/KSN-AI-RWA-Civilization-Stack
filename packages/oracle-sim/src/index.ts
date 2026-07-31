// Public, side-effect-free entrypoint for the oracle-sim package.
// Only re-exports the telemetry model + integrity helpers so consumers
// (e.g. @aks/agent) can verify signed telemetry without pulling in the
// Fastify server or Redis client.
export {
  SIGNATURE_ALGORITHM,
  buildTelemetry,
  getAssetTelemetry,
  isProductionSigningConfigured,
  listTelemetry,
  verifyTelemetrySignature,
  type AssetTelemetry,
  type OracleSignals,
} from "./telemetry";
