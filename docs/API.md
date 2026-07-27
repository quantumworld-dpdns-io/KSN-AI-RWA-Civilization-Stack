# Oracle Simulator API

Base URL: `http://localhost:8787`

## Service status

- `GET /health` — liveness plus Redis and signing status. Returns `status: "degraded"` if Redis is unavailable.
- `GET /ready` — readiness; returns HTTP 503 unless Redis is connected.
- `GET /health/redis` — direct Redis dependency health.
- `GET /capabilities` — machine-readable list of telemetry, calculations, integrity controls, persistence, and endpoints.

## Telemetry

- `GET /telemetry` — current snapshot for every sample asset. Valid Redis snapshots are served from cache; misses are generated, signed, cached, and appended to history.
- `GET /telemetry/:assetId` — current snapshot for one asset.
- `POST /telemetry/:assetId/refresh` — force a new signed snapshot and append it to Redis history.
- `GET /telemetry/:assetId/history?limit=50` — newest-first audit history; limit range is 1–500.

Each telemetry payload contains:

```json
{
  "timestamp": "2026-01-01T00:00:00.000Z",
  "asset": {
    "powerWatts": 8500000,
    "hashrate": 420000000000000,
    "utilization": 0.71
  },
  "ksn": {
    "ksnScore": 2.02e-8,
    "kardashevType": 0.093
  },
  "yieldDistribution": {},
  "autonomyRisk": 0.31,
  "oracleConfidence": 0.84,
  "signals": {
    "energySource": "SOLAR",
    "maintenanceCostRate": 0.09,
    "carbonIntensityKgCo2ePerKwh": 0.08,
    "geopoliticalRiskScore": 0.18,
    "legalRiskScore": 0.24,
    "complianceStatus": "COMPLIANT"
  },
  "agency": {
    "stage": "AI_MANAGED",
    "nextStage": "AI_ISSUED",
    "operatingPolicy": {
      "dynamicPriceMultiplier": 1.048,
      "routeToLowestCarbonEnergy": true,
      "reserveMaintenanceCapital": true,
      "mayIssueExpansionClaims": false,
      "mayAcquireOwnership": false,
      "distributesCivilizationDividend": false
    },
    "safetyControls": {
      "externalExecutionEnabled": false,
      "killSwitchAvailable": true,
      "humanApprovalRequiredForIssuanceAndOwnership": true,
      "maxDynamicPriceMultiplier": 1.5
    }
  },
  "payloadHash": "sha256-hex",
  "signatureAlgorithm": "hmac-sha256",
  "telemetrySignature": "hmac-hex"
}
```

## Full custom simulation

```http
POST /simulate
Content-Type: application/json

{
  "powerWatts": 1000000,
  "hashrate": 1000000000000,
  "utilization": 0.8,
  "revenuePerComputeUnit": 1e-12,
  "maintenanceCostRate": 0.08,
  "riskScore": 0.25,
  "carbonIntensityKgCo2ePerKwh": 0.1,
  "geopoliticalRiskScore": 0.25,
  "legalRiskScore": 0.25,
  "agencyStage": "AI_MANAGED"
}
```

Only `powerWatts` and `hashrate` are required. The response includes the compatibility field `ksnScore` plus the full asset, KSN/Kardashev, yield, autonomy, environmental/risk, confidence, hash, and signature model.

## Combined container

Build and run without SQL:

```bash
docker build -f infra/oracle-redis.Dockerfile -t aks-oracle-redis .
docker run --rm -p 8787:8787 \
  -e REDIS_PASSWORD=replace-with-a-strong-password \
  -e ORACLE_SIGNING_SECRET=replace-with-a-strong-signing-secret \
  aks-oracle-redis
```
