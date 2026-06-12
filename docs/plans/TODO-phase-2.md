# Phase 2: Core Simulation Engine Enhancement

**Duration: Months 2–5 | Todos: 105 | Commit prefix: `feat`, `refactor`**

---

## 2.1 Extended Type System (Todos 111–130)

- [x] TODO-111: Add `EnergySource` type (solar, wind, nuclear, fusion, geothermal, tidal)
- [x] TODO-112: Add `ComputeArchitecture` type (GPU, ASIC, FPGA, TPU, QPU)
- [x] TODO-113: Add `NetworkTopology` type (mesh, hub-spoke, star, orbital-ring)
- [x] TODO-114: Add `GeopoliticalRegion` type enum
- [x] TODO-115: Add `ComplianceStatus` type for regulatory state
- [x] TODO-116: Extend `InfrastructureAsset` with `energySource` field
- [x] TODO-117: Extend `InfrastructureAsset` with `computeArchitecture` field
- [x] TODO-118: Extend `InfrastructureAsset` with `topology` field
- [x] TODO-119: Extend `InfrastructureAsset` with `region` field
- [x] TODO-120: Extend `InfrastructureAsset` with `complianceStatus` field
- [x] TODO-121: Add `QuantumComputeAsset` type extending base
- [x] TODO-122: Add `OrbitalAsset` type for space-based infrastructure
- [x] TODO-123: Add `FusionAsset` type for fusion energy systems
- [x] TODO-124: Add `DysonSwarmNode` type for stellar-scale
- [x] TODO-125: Create `packages/core/src/types/energy.ts`
- [x] TODO-126: Create `packages/core/src/types/compute.ts`
- [x] TODO-127: Create `packages/core/src/types/region.ts`
- [x] TODO-128: Create `packages/core/src/types/quantum.ts`
- [x] TODO-129: Create `packages/core/src/types/orbital.ts`
- [x] TODO-130: Update barrel exports for new type modules

## 2.2 Advanced KSN Metrics (Todos 131–155)

- [x] TODO-131: Create `packages/core/src/metrics/efficiency.ts` energy efficiency metrics
- [x] TODO-132: Add `computePerWatt` metric (operations per watt)
- [x] TODO-133: Add `costPerCompute` metric (USD per TFLOPS)
- [x] TODO-134: Add `carbonIntensity` metric (kgCO2 per kWh)
- [x] TODO-135: Add `availabilityScore` metric (uptime percentage)
- [x] TODO-136: Add `redundancyFactor` metric (N+1, N+2)
- [x] TODO-137: Create `packages/core/src/metrics/kardashev.ts` advanced Kardashev calcs
- [x] TODO-138: Add `extendedKardashevType` with compute weight
- [x] TODO-139: Add `kardashevProgress` (percentage toward next type)
- [x] TODO-140: Add `civilizationEnergyCapacity` (total energy budget)
- [x] TODO-141: Add `civilizationComputeCapacity` (total compute budget)
- [x] TODO-142: Create `packages/core/src/metrics/risk.ts` risk scoring
- [x] TODO-143: Add `operationalRisk` score (downtime, maintenance)
- [x] TODO-144: Add `marketRisk` score (price volatility, demand)
- [x] TODO-145: Add `regulatoryRisk` score (compliance changes)
- [x] TODO-146: Add `technicalRisk` score (architecture obsolescence)
- [x] TODO-147: Add `environmentalRisk` score (carbon, climate)
- [x] TODO-148: Create `packages/core/src/metrics/composite.ts` composite metrics
- [x] TODO-149: Add `totalRiskScore` weighted composite
- [x] TODO-150: Add `investmentAttractiveness` score
- [x] TODO-151: Add `sustainabilityIndex` score
- [x] TODO-152: Add `aiReadinessScore` (how ready for AI governance)
- [x] TODO-153: Create `packages/core/src/metrics/index.ts` barrel
- [x] TODO-154: Add metric validation functions
- [x] TODO-155: Add metric comparison utilities

## 2.3 Vector Database Integration (Todos 156–175)

