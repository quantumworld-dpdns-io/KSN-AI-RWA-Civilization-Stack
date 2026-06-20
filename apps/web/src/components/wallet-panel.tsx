"use client";

import { useCallback, useEffect, useState } from "react";
import { parseEther, parseUnits, type Address } from "viem";
import { useWallet } from "@/lib/useWallet";
import { explorerAddress, explorerTx, shorten } from "@/lib/wallet";
import deployment from "@/generated/contracts.sepolia.json";

const RWA = deployment.contracts.ComputeEnergyRWA as Address;
const TREASURY = deployment.contracts.AIAgentTreasury as Address;

const rwaWriteAbi = [
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "mint", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "reportGrossYield", stateMutability: "nonpayable", inputs: [{ name: "grossAmount", type: "uint256" }], outputs: [] },
  { type: "function", name: "pause", stateMutability: "nonpayable", inputs: [], outputs: [] }
] as const;

const treasuryWriteAbi = [
  { type: "function", name: "propose", stateMutability: "nonpayable", inputs: [{ name: "target", type: "address" }, { name: "value", type: "uint256" }, { name: "data", type: "bytes" }, { name: "policyHash", type: "string" }], outputs: [{ type: "uint256" }] }
] as const;

const PLEDGES = [
  { id: "scene3", label: "Scene 3 — Oracle-driven optimization", text: "I pledge to let verified oracle telemetry guide energy-compute optimization for this asset." },
  { id: "scene7", label: "Scene 7 — Algorithmic legal entity", text: "I support an algorithmic legal entity issuing RWA to expand a transparent, audited compute base." },
  { id: "scene10", label: "Scene 10 — Sovereign asset", text: "I acknowledge a roadmap where infrastructure becomes economically autonomous under guardian + kill-switch controls." },
  { id: "scene12", label: "Scene 12 — Kardashev convergence", text: "I endorse packaging planetary/stellar infrastructure yield into a universal civilization dividend." }
] as const;

interface AccountState {
  address: Address; ethBalance: string; ksntpeBalance: string; symbol: string;
  roles: { operator: boolean; admin: boolean; guardian: boolean; proposer: boolean };
}

type TxState = { kind: "idle" } | { kind: "pending"; label: string } | { kind: "done"; label: string; hash: string } | { kind: "error"; label: string; message: string };

