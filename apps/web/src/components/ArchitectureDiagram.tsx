"use client";

import { useEffect, useId, useRef, useState } from "react";

/** Source of truth: docs/ARCHITECTURE.md — Sui agentic architecture (Sui Overflow) */
export const SUI_AGENTIC_MERMAID = `flowchart LR
  subgraph Browser
    U[User + Sui wallet\\nSlush / Suiet] -->|sign stake PTB| MG
    FE[Next.js dashboard\\napps/web]
  end
  subgraph Server[Next.js server routes]
    FE -->|/api/chain/sui| GQL[Sui GraphQL client\\napps/web/src/lib/sui.ts]
    FE -->|/api/oracle/*| ORA
  end
  subgraph Backend
    ORA[Oracle\\nFastify + HMAC signing\\npackages/oracle-sim]
    AG[AI Agent\\nNode + own Ed25519 keypair\\npackages/agent]
  end
  subgraph Sui[Sui testnet]
    MG[(Microgrid — Shared Object\\nUID + P·H·S·treasury·paused)]
  end

  GQL -->|read Object fields| MG
  ORA -->|signed telemetry P and H| AG
  AG -->|read Object state| MG
  AG -->|"sign PTB: update_telemetry / deposit / (human-gated) dividend"| MG`;

type ArchitectureDiagramProps = {
  title?: string;
  kicker?: string;
};

export function ArchitectureDiagram({
  title = "Sui agentic architecture",
  kicker = "docs/ARCHITECTURE.md",
}: ArchitectureDiagramProps) {
  const reactId = useId().replace(/:/g, "");
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "dark",
          themeVariables: {
            darkMode: true,
            background: "#0c0f14",
            primaryColor: "#122028",
            primaryTextColor: "#e8f0f2",
            primaryBorderColor: "#69e7d5",
            secondaryColor: "#151922",
            tertiaryColor: "#0f141b",
            lineColor: "#5a6a78",
            textColor: "#d5dee4",
            mainBkg: "#12161d",
            nodeBorder: "#3a4a55",
            clusterBkg: "#0b0e13",
            clusterBorder: "#2a333d",
            titleColor: "#69e7d5",
            edgeLabelBackground: "#0c0f14",
          },
          flowchart: {
            curve: "basis",
            padding: 16,
            htmlLabels: true,
            nodeSpacing: 36,
            rankSpacing: 48,
          },
        });

        const { svg } = await mermaid.render(`sui-arch-${reactId}`, SUI_AGENTIC_MERMAID);
        if (!cancelled && hostRef.current) {
          hostRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to render architecture diagram");
        }
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [reactId]);

  return (
    <article className="panel architecture-panel">
      <div className="panel-title">
        <div>
          <small>{kicker}</small>
          <h2>{title}</h2>
        </div>
        <span className="pill live">Sui Overflow</span>
      </div>
      <p className="architecture-blurb">
        How the Next.js frontend, the AI agent, and the Sui blockchain interact around the shared{" "}
        <code>Microgrid</code> Object — object-centric UID, GraphQL reads, wallet + agent PTBs,
        human-gated irreversible edges.
      </p>
      {error ? (
        <p className="error">{error}</p>
      ) : (
        <div className="architecture-mermaid" ref={hostRef} aria-label="Sui agentic architecture diagram" />
      )}
      <ul className="architecture-notes">
        <li>
          Microgrid is a shared <code>sui::object::UID</code> (not an EVM mapping).
        </li>
        <li>Reads use GraphQL; mutations are signed Programmable Transaction Blocks.</li>
        <li>Buyout / dividend edges pass a human gate and on-chain <code>paused</code> kill-switch.</li>
      </ul>
    </article>
  );
}
