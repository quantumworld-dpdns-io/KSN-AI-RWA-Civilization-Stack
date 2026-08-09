import {
  agentAddress,
  decideAgentAction,
  executeAutonomousDividend,
  loadAgentEnv,
} from "@/lib/agent-executor";
import { readSuiMicrogridState } from "@/lib/sui";

// Signs with a private key and talks gRPC — Node runtime only, never Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** How often the agent re-reads chain state. */
const POLL_MS = 3_000;
/** Hard cap on a single stream, so an abandoned browser tab cannot poll forever. */
const MAX_DURATION_MS = 180_000;

type Level = "info" | "action" | "success" | "warn" | "error";

/**
 * Server-Sent Events feed of the autonomous agent's control loop: it reads the
 * microgrid's on-chain state, applies the dividend policy, and — when a signing
 * key is configured — actually submits `distribute_planetary_dividend_auto`.
 *
 * Guardrails (mirroring packages/agent):
 *  - at most ONE dividend transaction per stream,
 *  - amount capped by AGENT_DIVIDEND_MIST and by the on-chain allowance,
 *  - fails closed to observe-only when AGENT_SECRET_KEY is unset, so a fresh
 *    deploy degrades gracefully instead of erroring,
 *  - the on-chain kill-switch (`paused`) stops the loop from acting at all.
 */
export function GET(request: Request) {
  const env = loadAgentEnv();
  const encoder = new TextEncoder();
  const startedAt = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };
      const log = (level: Level, message: string) =>
        send("log", { level, message, at: new Date().toISOString() });

      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // The client already went away.
        }
      };
      request.signal.addEventListener("abort", close);

      const address = agentAddress(env);
      send("status", {
        mode: env.armed ? "ARMED" : "OBSERVING",
        network: env.network,
        agentAddress: address,
        dividendMist: env.dividendMist.toString(),
      });
      log("info", `KSN autonomous agent online — Sui ${env.network}`);
      log("info", `microgrid=${env.microgridId.slice(0, 10)}… package=${env.packageId.slice(0, 10)}…`);
      log(
        env.armed ? "info" : "warn",
        env.armed
          ? `mode=ARMED signer=${address ?? "unknown"} — will submit transactions autonomously`
          : "mode=OBSERVING — AGENT_SECRET_KEY unset, decisions are reported but not executed"
      );

      let executed = false;

      while (!closed && Date.now() - startedAt < MAX_DURATION_MS) {
        try {
          const state = await readSuiMicrogridState();
          send("state", state);
          log(
            "info",
            `read S(t)=${state.ksnScore} P(t)=${state.powerWatts}W cooling=tier${state.coolingTier} → E(t)=${state.efficiency.toFixed(2)}`
          );

          const decision = decideAgentAction(
            {
              paused: state.paused,
              dividendEligible: state.dividendEligible,
              efficiency: state.efficiency,
              dividendAllowance: state.dividendAllowance,
              treasuryMist: state.treasuryMist,
            },
            env.dividendMist
          );

          if (decision.action === "noop") {
            log("info", `decision=noop — ${decision.reason}`);
          } else if (executed) {
            log("info", "decision=dividend suppressed — one distribution per session");
          } else {
            log("action", `decision=dividend — ${decision.reason}`);
            log(
              "action",
              `THRESHOLD MET → distribute_planetary_dividend_auto(${decision.amountMist} MIST) [AgentCap only, no AdminCap]`
            );

            if (!env.armed) {
              log(
                "warn",
                "observe-only: set AGENT_SECRET_KEY to let the agent sign this transaction"
              );
            } else {
              executed = true;
              const outcome = await executeAutonomousDividend(env, decision.amountMist);
              if (outcome.success) {
                log("success", `executed tx=${outcome.digest}`);
                log("success", `${deploymentExplorer()}/tx/${outcome.digest}`);
                log("success", "Planetary Dividend distributed autonomously. Holders may now claim.");
                send("executed", { digest: outcome.digest, amountMist: decision.amountMist.toString() });
                // Report the post-transaction state, then stop.
                const settled = await readSuiMicrogridState();
                send("state", settled);
                log("info", `dividend pool now ${settled.dividendPoolMist} MIST, round ${settled.dividendRound}`);
                break;
              }
              log("error", `transaction failed: ${outcome.error ?? "unknown error"}`);
              // Allow a later cycle to retry once conditions change.
              executed = false;
            }
          }
        } catch (error) {
          log("error", error instanceof Error ? error.message : "agent cycle failed");
        }

        await sleep(POLL_MS, request.signal);
      }

      if (!closed) {
        log("info", "agent session ended — reconnect to resume monitoring");
        send("done", { executed });
      }
      close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Disable proxy buffering so log lines appear as they happen.
      "X-Accel-Buffering": "no",
    },
  });
}

function deploymentExplorer(): string {
  return process.env.SUI_EXPLORER ?? "https://suiscan.xyz/testnet";
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      resolve();
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
