/**
 * Explains what the KSN Civilization Stack is and how to participate on-chain.
 * Rendered on the Sui microgrid view so newcomers understand the purpose and the
 * exact steps (and how to recover from common wallet errors).
 */
export function ProjectExplainer() {
  return (
    <article className="panel">
      <div className="panel-title">
        <div>
          <small>About this project</small>
          <h2>KSN Civilization Stack</h2>
        </div>
        <span className="pill">Research prototype</span>
      </div>

      <p className="policy-description">
        A concept-to-prototype stack that tokenizes <b>energy and compute</b> as real-world assets
        (RWA) and lets an <b>autonomous AI agent</b> operate them on-chain. It merges two arcs: a{" "}
        <b>Kardashev / KSN</b> path where assets evolve from microgrids into planetary and stellar
        infrastructure, and a <b>“12 Scenes of AI”</b> path where AI grows from a portfolio
        optimizer into an economic actor that issues, owns, and governs infrastructure.
      </p>

      <div className="explainer">
        <div className="capability-group">
          <strong>The core signal</strong>
          <p className="policy-description">
            Every asset reports power <code>P(t)</code> and compute throughput <code>H(t)</code>.
            The KSN efficiency score <code>S(t) = P / H</code> (joules per hash) is the metric the
            AI agent watches to price, route, deposit, and — under a human gate — distribute
            dividends.
          </p>
        </div>

        <div className="capability-group">
          <strong>What runs where</strong>
          <ul className="explainer-list">
            <li>
              <b>Oracle</b> — signs energy/compute telemetry (HMAC) and computes the KSN snapshot.
            </li>
            <li>
              <b>Sui Move microgrid</b> — a shared Object holding treasury, dividend pool, agency
              stage, and an on-chain kill-switch (<code>paused</code>); buyout &amp; dividend are
              human-gated.
            </li>
            <li>
              <b>Autonomous agent</b> — reads verified telemetry, then acts within a policy and a
              per-run spend cap.
            </li>
            <li>
              <b>This dashboard</b> — reads the live Object via GraphQL and lets you participate.
            </li>
          </ul>
        </div>

        <div className="capability-group">
          <strong>How to participate</strong>
          <ol className="explainer-list">
            <li>Connect a Sui wallet (Slush, Suiet, …) set to the Sui testnet.</li>
            <li>
              Enter an amount and <b>Stake test SUI</b> into the microgrid treasury — you receive a{" "}
              <b>StakeReceipt</b> token representing your contribution.
            </li>
            <li>
              When the AI unlocks a dividend round, credential holders can claim planetary
              dividends.
            </li>
          </ol>
        </div>

        <div className="capability-group">
          <strong>Troubleshooting the stake</strong>
          <ul className="explainer-list">
            <li>
              <b>“Incorrect password”</b> — this comes from the wallet, not the app. Open the Slush
              extension and unlock it (enter your wallet password there), then retry. If it
              persists, re-add the account, or use Suiet.
            </li>
            <li>
              <b>Insufficient gas</b> — fund the connected account with testnet SUI from the faucet.
            </li>
            <li>
              <b>Wrong network</b> — switch your wallet to <b>Sui testnet</b> and reconnect.
            </li>
          </ul>
        </div>
      </div>

      <p className="result-note">
        Speculative research prototype — not legal, financial, or investment advice.
      </p>
    </article>
  );
}
