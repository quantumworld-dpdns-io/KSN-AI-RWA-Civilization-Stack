"use client";

import { createWalletClient, custom, type Address, type WalletClient } from "viem";
import { sepolia } from "viem/chains";

export const SEPOLIA_HEX = "0xaa36a7"; // 11155111

export type Eip1193 = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  providers?: Eip1193[];
  isMetaMask?: boolean;
};

/** EIP-6963 announced provider. */
export interface ProviderDetail {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: Eip1193;
}

declare global {
  interface Window { ethereum?: Eip1193 }
}

/**
 * EIP-6963 multi-injected provider discovery. Avoids depending on the single
 * `window.ethereum` global, which multiple wallet extensions (MetaMask, Phantom…)
 * fight over and clobber. Each wallet announces itself with name + icon, so we
 * can present a clean picker and select the exact provider the user wants.
 */
export function subscribeProviders(onChange: (list: ProviderDetail[]) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const map = new Map<string, ProviderDetail>();

  const emit = () => onChange(Array.from(map.values()));

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<ProviderDetail>).detail;
    if (detail?.info?.uuid && detail.provider) {
      map.set(detail.info.uuid, detail);
      emit();
    }
  };

  window.addEventListener("eip6963:announceProvider", handler as EventListener);
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  // Legacy fallback: surface window.ethereum if no EIP-6963 wallet responds.
  setTimeout(() => {
    if (map.size === 0 && window.ethereum) {
      map.set("legacy", {
        info: {
          uuid: "legacy",
          name: window.ethereum.isMetaMask ? "MetaMask" : "Injected Wallet",
          icon: "",
          rdns: "legacy.injected"
        },
        provider: window.ethereum
      });
      emit();
    }
  }, 350);

  return () => window.removeEventListener("eip6963:announceProvider", handler as EventListener);
}

export function walletClientFor(provider: Eip1193, account: Address): WalletClient {
  return createWalletClient({ account, chain: sepolia, transport: custom(provider) });
}

export async function requestAccounts(provider: Eip1193): Promise<Address[]> {
  return (await provider.request({ method: "eth_requestAccounts" })) as Address[];
}

export async function getChainId(provider: Eip1193): Promise<number> {
  const hex = (await provider.request({ method: "eth_chainId" })) as string;
  return Number(hex);
}

/** Switch the wallet to Sepolia, adding the chain if the wallet doesn't know it. */
export async function ensureSepolia(provider: Eip1193): Promise<void> {
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_HEX }] });
  } catch (error) {
    const code = (error as { code?: number })?.code;
    if (code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: SEPOLIA_HEX,
          chainName: "Sepolia",
          nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
          blockExplorerUrls: ["https://sepolia.etherscan.io"]
        }]
      });
    } else {
      throw error;
    }
  }
}

export function explorerTx(hash: string) { return `https://sepolia.etherscan.io/tx/${hash}`; }
export function explorerAddress(address: string) { return `https://sepolia.etherscan.io/address/${address}`; }
export function shorten(address: string) { return `${address.slice(0, 6)}…${address.slice(-4)}`; }
