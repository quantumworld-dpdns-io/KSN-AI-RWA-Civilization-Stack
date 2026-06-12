# Oracle Simulator API

Base URL:

```txt
http://localhost:8787
```

## Health

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "service": "aks-oracle-sim"
}
```

## List telemetry

```http
GET /telemetry
```

Returns all sample asset telemetry.

## Read asset telemetry

```http
GET /telemetry/type-07-taipei-microgrid-gpu
```

Response shape:

```json
{
  "timestamp": "2026-01-01T00:00:00.000Z",
  "asset": {},
  "ksn": {},
  "yieldDistribution": {},
  "autonomyRisk": 0.31,
  "oracleConfidence": 0.84,
  "telemetrySignature": "mock-signature-..."
}
```

## Simulate custom KSN

```http
POST /simulate
Content-Type: application/json

{
  "powerWatts": 1000000,
  "hashrate": 1000000000000,
  "utilization": 0.8
}
```
