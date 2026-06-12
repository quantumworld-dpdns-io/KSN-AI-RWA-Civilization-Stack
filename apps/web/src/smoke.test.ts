import { SAMPLE_ASSETS, snapshotAsset } from "@aks/core";

if (SAMPLE_ASSETS.length < 3) throw new Error("expected sample assets");
for (const asset of SAMPLE_ASSETS) {
  const snapshot = snapshotAsset(asset);
  if (!Number.isFinite(snapshot.ksnScore)) throw new Error("invalid KSN score");
}
console.log("web smoke test passed");
