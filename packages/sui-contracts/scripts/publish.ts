import { execSync } from "node:child_process";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, "..");

function deploymentFileName(activeEnv: string): string {
  return activeEnv === "local" ? "localnet.json" : `${activeEnv}.json`;
}

function main(): void {
  execSync("sui move build --build-env testnet", { cwd: packageRoot, stdio: "inherit" });

  const activeEnv = execSync("sui client active-env", { encoding: "utf8" }).trim();
  const outputPath = join(packageRoot, "deployments", deploymentFileName(activeEnv));
  const ephemeralPub = join(packageRoot, "Pub.local.toml");
  if (activeEnv === "local" && existsSync(ephemeralPub)) {
    unlinkSync(ephemeralPub);
  }

  const publishCmd =
    activeEnv === "local"
      ? "sui client test-publish --build-env testnet --gas-budget 200000000 --json"
      : "sui client publish --gas-budget 200000000 --json";

  const publishOutput = execSync(publishCmd, { cwd: packageRoot, encoding: "utf8" });

  const result = JSON.parse(publishOutput) as {
    objectChanges: Array<{ type?: string; objectType?: string; objectId?: string; packageId?: string }>;
    effects?: { created?: Array<{ reference?: { objectId?: string } }> };
  };

  const packageId = result.objectChanges.find((c) => c.type === "published")?.packageId;
  const adminCap = result.objectChanges.find(
    (c) => c.objectType?.includes("AdminCap"),
  )?.objectId;

  if (!packageId) {
    throw new Error("Failed to resolve packageId from publish output");
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(
    outputPath,
    JSON.stringify(
      {
        network: process.env.SUI_NETWORK ?? activeEnv,
        packageId,
        adminCap,
        publishedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  console.log(`Published package: ${packageId}`);
  if (adminCap) {
    console.log(`AdminCap: ${adminCap}`);
  }
  console.log(`Saved deployment to ${outputPath}`);
}

main();
