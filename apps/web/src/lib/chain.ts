import { createPublicClient, formatEther, formatUnits, http, type Address } from "viem";
import { sepolia } from "viem/chains";
import deployment from "@/generated/contracts.sepolia.json";

// Read-only Sepolia RPC. Reuses the deploy RPC if present, else a public endpoint.
function rpcUrl() {
  return process.env.SEPOLIA_RPC_URL ?? process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";
}

function client() {
  return createPublicClient({ chain: sepolia, transport: http(rpcUrl()) });
}

const erc20Abi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "assetId", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
  { type: "function", name: "aiTreasuryBps", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "humanInvestorBps", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] }
] as const;

const treasuryAbi = [
  { type: "function", name: "maxProposalValue", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "proposalDelaySeconds", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "paused", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] }
] as const;

const oracleAbi = [
  { type: "function", name: "ksnScore", stateMutability: "view", inputs: [{ type: "bytes32" }], outputs: [{ type: "uint256" }] }
] as const;

const rolesAbi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "hasRole", stateMutability: "view", inputs: [{ type: "bytes32" }, { type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "OPERATOR_ROLE", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
  { type: "function", name: "DEFAULT_ADMIN_ROLE", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] }
] as const;

const treasuryRolesAbi = [
  { type: "function", name: "hasRole", stateMutability: "view", inputs: [{ type: "bytes32" }, { type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "GUARDIAN_ROLE", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
  { type: "function", name: "AI_PROPOSER_ROLE", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] }
] as const;

export interface AccountState {
  address: Address;
  ethBalance: string;
  ksntpeBalance: string;
  symbol: string;
  roles: { operator: boolean; admin: boolean; guardian: boolean; proposer: boolean };
}

export async function readAccountState(address: Address): Promise<AccountState> {
  const c = client();
  const rwa = deployment.contracts.ComputeEnergyRWA as Address;
  const treasury = deployment.contracts.AIAgentTreasury as Address;

  const [operatorRole, adminRole, guardianRole, proposerRole] = await Promise.all([
    c.readContract({ address: rwa, abi: rolesAbi, functionName: "OPERATOR_ROLE" }),
    c.readContract({ address: rwa, abi: rolesAbi, functionName: "DEFAULT_ADMIN_ROLE" }),
    c.readContract({ address: treasury, abi: treasuryRolesAbi, functionName: "GUARDIAN_ROLE" }),
    c.readContract({ address: treasury, abi: treasuryRolesAbi, functionName: "AI_PROPOSER_ROLE" })
  ]);

  const [ethBalance, rawBalance, decimals, operator, admin, guardian, proposer] = await Promise.all([
    c.getBalance({ address }),
    c.readContract({ address: rwa, abi: rolesAbi, functionName: "balanceOf", args: [address] }),
    c.readContract({ address: rwa, abi: rolesAbi, functionName: "decimals" }),
    c.readContract({ address: rwa, abi: rolesAbi, functionName: "hasRole", args: [operatorRole, address] }),
    c.readContract({ address: rwa, abi: rolesAbi, functionName: "hasRole", args: [adminRole, address] }),
    c.readContract({ address: treasury, abi: treasuryRolesAbi, functionName: "hasRole", args: [guardianRole, address] }),
    c.readContract({ address: treasury, abi: treasuryRolesAbi, functionName: "hasRole", args: [proposerRole, address] })
  ]);

  return {
    address,
    ethBalance: formatEther(ethBalance),
    ksntpeBalance: formatUnits(rawBalance, decimals),
    symbol: "KSNTPE",
    roles: { operator, admin, guardian, proposer }
  };
}

export interface ChainState {
  ok: boolean;
  chainId: number;
  blockNumber: string;
  fetchedAt: string;
  rwa: { address: Address; name: string; symbol: string; totalSupply: string; assetId: string; aiTreasuryBps: number; humanInvestorBps: number };
  treasury: { address: Address; ethBalance: string; maxProposalValueEth: string; proposalDelayHours: number; paused: boolean };
  oracle: { address: Address; ksnScore: string };
}

export async function readChainState(): Promise<ChainState> {
  const c = client();
  const rwa = deployment.contracts.ComputeEnergyRWA as Address;
  const treasury = deployment.contracts.AIAgentTreasury as Address;
  const oracle = deployment.contracts.KSNOracleAdapter as Address;
  const assetId = deployment.assetId as `0x${string}`;

  const [
    blockNumber,
    name, symbol, decimals, totalSupply, aiTreasuryBps, humanInvestorBps,
    maxProposalValue, proposalDelaySeconds, paused,
    ethBalance,
    ksnScore
  ] = await Promise.all([
    c.getBlockNumber(),
    c.readContract({ address: rwa, abi: erc20Abi, functionName: "name" }),
    c.readContract({ address: rwa, abi: erc20Abi, functionName: "symbol" }),
    c.readContract({ address: rwa, abi: erc20Abi, functionName: "decimals" }),
    c.readContract({ address: rwa, abi: erc20Abi, functionName: "totalSupply" }),
    c.readContract({ address: rwa, abi: erc20Abi, functionName: "aiTreasuryBps" }),
    c.readContract({ address: rwa, abi: erc20Abi, functionName: "humanInvestorBps" }),
    c.readContract({ address: treasury, abi: treasuryAbi, functionName: "maxProposalValue" }),
    c.readContract({ address: treasury, abi: treasuryAbi, functionName: "proposalDelaySeconds" }),
    c.readContract({ address: treasury, abi: treasuryAbi, functionName: "paused" }),
    c.getBalance({ address: treasury }),
    c.readContract({ address: oracle, abi: oracleAbi, functionName: "ksnScore", args: [assetId] })
  ]);

  return {
    ok: true,
    chainId: deployment.chainId,
    blockNumber: blockNumber.toString(),
    fetchedAt: new Date().toISOString(),
    rwa: {
      address: rwa,
      name, symbol,
      totalSupply: formatUnits(totalSupply, decimals),
      assetId,
      aiTreasuryBps: Number(aiTreasuryBps),
      humanInvestorBps: Number(humanInvestorBps)
    },
    treasury: {
      address: treasury,
      ethBalance: formatEther(ethBalance),
      maxProposalValueEth: formatEther(maxProposalValue),
      proposalDelayHours: Number(proposalDelaySeconds) / 3600,
      paused
    },
    oracle: { address: oracle, ksnScore: ksnScore.toString() }
  };
}