- [x] TODO-156: Add `chromadb` dependency to packages/shared
- [x] TODO-157: Create `packages/shared/src/vector/chroma-client.ts`
- [x] TODO-158: Create `packages/shared/src/vector/qdrant-client.ts`
- [x] TODO-159: Add `lancedb` dependency
- [x] TODO-160: Create `packages/shared/src/vector/lancedb-client.ts`
- [x] TODO-161: Create `packages/shared/src/vector/types.ts` vector types
- [x] TODO-162: Create `packages/shared/src/vector/embeddings.ts` embedding functions
- [x] TODO-163: Add `openai` embedding support
- [x] TODO-164: Add local embedding support via `@xenova/transformers`
- [x] TODO-165: Create `packages/shared/src/vector/store.ts` unified vector store
- [x] TODO-166: Add similarity search interface
- [x] TODO-167: Add hybrid search (vector + keyword)
- [x] TODO-168: Add metadata filtering
- [x] TODO-169: Create `packages/shared/src/vector/__tests__/store.test.ts`
- [x] TODO-170: Create `packages/shared/src/vector/__tests__/embeddings.test.ts`
- [x] TODO-171: Add ChromaDB to docker-compose.yml
- [x] TODO-172: Add Qdrant to docker-compose.yml
- [x] TODO-173: Create `packages/shared/src/vector/index.ts` barrel
- [x] TODO-174: Add vector store health checks
- [x] TODO-175: Add vector store connection pooling

## 2.4 Data Lakehouse Integration (Todos 176–200)

- [x] TODO-176: Add `duckdb` dependency to packages/shared
- [x] TODO-177: Create `packages/shared/src/lakehouse/duckdb.ts` DuckDB wrapper
- [x] TODO-178: Create `packages/shared/src/lakehouse/types.ts` lakehouse types
- [x] TODO-179: Add `apache-arrow` dependency
- [x] TODO-180: Create `packages/shared/src/lakehouse/arrow.ts` Arrow integration
- [x] TODO-181: Create `packages/shared/src/lakehouse/schema.ts` telemetry schema
- [x] TODO-182: Add Iceberg table format support types
- [x] TODO-183: Create `packages/shared/src/lakehouse/catalog.ts` metadata catalog
- [x] TODO-184: Add Trino query interface stub
- [x] TODO-185: Create `packages/shared/src/lakehouse/query.ts` query builder
- [x] TODO-186: Add telemetry data ingestion pipeline
- [x] TODO-187: Add telemetry data aggregation queries
- [x] TODO-188: Create `packages/shared/src/lakehouse/__tests__/duckdb.test.ts`
- [x] TODO-189: Create `packages/shared/src/lakehouse/__tests__/schema.test.ts`
- [ ] TODO-190: Add DuckDB to docker-compose.yml
- [x] TODO-191: Create `packages/shared/src/lakehouse/index.ts` barrel
- [x] TODO-192: Add telemetry export to Parquet format
- [x] TODO-193: Add telemetry export to CSV format
- [x] TODO-194: Add telemetry time-series partitioning
- [x] TODO-195: Add data retention policy configuration
- [x] TODO-196: Create `packages/shared/src/lakehouse/pipeline.ts` ETL pipeline
- [ ] TODO-197: Add pipeline scheduling configuration
- [ ] TODO-198: Add pipeline error handling and retry logic
- [x] TODO-199: Create `packages/shared/src/lakehouse/metrics.ts` data quality metrics
- [ ] TODO-200: Add data lineage tracking

## 2.5 Core Test Suite (Todos 201–215)

- [x] TODO-201: Migrate tests from `assert` to `vitest`
- [x] TODO-202: Add `vitest` dependency to packages/core
- [x] TODO-203: Create `packages/core/vitest.config.ts`
- [x] TODO-204: Rewrite `core.test.ts` as `ksn.test.ts` with vitest
- [x] TODO-205: Create `packages/core/src/metrics/__tests__/efficiency.test.ts`
- [x] TODO-206: Create `packages/core/src/metrics/__tests__/kardashev.test.ts`
- [x] TODO-207: Create `packages/core/src/metrics/__tests__/risk.test.ts`
- [x] TODO-208: Create `packages/core/src/metrics/__tests__/composite.test.ts`
- [x] TODO-209: Create `packages/core/src/yield.test.ts` yield distribution tests
- [x] TODO-210: Create `packages/core/src/agency.test.ts` agency stage tests
- [ ] TODO-211: Add edge case tests (zero values, negative, overflow)
- [ ] TODO-212: Add property-based tests with `fast-check`
- [ ] TODO-213: Add snapshot tests for deterministic outputs
- [ ] TODO-214: Add performance benchmarks with `vitest bench`
- [ ] TODO-215: Achieve >90% code coverage in packages/core


---

**Phase 2 Total: 105 todos**
