import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { loadActiveKeypair } from "./keypair.js";
import type { AgentAction, AgentConfig, MicrogridState } from "./types.js";
import { truncateAddress } from "./config.js";

function getKeypair(privateKeyHex?: string) {
  return loadActiveKeypair(privateKeyHex);
}

function readField(content: Record<string, unknown>, key: string): number {
  const fields = content.fields as Record<string, unknown> | undefined;
  const value = fields?.[key];
  if (typeof value === "string") {
    return Number(value);
  }
  if (typeof value === "number") {
    return value;
  }
  if (value && typeof value === "object" && "fields" in value) {
    const nested = (value as { fields?: Record<string, unknown> }).fields;
    if (nested && typeof nested.value === "string") {
      return Number(nested.value);
    }
  }
  throw new Error(`Missing field ${key} on microgrid object`);
}

export class SuiMicrogridClient {
  private readonly client: SuiClient;
  private readonly keypair: Ed25519Keypair;

  constructor(private readonly config: AgentConfig) {
    this.client = new SuiClient({ url: config.suiRpcUrl });
    this.keypair = getKeypair(config.privateKeyHex);
  }

  get agentAddress(): string {
    return this.keypair.getPublicKey().toSuiAddress();
  }

  async fetchTelemetry(): Promise<{ powerWatts: number; hashrate: number }> {
    const fallback = { powerWatts: 8_500_000, hashrate: 420_000_000_000_000 };
    if (!this.config.oracleUrl) {
      return fallback;
    }

    try {
      const response = await fetch(`${this.config.oracleUrl}/telemetry/${this.config.assetId}`);
      if (!response.ok) {
        return fallback;
      }

      const payload = (await response.json()) as {
        powerWatts?: number;
        hashrate?: number;
      };

      return {
        powerWatts: payload.powerWatts ?? fallback.powerWatts,
        hashrate: payload.hashrate ?? fallback.hashrate,
      };
    } catch {
      return fallback;
    }
  }

  async readMicrogridState(): Promise<MicrogridState> {
    const object = await this.client.getObject({
      id: this.config.microgridId,
      options: { showContent: true },
    });

    if (object.data?.content?.dataType !== "moveObject") {
      throw new Error("Microgrid object not found or invalid");
    }

    const content = object.data.content.fields as Record<string, unknown>;
    const nested = (content.fields as Record<string, unknown>) ?? content;

    return {
      objectId: this.config.microgridId,
      powerWatts: readField({ fields: nested }, "power_watts"),
      hashrate: readField({ fields: nested }, "hashrate"),
      ksnScore: readField({ fields: nested }, "ksn_score"),
      agencyStage: readField({ fields: nested }, "agency_stage"),
      treasuryMist: readField({ fields: nested }, "treasury_balance"),
      dividendPoolMist: readField({ fields: nested }, "dividend_pool"),
      dividendThreshold: readField({ fields: nested }, "dividend_threshold"),
      buyoutThreshold: readField({ fields: nested }, "buyout_threshold"),
    };
  }

  async executeAction(action: AgentAction, telemetry: { powerWatts: number; hashrate: number }): Promise<string | null> {
    const tx = new Transaction();
    const pkg = this.config.packageId;

    switch (action.action) {
      case "update":
        tx.moveCall({
          target: `${pkg}::microgrid::update_telemetry`,
          arguments: [
            tx.object(this.config.microgridId),
            tx.object(this.config.agentCapId),
            tx.pure.u64(BigInt(Math.round(telemetry.powerWatts))),
            tx.pure.u64(BigInt(Math.round(telemetry.hashrate))),
          ],
        });
        break;
      case "deposit": {
        const amount = BigInt(action.depositAmountMist ?? this.config.depositAmountMist);
        const [coin] = tx.splitCoins(tx.gas, [amount]);
        tx.moveCall({
          target: `${pkg}::microgrid::deposit_yield`,
          arguments: [
            tx.object(this.config.microgridId),
            tx.object(this.config.agentCapId),
            coin,
          ],
        });
        break;
      }
      case "buyout":
        tx.moveCall({
          target: `${pkg}::microgrid::execute_buyout`,
          arguments: [tx.object(this.config.microgridId), tx.object(this.config.agentCapId)],
        });
        break;
      case "dividend":
        tx.moveCall({
          target: `${pkg}::microgrid::distribute_planetary_dividend`,
          arguments: [
            tx.object(this.config.microgridId),
            tx.object(this.config.agentCapId),
            tx.pure.u64(BigInt(action.dividendAmountMist ?? this.config.dividendAmountMist)),
          ],
        });
        break;
      case "claim":
        if (!this.config.credentialId) {
          throw new Error("Missing credential ID for claim action");
        }
        tx.moveCall({
          target: `${pkg}::microgrid::claim_dividend`,
          arguments: [
            tx.object(this.config.microgridId),
            tx.object(this.config.credentialId),
          ],
        });
        break;
      case "noop":
        return null;
    }

    const result = await this.client.signAndExecuteTransaction({
      signer: this.keypair,
      transaction: tx,
      options: { showEffects: true },
    });

    return result.digest;
  }

  logSafe(message: string): void {
    console.log(`[agent:${truncateAddress(this.agentAddress)}] ${message}`);
  }
}
