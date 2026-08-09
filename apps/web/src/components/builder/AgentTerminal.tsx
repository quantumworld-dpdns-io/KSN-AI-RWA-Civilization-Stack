"use client";

import { useEffect, useRef, useState } from "react";
import type { SuiMicrogridState } from "@/lib/sui";

interface LogLine {
  level: "info" | "action" | "success" | "warn" | "error";
  message: string;
  at: string;
}

type Mode = "IDLE" | "OBSERVING" | "ARMED" | "EXECUTED";

/**
 * The split-screen AI agent terminal. Streams the server-side agent's control
 * loop over SSE (/api/agent/stream): every chain read, every policy decision,
 * and — when the server is armed with a signing key — the real transaction
 * digest for the autonomous Planetary Dividend.
 *
 * `onState` lifts each chain read back to the builder so both panes show the
 * same numbers without polling twice.
 */
export function AgentTerminal({ onState }: { onState?: (state: SuiMicrogridState) => void }) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [mode, setMode] = useState<Mode>("IDLE");
  const [running, setRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;

  useEffect(() => {
    if (!running) return;
    const source = new EventSource("/api/agent/stream");

    source.addEventListener("status", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as { mode: Mode };
      setMode(data.mode);
    });
    source.addEventListener("log", (event) => {
      setLines((prev) => [...prev, JSON.parse((event as MessageEvent).data) as LogLine].slice(-200));
    });
    source.addEventListener("state", (event) => {
      onStateRef.current?.(JSON.parse((event as MessageEvent).data) as SuiMicrogridState);
    });
    source.addEventListener("executed", () => setMode("EXECUTED"));
    source.addEventListener("done", () => {
      source.close();
      setRunning(false);
    });
    source.onerror = () => {
      source.close();
      setRunning(false);
    };

    return () => source.close();
  }, [running]);

  // Autoscroll to the newest line.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <article className="panel terminal-panel">
      <div className="panel-title">
        <div>
          <small>Agentic Web</small>
          <h2>AI agent — live</h2>
        </div>
        <span className={mode === "EXECUTED" || mode === "ARMED" ? "pill live" : "pill"}>{mode}</span>
      </div>

      <p className="policy-description">
        The agent listens to the microgrid object continuously. When E(t) crosses 85 it executes{" "}
        <code>distribute_planetary_dividend_auto</code> on its own — presenting only its AgentCap,
        inside a spending allowance a human pre-authorized.
      </p>

      <div className="terminal" ref={scrollRef}>
        {lines.length === 0 ? (
          <p className="terminal-line info">
            {running ? "connecting…" : "agent idle — press Start monitoring."}
          </p>
        ) : (
          lines.map((line, index) => (
            <p
              // Log lines are append-only and never reordered, so the index is stable.
              key={`${line.at}-${index}`}
              className={`terminal-line ${line.level}`}
            >
              <span className="terminal-time">{line.at.slice(11, 19)}</span>
              {line.message}
            </p>
          ))
        )}
      </div>

      <div className="wallet-actions">
        <button
          type="button"
          className="refresh"
          onClick={() => {
            setLines([]);
            setRunning(true);
          }}
          disabled={running}
        >
          {running ? "Monitoring…" : "Start monitoring"}
        </button>
        {running ? (
          <button type="button" className="secondary" onClick={() => setRunning(false)}>
            Stop
          </button>
        ) : null}
      </div>
    </article>
  );
}
