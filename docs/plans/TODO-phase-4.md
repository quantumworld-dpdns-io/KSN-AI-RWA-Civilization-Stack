# Phase 4: Oracle & Verification Layer Hardening

**Duration: Months 5–8 | Todos: 105 | Commit prefix: `feat`, `fix`**

---

## 4.1 Multi-Source Oracle Architecture (Todos 351–380)

- [ ] TODO-351: Create `packages/oracle/src/index.ts` oracle module barrel
- [ ] TODO-352: Create `packages/oracle/src/types.ts` oracle types
- [ ] TODO-353: Add `OracleSource` interface
- [ ] TODO-354: Add `TelemetryReport` interface
- [ ] TODO-355: Add `OracleAggregation` interface
- [ ] TODO-356: Add `DisputeWindow` interface
- [ ] TODO-357: Create `packages/oracle/src/sources/base.ts` base oracle source
- [ ] TODO-358: Create `packages/oracle/src/sources/http-source.ts` HTTP oracle
- [ ] TODO-359: Create `packages/oracle/src/sources/mqtt-source.ts` MQTT IoT source
- [ ] TODO-360: Create `packages/oracle/src/sources/grpc-source.ts` gRPC source
- [ ] TODO-361: Create `packages/oracle/src/sources/satellite-source.ts` satellite data
- [ ] TODO-362: Create `packages/oracle/src/sources/device-attest.ts` device attestation
- [ ] TODO-363: Add `packages/oracle/package.json` with dependencies
- [ ] TODO-364: Add `packages/oracle/tsconfig.json`
- [ ] TODO-365: Add `fastify` dependency for oracle API
- [ ] TODO-366: Add `mqtt` dependency for IoT sources
- [ ] TODO-367: Add `@grpc/grpc-js` for gRPC sources
- [ ] TODO-368: Create `packages/oracle/src/sources/index.ts` barrel
- [ ] TODO-369: Add source registration and discovery
- [ ] TODO-370: Add source health monitoring
- [ ] TODO-371: Add source failover logic
- [ ] TODO-372: Add source rate limiting
- [ ] TODO-373: Add source authentication (API keys, mTLS)
- [ ] TODO-374: Create `packages/oracle/src/sources/__tests__/http-source.test.ts`
- [ ] TODO-375: Create `packages/oracle/src/sources/__tests__/mqtt-source.test.ts`
- [ ] TODO-376: Create `packages/oracle/src/sources/__tests__/device-attest.test.ts`
- [ ] TODO-377: Add source configuration validation
- [ ] TODO-378: Add source connection pooling
- [ ] TODO-379: Add source retry logic with exponential backoff
- [ ] TODO-380: Add source telemetry logging

## 4.2 Oracle Aggregation & Medianization (Todos 381–405)

- [ ] TODO-381: Create `packages/oracle/src/aggregation/medianizer.ts` median aggregation
- [ ] TODO-382: Add weighted median based on source reputation
- [ ] TODO-383: Add trimmed mean aggregation
- [ ] TODO-384: Add outlier detection and rejection
- [ ] TODO-385: Create `packages/oracle/src/aggregation/confidence.ts` confidence scoring
- [ ] TODO-386: Add source consistency scoring
- [ ] TODO-387: Add temporal consistency scoring
- [ ] TODO-388: Add cross-source validation scoring
- [ ] TODO-389: Create `packages/oracle/src/aggregation/dispute.ts` dispute mechanism
- [ ] TODO-390: Add dispute window configuration
- [ ] TODO-391: Add dispute submission interface
- [ ] TODO-392: Add dispute resolution logic
- [ ] TODO-393: Add dispute penalty calculation
- [ ] TODO-394: Create `packages/oracle/src/aggregation/slashing.ts` slashing conditions
- [ ] TODO-395: Add telemetry fraud detection
- [ ] TODO-396: Add spoofing detection algorithms
- [ ] TODO-397: Add replay attack detection
- [ ] TODO-398: Add staleness detection
- [ ] TODO-399: Create `packages/oracle/src/aggregation/index.ts` barrel
- [ ] TODO-400: Create `packages/oracle/src/aggregation/__tests__/medianizer.test.ts`
- [ ] TODO-401: Create `packages/oracle/src/aggregation/__tests__/confidence.test.ts`
- [ ] TODO-402: Create `packages/oracle/src/aggregation/__tests__/dispute.test.ts`
- [ ] TODO-403: Create `packages/oracle/src/aggregation/__tests__/slashing.test.ts`
- [ ] TODO-404: Add aggregation performance benchmarks
- [ ] TODO-405: Add aggregation error handling

