import { telemetryStore } from "@aks/shared";

async function main() {
  console.log("Seeding telemetry data...");
  const now = Date.now();
  
  for (let i = 0; i < 100; i++) {
    await telemetryStore.addTelemetry("sensor-1", {
      id: `evt-${i}`,
      timestamp: now - (100 - i) * 1000,
      value: 50 + Math.random() * 20,
      metadata: { seeded: true }
    });
  }
  
  console.log("Seed complete.");
  process.exit(0);
}

main().catch(console.error);