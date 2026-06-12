import { getAssetTelemetry } from "./telemetry";

const telemetry = getAssetTelemetry("type-07-taipei-microgrid-gpu");
if (!telemetry) throw new Error("expected telemetry");
if (telemetry.ksn.ksnScore <= 0) throw new Error("expected positive KSN score");
console.log("oracle tests passed");