## 4.3 Signed Telemetry & Cryptographic Verification (Todos 406–430)

- [ ] TODO-406: Create `packages/oracle/src/signing/index.ts` signing module
- [ ] TODO-407: Create `packages/oracle/src/signing/types.ts` signing types
- [ ] TODO-408: Add ECDSA signing support
- [ ] TODO-409: Add Ed25519 signing support
- [ ] TODO-410: Add Schnorr signing support
- [ ] TODO-411: Create `packages/oracle/src/signing/key-manager.ts` key management
- [ ] TODO-412: Add hardware security module (HSM) interface
- [ ] TODO-413: Add key rotation mechanism
- [ ] TODO-414: Add key escrow support
- [ ] TODO-415: Create `packages/oracle/src/signing/attestation.ts` device attestation
- [ ] TODO-416: Add TPM attestation support
- [ ] TODO-417: Add Secure Enclave support
- [ ] TODO-418: Add firmware integrity verification
- [ ] TODO-419: Create `packages/oracle/src/signing/verify.ts` verification
- [ ] TODO-420: Add signature verification functions
- [ ] TODO-421: Add chain of custody verification
- [ ] TODO-422: Add timestamp verification
- [ ] TODO-423: Create `packages/oracle/src/signing/__tests__/signing.test.ts`
- [ ] TODO-424: Create `packages/oracle/src/signing/__tests__/attestation.test.ts`
- [ ] TODO-425: Create `packages/oracle/src/signing/__tests__/verify.test.ts`
- [ ] TODO-426: Add post-quantum signature support (Dilithium stub)
- [ ] TODO-427: Add hybrid signature scheme support
- [ ] TODO-428: Add signature audit logging
- [ ] TODO-429: Add signature storage and retrieval
- [ ] TODO-430: Add cryptographic error handling

## 4.4 Semantic Search & Retrieval (Todos 431–455)

- [ ] TODO-431: Create `packages/oracle/src/search/index.ts` search module
- [ ] TODO-432: Create `packages/oracle/src/search/types.ts` search types
- [ ] TODO-433: Add Weaviate client integration
- [ ] TODO-434: Add semantic search for telemetry patterns
- [ ] TODO-435: Add similarity search for anomaly detection
- [ ] TODO-436: Add hybrid search (vector + keyword)
- [ ] TODO-437: Create `packages/oracle/src/search/indexing.ts` indexing pipeline
- [ ] TODO-438: Add telemetry vectorization
- [ ] TODO-439: Add chunk-based indexing for large datasets
- [ ] TODO-440: Add incremental index updates
- [ ] TODO-441: Create `packages/oracle/src/search/query.ts` query builder
- [ ] TODO-442: Add natural language query support
- [ ] TODO-443: Add structured query support
- [ ] TODO-444: Add temporal query support
- [ ] TODO-445: Add geo-spatial query support
- [ ] TODO-446: Create `packages/oracle/src/search/__tests__/indexing.test.ts`
- [ ] TODO-447: Create `packages/oracle/src/search/__tests__/query.test.ts`
- [ ] TODO-448: Add search result ranking
- [ ] TODO-449: Add search result caching
- [ ] TODO-450: Add search performance monitoring
- [ ] TODO-451: Add search analytics
- [ ] TODO-452: Add search relevance feedback
- [ ] TODO-453: Add search index persistence
- [ ] TODO-454: Add search index backup
- [ ] TODO-455: Add search index restoration

## 4.5 Oracle API & Integration (Todos 456–470)

- [ ] TODO-456: Enhance `/health` endpoint with detailed status
- [ ] TODO-457: Enhance `/telemetry` endpoint with filtering
- [ ] TODO-458: Add `/telemetry/:assetId/history` endpoint
- [ ] TODO-459: Add `/telemetry/:assetId/confidence` endpoint
- [ ] TODO-460: Add `/sources` endpoint listing oracle sources
- [ ] TODO-461: Add `/sources/:sourceId/health` endpoint
- [ ] TODO-462: Add `/disputes` endpoint for dispute management
- [ ] TODO-463: Add `/disputes/:disputeId` endpoint
- [ ] TODO-464: Add `/search` endpoint for semantic search
- [ ] TODO-465: Add `/metrics` endpoint for oracle metrics
- [ ] TODO-466: Add OpenAPI/Swagger documentation
- [ ] TODO-467: Add rate limiting to all endpoints
- [ ] TODO-468: Add request validation with Zod
- [ ] TODO-469: Add response compression
- [ ] TODO-470: Add CORS configuration

---

**Phase 4 Total: 105 todos**
