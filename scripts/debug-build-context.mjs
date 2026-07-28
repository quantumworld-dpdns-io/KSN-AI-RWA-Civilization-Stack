import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const mobilePackageJson = JSON.parse(readFileSync(new URL("../mobile/package.json", import.meta.url), "utf8"));
const lockfile = readFileSync(new URL("../pnpm-lock.yaml", import.meta.url), "utf8");

const payload = {
  sessionId: "5332d7",
  runId: "pre-fix",
  hypothesisId: "H1|H2|H3|H4",
  location: "scripts/debug-build-context.mjs:1",
  message: "build context snapshot",
  data: {
    nodeVersion: process.version,
    packageManager: packageJson.packageManager,
    rootEngine: packageJson.engines?.node ?? null,
    hasMobileImporter: /\n  mobile:\n/.test(lockfile),
    mobileDependencyKeys: Object.keys(mobilePackageJson.dependencies ?? {}),
    mobileDevDependencyKeys: Object.keys(mobilePackageJson.devDependencies ?? {}),
  },
  timestamp: Date.now(),
};

// #region agent log
fetch("http://127.0.0.1:7887/ingest/0ca80672-2cb4-4338-821b-09fb9789ab7f", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "5332d7" },
  body: JSON.stringify(payload),
}).catch(() => {});
// #endregion

