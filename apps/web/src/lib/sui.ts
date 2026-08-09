import deployment from "@/generated/sui.testnet.json";
import { efficiencyScore } from "@/lib/efficiency";

// Sui public fullnodes deprecated JSON-RPC (sui_getObject) — production reads
// must use the GraphQL endpoint. This URL is the GraphQL service, overridable
// for a private/paid endpoint.
function graphqlUrl(): string {
  return (
    process.env.SUI_GRAPHQL_URL ??
    process.env.NEXT_PUBLIC_SUI_GRAPHQL_URL ??
    deployment.graphqlUrl ??
    "https://graphql.testnet.sui.io/graphql"
  );
}

// The published testnet microgrid object. Overridable via env.
function microgridId(): string {
  return (
    process.env.SUI_MICROGRID_ID ??
    process.env.NEXT_PUBLIC_SUI_MICROGRID_ID ??
    deployment.microgridId
  );
}

const AGENCY_LABELS: Record<number, string> = {
  0: "HUMAN_OWNED",
  1: "AI_MANAGED",
  2: "AI_CO_OWNED",
  3: "SOVEREIGN_AI_ASSET",
  4: "KARDASHEV_CONVERGENCE",
};

// Move object contents as returned by GraphQL `contents { json }`. Balance
// fields arrive as plain decimal strings. Fields added by later package
// upgrades (paused, total_issued_bps, dividend_round) may be absent on an
// object created by an earlier version — all are read defensively.
interface MicrogridJson {
  power_watts?: string;
  hashrate?: string;
  ksn_score?: string;
  agency_stage?: number;
  sovereign_owner?: string;
  dividend_threshold?: string;
  buyout_threshold?: string;
  treasury_balance?: string;
  dividend_pool?: string;
  paused?: boolean;
  total_issued_bps?: string;
  dividend_round?: string;
  cooling_tier?: number;
  dividend_allowance?: string;
}

const OBJECT_QUERY =
  "query($id:SuiAddress!){ object(address:$id){ address asMoveObject { contents { json } } } }";

export interface SuiMicrogridState {
  ok: boolean;
  network: string;
  graphqlUrl: string;
  explorer: string;
  packageId: string;
  microgridId: string;
  fetchedAt: string;
  agencyStage: number;
  agencyLabel: string;
  powerWatts: string;
  hashrate: string;
  ksnScore: string;
  treasuryMist: string;
  dividendPoolMist: string;
  paused: boolean;
  sovereignOwner: string | null;
  totalIssuedBps: number;
  dividendRound: number;
  /// Thresholds the Move object carries, surfaced so the Datacenter Builder can
  /// show how far the microgrid is from dividend eligibility.
  dividendThreshold: string;
  buyoutThreshold: string;
  /// Cooling upgrades installed so far, and the human-authorized budget the
  /// agent may distribute autonomously. Absent (0) on objects predating them.
  coolingTier: number;
  dividendAllowance: string;
  /// E(t) on a 0-100 scale — see lib/efficiency.ts. Mirrors the on-chain
  /// `efficiency_score_bps`; >= 85 exactly when the dividend gate is open.
  efficiency: number;
  dividendEligible: boolean;
}

export async function readSuiMicrogridState(): Promise<SuiMicrogridState> {
  const url = graphqlUrl();
  const id = microgridId();
  if (!id) {
    throw new Error(
      "No Sui microgrid object configured (set SUI_MICROGRID_ID or the committed deployment)."
    );
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: OBJECT_QUERY, variables: { id } }),
    // Server-side read; never cache stale chain state.
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Sui GraphQL responded ${response.status}`);
  }

  const payload = (await response.json()) as {
    errors?: Array<{ message?: string }>;
    data?: { object?: { asMoveObject?: { contents?: { json?: MicrogridJson } } } };
  };
  if (payload.errors?.length) {
    throw new Error(`Sui GraphQL error: ${payload.errors[0]?.message ?? "unknown"}`);
  }

  const fields = payload.data?.object?.asMoveObject?.contents?.json;
  if (!fields) {
    throw new Error("Microgrid object not found on the configured Sui GraphQL endpoint.");
  }

  const stage = fields.agency_stage ?? 0;
  const ksnScore = fields.ksn_score ?? "0";
  const dividendThreshold = fields.dividend_threshold ?? "0";
  return {
    ok: true,
    network: deployment.network,
    graphqlUrl: url,
    explorer: deployment.explorer,
    packageId: deployment.packageId,
    microgridId: id,
    fetchedAt: new Date().toISOString(),
    agencyStage: stage,
    agencyLabel: AGENCY_LABELS[stage] ?? String(stage),
    powerWatts: fields.power_watts ?? "0",
    hashrate: fields.hashrate ?? "0",
    ksnScore,
    treasuryMist: fields.treasury_balance ?? "0",
    dividendPoolMist: fields.dividend_pool ?? "0",
    paused: Boolean(fields.paused),
    sovereignOwner: fields.sovereign_owner ?? null,
    totalIssuedBps: Number(fields.total_issued_bps ?? 0),
    dividendRound: Number(fields.dividend_round ?? 0),
    dividendThreshold,
    buyoutThreshold: fields.buyout_threshold ?? "0",
    coolingTier: Number(fields.cooling_tier ?? 0),
    dividendAllowance: fields.dividend_allowance ?? "0",
    efficiency: efficiencyScore(ksnScore, dividendThreshold),
    // The Move gate is `ksn_score <= dividend_threshold`, which is equivalent to
    // E >= 85 by the definition in lib/efficiency.ts. Compare on the raw values
    // so rounding in the display score can never disagree with the chain.
    dividendEligible: BigInt(ksnScore) <= BigInt(dividendThreshold),
  };
}
