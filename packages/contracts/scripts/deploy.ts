import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { network } from "hardhat";

const SEPOLIA_CHAIN_ID = 11155111n;

async function main() {
  const { ethers, networkName } = await network.connect();
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("No deployer signer configured");

  const chain = await ethers.provider.getNetwork();
  const isEphemeral = chain.chainId === 31337n;
  if (!isEphemeral && chain.chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error(`Refusing deployment to chain ${chain.chainId}; expected Sepolia (${SEPOLIA_CHAIN_ID})`);
  }

  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  if (!isEphemeral && balance === 0n) throw new Error("Sepolia deployer has no ETH");

  const oracle = await ethers.deployContract("KSNOracleAdapter", [deployerAddress], deployer);
  await oracle.waitForDeployment();

  const maxProposalValue = ethers.parseEther(process.env.MAX_PROPOSAL_VALUE_ETH ?? "0.1");
  const treasury = await ethers.deployContract("AIAgentTreasury", [deployerAddress, maxProposalValue], deployer);
  await treasury.waitForDeployment();
  const proposerRole = await treasury.AI_PROPOSER_ROLE();
  await (await treasury.grantRole(proposerRole, deployerAddress)).wait();

  const assetId = ethers.id(process.env.RWA_ASSET_ID ?? "type-07-taipei-microgrid-gpu");
  const vaults = parseVaults(process.env.RWA_VAULTS, deployerAddress, ethers.isAddress);
  const rwa = await ethers.deployContract("ComputeEnergyRWA", [
    process.env.RWA_TOKEN_NAME ?? "KSN Taipei Compute Energy RWA",
    process.env.RWA_TOKEN_SYMBOL ?? "KSNTPE",
    assetId,
    await oracle.getAddress(),
    deployerAddress,
    vaults
  ], deployer);
  await rwa.waitForDeployment();

  const initialSupply = ethers.parseUnits("1000000", 18);
  await (await oracle.updateSnapshot(assetId, 8_500_000n, 420_000_000_000_000n, 9_000n)).wait();
  await (await rwa.mint(deployerAddress, initialSupply)).wait();

  if (!(await treasury.hasRole(proposerRole, deployerAddress))) {
    throw new Error("Treasury proposer role initialization failed");
  }
  if ((await oracle.ksnScore(assetId)) === 0n) {
    throw new Error("Oracle snapshot initialization failed");
  }
  if ((await rwa.balanceOf(deployerAddress)) !== initialSupply) {
    throw new Error("RWA initial mint validation failed");
  }
  if ((await rwa.oracle()).toLowerCase() !== (await oracle.getAddress()).toLowerCase()) {
    throw new Error("RWA oracle configuration validation failed");
  }

  const blockNumber = await ethers.provider.getBlockNumber();
  const contracts = {
    KSNOracleAdapter: await oracle.getAddress(),
    AIAgentTreasury: await treasury.getAddress(),
    ComputeEnergyRWA: await rwa.getAddress()
  };
  const deployment = {
    network: networkName,
    chainId: Number(chain.chainId),
    deployer: deployerAddress,
    blockNumber,
    deployedAt: new Date().toISOString(),
    assetId,
    contracts,
    transactions: {
      KSNOracleAdapter: oracle.deploymentTransaction()?.hash ?? null,
      AIAgentTreasury: treasury.deploymentTransaction()?.hash ?? null,
      ComputeEnergyRWA: rwa.deploymentTransaction()?.hash ?? null
    },
    explorer: isEphemeral ? null : "https://sepolia.etherscan.io"
  };

  const deploymentDir = path.resolve("deployments");
  await mkdir(deploymentDir, { recursive: true });
  await writeFile(path.join(deploymentDir, `${networkName}.json`), `${JSON.stringify(deployment, null, 2)}\n`);
  if (!isEphemeral) {
    const webOutput = path.resolve("../../apps/web/src/generated/contracts.sepolia.json");
    await mkdir(path.dirname(webOutput), { recursive: true });
    await writeFile(webOutput, `${JSON.stringify(deployment, null, 2)}\n`);
  }
  console.log(JSON.stringify(deployment, null, 2));
}

function parseVaults(value: string | undefined, fallback: string, isAddress: (address: string) => boolean): string[] {
  if (!value) return Array(5).fill(fallback);
  const vaults = value.split(",").map((address) => address.trim());
  if (vaults.length !== 5 || vaults.some((address) => !isAddress(address))) {
    throw new Error("RWA_VAULTS must contain exactly five valid comma-separated addresses");
  }
  return vaults;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
