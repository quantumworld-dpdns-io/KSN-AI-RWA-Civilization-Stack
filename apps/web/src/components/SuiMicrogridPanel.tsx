"use client";

import { useEffect, useState } from "react";

const AGENCY_LABELS: Record<number, string> = {
  0: "HUMAN_OWNED",
  1: "AI_MANAGED",
  2: "AI_CO_OWNED",
  3: "SOVEREIGN_AI_ASSET",
  4: "KARDASHEV_CONVERGENCE",
};

interface MicrogridFields {
  power_watts?: string;
  hashrate?: string;
  ksn_score?: string;
  agency_stage?: number;
  treasury_balance?: { fields?: { value?: string } };
  dividend_pool?: { fields?: { value?: string } };
}

export function SuiMicrogridPanel() {
  const rpcUrl = process.env.NEXT_PUBLIC_SUI_RPC_URL ?? "http://127.0.0.1:9000";
  const microgridId = process.env.NEXT_PUBLIC_SUI_MICROGRID_ID;
  const [fields, setFields] = useState<MicrogridFields | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!microgridId) {
      return;
    }

    async function load() {
      try {
        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "sui_getObject",
            params: [microgridId, { showContent: true }],
          }),
        });
        const payload = (await response.json()) as {
          result?: { data?: { content?: { fields?: { fields?: MicrogridFields } } } };
        };
        const nested = payload.result?.data?.content?.fields?.fields;
        if (!nested) {
          setError("Microgrid object not found on configured RPC.");
          return;
        }
        setFields(nested);
      } catch {
        setError("Unable to reach Sui RPC. Run pnpm sui:demo locally.");
      }
    }

    void load();
  }, [microgridId, rpcUrl]);

  if (!microgridId) {
    return (
      <section className="panel">
        <h2>Sui Microgrid (Agentic Web MVP)</h2>
        <p className="muted">
          Set <code>NEXT_PUBLIC_SUI_MICROGRID_ID</code> after running <code>pnpm sui:demo</code> to mirror
          on-chain telemetry here.
        </p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Sui Microgrid (on-chain)</h2>
      {error ? (
        <p className="muted">{error}</p>
      ) : !fields ? (
        <p className="muted">Loading microgrid object…</p>
      ) : (
        <dl className="facts">
          <div>
            <dt>Object ID</dt>
            <dd>{microgridId}</dd>
          </div>
          <div>
            <dt>Agency stage</dt>
            <dd>{AGENCY_LABELS[fields.agency_stage ?? 0] ?? fields.agency_stage}</dd>
          </div>
          <div>
            <dt>Power P(t)</dt>
            <dd>{fields.power_watts} W</dd>
          </div>
          <div>
            <dt>Hashrate H(t)</dt>
            <dd>{fields.hashrate}</dd>
          </div>
          <div>
            <dt>KSN score S(t)</dt>
            <dd>{fields.ksn_score}</dd>
          </div>
          <div>
            <dt>Treasury (MIST)</dt>
            <dd>{fields.treasury_balance?.fields?.value ?? "0"}</dd>
          </div>
          <div>
            <dt>Dividend pool (MIST)</dt>
            <dd>{fields.dividend_pool?.fields?.value ?? "0"}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
