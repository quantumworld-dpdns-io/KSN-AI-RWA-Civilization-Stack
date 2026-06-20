"use client";

import { useCallback, useEffect, useState } from "react";
import { parseEther, type Address, type Hex } from "viem";
import { sepolia } from "viem/chains";
import { ensureSepolia, getChainId, getInjectedProvider, requestAccounts, walletClientFor } from "./wallet";

interface WalletState {
  address: Address | null;
  chainId: number | null;
  connecting: boolean;
  error: string;
}

const SEPOLIA_ID = 11155111;

function toMessage(error: unknown): string {
  const e = error as { code?: number; shortMessage?: string; message?: string };
  if (e?.code === 4001) return "Request rejected in wallet.";
  return e?.shortMessage ?? e?.message ?? "Wallet error.";
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({ address: null, chainId: null, connecting: false, error: "" });

  const hasWallet = typeof window !== "undefined" && Boolean(getInjectedProvider());
  const onSepolia = state.chainId === SEPOLIA_ID;

  useEffect(() => {
    const provider = getInjectedProvider();
    if (!provider?.on) return;
    const onAccounts = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      setState((s) => ({ ...s, address: (accounts[0] as Address) ?? null }));
    };
    const onChain = (...args: unknown[]) => setState((s) => ({ ...s, chainId: Number(args[0] as string) }));
    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);
    return () => {
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const connect = useCallback(async () => {
    const provider = getInjectedProvider();
    if (!provider) { setState((s) => ({ ...s, error: "No EVM wallet detected. Install MetaMask." })); return; }
    setState((s) => ({ ...s, connecting: true, error: "" }));
    try {
      const accounts = await requestAccounts(provider);
      await ensureSepolia(provider);
      const chainId = await getChainId(provider);
      setState({ address: accounts[0] ?? null, chainId, connecting: false, error: "" });
    } catch (error) {
      setState((s) => ({ ...s, connecting: false, error: toMessage(error) }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ address: null, chainId: null, connecting: false, error: "" });
  }, []);

  const switchNetwork = useCallback(async () => {
    const provider = getInjectedProvider();
    if (!provider) return;
    try {
      await ensureSepolia(provider);
      setState((s) => ({ ...s, chainId: SEPOLIA_ID, error: "" }));
    } catch (error) {
      setState((s) => ({ ...s, error: toMessage(error) }));
    }
  }, []);

  const signMessage = useCallback(async (message: string): Promise<Hex> => {
    const provider = getInjectedProvider();
    if (!provider || !state.address) throw new Error("Wallet not connected.");
    const client = walletClientFor(provider, state.address);
    return client.signMessage({ account: state.address, message });
  }, [state.address]);

  const fundTreasury = useCallback(async (to: Address, amountEth: string): Promise<Hex> => {
    const provider = getInjectedProvider();
    if (!provider || !state.address) throw new Error("Wallet not connected.");
    await ensureSepolia(provider);
    const client = walletClientFor(provider, state.address);
    return client.sendTransaction({ account: state.address, chain: sepolia, to, value: parseEther(amountEth) });
  }, [state.address]);

  const writeContract = useCallback(async (args: { address: Address; abi: readonly unknown[]; functionName: string; args?: readonly unknown[] }): Promise<Hex> => {
    const provider = getInjectedProvider();
    if (!provider || !state.address) throw new Error("Wallet not connected.");
    await ensureSepolia(provider);
    const client = walletClientFor(provider, state.address);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return client.writeContract({ ...args, account: state.address, chain: sepolia } as any);
  }, [state.address]);

  return { ...state, hasWallet, onSepolia, connect, disconnect, switchNetwork, signMessage, fundTreasury, writeContract, toMessage };
}
