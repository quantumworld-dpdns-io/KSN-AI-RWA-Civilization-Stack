import { z } from "zod";

export const AgentActionSchema = z.object({
  action: z.enum(["noop", "update", "deposit", "dividend", "buyout", "claim"]),
  reason: z.string().min(1),
  dividendAmountMist: z.number().int().nonnegative().optional(),
  depositAmountMist: z.number().int().nonnegative().optional(),
});

export type AgentAction = z.infer<typeof AgentActionSchema>;

export interface MicrogridState {
  objectId: string;
  powerWatts: number;
  hashrate: number;
  ksnScore: number;
  agencyStage: number;
  treasuryMist: number;
  dividendPoolMist: number;
  dividendThreshold: number;
  buyoutThreshold: number;
}

export interface DemoDeployment {
  packageId: string;
  microgridId: string;
  agentCapId: string;
  adminCapId?: string;
  // setup-demo.ts writes the admin capability under `adminCap`.
  adminCap?: string;
  credentialId?: string;
  agentAddress: string;
}

export interface AgentConfig {
  suiRpcUrl: string;
  suiTxBackend: "auto" | "sdk" | "cli";
  packageId: string;
  microgridId: string;
  agentCapId: string;
  // Human-held AdminCap object id. Required to execute the human-gated
  // buyout/dividend actions; when absent the agent cannot perform them.
  adminCapId?: string;
  credentialId?: string;
  privateKeyHex?: string;
  oracleUrl?: string;
  assetId: string;
  pollIntervalMs: number;
  dividendAmountMist: number;
  depositAmountMist: number;
  allowBuyout: boolean;
  openAiApiKey?: string;
  ollamaBaseUrl?: string;
  llmModel: string;
  // Reject signed telemetry older than this (replay / staleness guard).
  telemetryMaxAgeMs: number;
  // When true, proceed with unverifiable/missing telemetry (dev only). Defaults false: fail closed.
  allowUnverifiedTelemetry: boolean;
  // Guardrails for the continuous loop.
  maxCycles: number;
  maxSpendMistPerRun: number;
}

export const AGENCY_STAGE_LABELS: Record<number, string> = {
  0: "HUMAN_OWNED",
  1: "AI_MANAGED",
  2: "AI_CO_OWNED",
  3: "SOVEREIGN_AI_ASSET",
  4: "KARDASHEV_CONVERGENCE",
};