export function WalletPanel() {
  const w = useWallet();
  const [account, setAccount] = useState<AccountState | null>(null);
  const [accountError, setAccountError] = useState("");
  const [tx, setTx] = useState<TxState>({ kind: "idle" });
  const [pledgeId, setPledgeId] = useState<string>(PLEDGES[0].id);
  const [signature, setSignature] = useState("");
  const [fundAmount, setFundAmount] = useState("0.001");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("1");

  const loadAccount = useCallback(async (address: Address) => {
    setAccountError("");
    try {
      const res = await fetch(`/api/chain/account?address=${address}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Account read failed");
      setAccount(data.account);
    } catch (e) { setAccountError(e instanceof Error ? e.message : "Account read failed"); }
  }, []);

  useEffect(() => {
    if (w.address && w.onSepolia) void loadAccount(w.address);
    else setAccount(null);
  }, [w.address, w.onSepolia, loadAccount]);

  async function run(label: string, fn: () => Promise<`0x${string}`>) {
    setTx({ kind: "pending", label });
    try {
      const hash = await fn();
      setTx({ kind: "done", label, hash });
      if (w.address) void loadAccount(w.address);
    } catch (error) {
      setTx({ kind: "error", label, message: w.toMessage(error) });
    }
  }

  async function signPledge() {
    const pledge = PLEDGES.find((p) => p.id === pledgeId)!;
    setTx({ kind: "pending", label: "Signing pledge" });
    try {
      const message = `KSN Civilization Pledge\n${pledge.label}\n\n${pledge.text}\n\nAsset: ${deployment.assetId}\nSigner: ${w.address}`;
      const sig = await w.signMessage(message);
      setSignature(sig);
      setTx({ kind: "idle" });
    } catch (error) {
      setSignature("");
      setTx({ kind: "error", label: "Signing pledge", message: w.toMessage(error) });
    }
  }

  if (!w.hasWallet) {
    return (
      <section className="panel">
        <PanelTitle kicker="On-chain participation" title="Connect a wallet" />
        <p className="muted-line">No EVM wallet detected. Install <a href="https://metamask.io" target="_blank" rel="noreferrer">MetaMask</a> (or another EVM wallet) and fund it with Sepolia test ETH to interact with the contracts.</p>
      </section>
    );
  }

  const singleWallet = w.wallets.length === 1;

  return (
    <section className="panel">
      <PanelTitle kicker="On-chain participation" title="Connect wallet & act"
        aside={w.address
          ? <button className="secondary" onClick={w.disconnect}>Disconnect</button>
          : singleWallet
            ? <button className="primary" onClick={() => w.connect(w.wallets[0])} disabled={w.connecting}>{w.connecting ? "Connecting…" : `Connect ${w.wallets[0].info.name}`}</button>
            : undefined} />

      {!w.address && w.wallets.length > 1 && (
        <div className="wallet-picker">
          <p className="muted-line">Multiple wallets detected — choose one:</p>
          <div className="wallet-picker-list">
            {w.wallets.map((detail) => (
              <button key={detail.info.uuid} className="wallet-choice" onClick={() => w.connect(detail)} disabled={w.connecting}>
                {detail.info.icon ? <img src={detail.info.icon} alt="" width={20} height={20} /> : <span className="wallet-choice-dot" />}
                {detail.info.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {w.error && <p className="error">{w.error}</p>}

      {w.address && !w.onSepolia && (
        <p className="error">Wrong network. <button className="link-button" onClick={w.switchNetwork}>Switch to Sepolia</button></p>
      )}

      {w.address && (
        <div className="deployment-meta">
          <span>Account <a href={explorerAddress(w.address)} target="_blank" rel="noreferrer"><code>{shorten(w.address)}</code></a></span>
          {account && <span>{Number(account.ethBalance).toFixed(4)} ETH</span>}
          {account && <span>{Number(account.ksntpeBalance).toLocaleString()} {account.symbol}</span>}
        </div>
      )}
      {accountError && <p className="muted-line">Balances unavailable: {accountError}</p>}

      {account && (
        <div className="capability-group">
          <strong>Wallet capabilities</strong>
          <div>
            <span className={`capability-chip ${account.roles.operator ? "" : "muted"}`}>Operator {account.roles.operator ? "✓" : "—"}</span>
            <span className={`capability-chip ${account.roles.admin ? "" : "muted"}`}>Admin {account.roles.admin ? "✓" : "—"}</span>
            <span className={`capability-chip ${account.roles.guardian ? "" : "muted"}`}>Guardian {account.roles.guardian ? "✓" : "—"}</span>
            <span className={`capability-chip ${account.roles.proposer ? "" : "muted"}`}>AI Proposer {account.roles.proposer ? "✓" : "—"}</span>
          </div>
        </div>
      )}

      {w.address && w.onSepolia && (
        <div className="wallet-actions">
          {/* Goal 1: gasless pledge — everyone */}
          <article className="wallet-action">
            <h3>Sign a civilization-goal pledge</h3>
            <p className="muted-line">Gasless. Proves your support for a roadmap stage from the README ladder.</p>
            <select value={pledgeId} onChange={(e) => setPledgeId(e.target.value)}>
              {PLEDGES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <button className="primary" onClick={signPledge}>Sign pledge</button>
            {signature && <code className="signature-out">{signature.slice(0, 22)}…{signature.slice(-12)}</code>}
          </article>

          {/* Goal 2: fund treasury — everyone with Sepolia ETH */}
          <article className="wallet-action">
            <h3>Fund the AI treasury</h3>
            <p className="muted-line">Send Sepolia ETH to the AIAgentTreasury (receive payable).</p>
            <label>Amount (ETH)<input type="number" min="0" step="0.0001" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} /></label>
            <button className="primary" disabled={!fundAmount || Number(fundAmount) <= 0} onClick={() => run("Fund treasury", () => w.fundTreasury(TREASURY, fundAmount))}>Send to treasury</button>
          </article>

          {/* Goal 3: transfer — holders only */}
          <article className="wallet-action">
            <h3>Transfer KSNTPE</h3>
            {account && Number(account.ksntpeBalance) > 0 ? <>
              <label>To<input placeholder="0x…" value={transferTo} onChange={(e) => setTransferTo(e.target.value)} /></label>
              <label>Amount<input type="number" min="0" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} /></label>
              <button className="primary" disabled={!transferTo} onClick={() => run("Transfer KSNTPE", () => w.writeContract({ address: RWA, abi: rwaWriteAbi, functionName: "transfer", args: [transferTo as Address, parseUnits(transferAmount, 18)] }))}>Transfer</button>
            </> : <p className="muted-line">Requires a KSNTPE balance. This wallet holds none.</p>}
          </article>

          {/* Privileged actions — role-gated, honest about reverts */}
          {account && (account.roles.operator || account.roles.guardian || account.roles.proposer) && (
            <article className="wallet-action">
              <h3>Agency console</h3>
              <p className="muted-line">Privileged actions enabled by your roles.</p>
              {account.roles.operator && <button className="secondary" onClick={() => run("Report gross yield", () => w.writeContract({ address: RWA, abi: rwaWriteAbi, functionName: "reportGrossYield", args: [parseEther("1")] }))}>Report 1 ETH gross yield</button>}
              {account.roles.operator && <button className="secondary" onClick={() => run("Mint 100 KSNTPE", () => w.writeContract({ address: RWA, abi: rwaWriteAbi, functionName: "mint", args: [w.address as Address, parseUnits("100", 18)] }))}>Mint 100 KSNTPE to self</button>}
              {account.roles.proposer && <button className="secondary" onClick={() => run("Create proposal", () => w.writeContract({ address: TREASURY, abi: treasuryWriteAbi, functionName: "propose", args: [TREASURY, BigInt(0), "0x", "policy:demo"] }))}>Create zero-value proposal</button>}
              {account.roles.guardian && <button className="secondary danger" onClick={() => run("Pause RWA", () => w.writeContract({ address: RWA, abi: rwaWriteAbi, functionName: "pause", args: [] }))}>Pause RWA token</button>}
            </article>
          )}
        </div>
      )}

      {tx.kind === "pending" && <p className="muted-line">{tx.label}: confirm in your wallet…</p>}
      {tx.kind === "done" && <p className="tx-ok">{tx.label} confirmed · <a href={explorerTx(tx.hash)} target="_blank" rel="noreferrer">view tx ↗</a></p>}
      {tx.kind === "error" && <p className="error">{tx.label} failed: {tx.message}</p>}
    </section>
  );
}

function PanelTitle({ kicker, title, aside }: { kicker: string; title: string; aside?: React.ReactNode }) {
  return <div className="panel-title"><div><small>{kicker}</small><h2>{title}</h2></div>{aside}</div>;
}
