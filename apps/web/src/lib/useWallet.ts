"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseEther, type Address, type Hex } from "viem";
import { sepolia } from "viem/chains";
import { ensureSepolia, getChainId, requestAccounts, subscribeProviders, walletClientFor, type Eip1193, type ProviderDetail } from "./wallet";

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
  const [wallets, setWallets] = useState<ProviderDetail[]>([]);
  const selected = useRef<Eip1193 | null>(null);

  const onSepolia = state.chainId === SEPOLIA_ID;
  const hasWallet = wallets.length > 0;

  // EIP-6963 discovery.
  useEffect(() => subscribeProviders(setWallets), []);

  // Bind account/chain listeners to the currently selected provider.
  useEffect(() => {
    const provider = selected.current;
    if (!provider?.on || !state.address) return;
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
  }, [state.address]);

  const connect = useCallback(async (detail?: ProviderDetail) => {
    const provider = detail?.provider ?? selected.current ?? wallets[0]?.provider;
    if (!provider) { setState((s) => ({ ...s, error: "No EVM wallet detected. Install MetaMask." })); return; }
    selected.current = provider;
    setState((s) => ({ ...s, connecting: true, error: "" }));
    try {
      const accounts = await requestAccounts(provider);
      await ensureSepolia(provider);
      const chainId = await getChainId(provider);
      setState({ address: accounts[0] ?? null, chainId, connecting: false, error: "" });
    } catch (error) {
      setState((s) => ({ ...s, connecting: false, error: toMessage(error) }));
    }
  }, [wallets]);

  const disconnect = useCallback(() => {
    selected.current = null;
    setState({ address: null, chainId: null, connecting: false, error: "" });
  }, []);

  const switchNetwork = useCallback(async () => {
    const provider = selected.current;
    if (!provider) return;
    try {
      await ensureSepolia(provider);
      setState((s) => ({ ...s, chainId: SEPOLIA_ID, error: "" }));
    } catch (error) {
      setState((s) => ({ ...s, error: toMessage(error) }));
    }
  }, []);

  const signMessage = useCallback(async (message: string): Promise<Hex> => {
    const provider = selected.current;
    if (!provider || !state.address) throw new Error("Wallet not connected.");
    return walletClientFor(provider, state.address).signMessage({ account: state.address, message });
  }, [state.address]);

  const fundTreasury = useCallback(async (to: Address, amountEth: string): Promise<Hex> => {
    const provider = selected.current;
    if (!provider || !state.address) throw new Error("Wallet not connected.");
    await ensureSepolia(provider);
    return walletClientFor(provider, state.address).sendTransaction({ account: state.address, chain: sepolia, to, value: parseEther(amountEth) });
  }, [state.address]);

  const writeContract = useCallback(async (args: { address: Address; abi: readonly unknown[]; functionName: string; args?: readonly unknown[] }): Promise<Hex> => {
    const provider = selected.current;
    if (!provider || !state.address) throw new Error("Wallet not connected.");
    await ensureSepolia(provider);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return walletClientFor(provider, state.address).writeContract({ ...args, account: state.address, chain: sepolia } as any);
  }, [state.address]);

  return { ...state, wallets, hasWallet, onSepolia, connect, disconnect, switchNetwork, signMessage, fundTreasury, writeContract, toMessage };
}
