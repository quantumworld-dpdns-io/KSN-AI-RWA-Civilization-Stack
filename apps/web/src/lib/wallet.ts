"use client";

import { createWalletClient, custom, type Address, type WalletClient } from "viem";
import { sepolia } from "viem/chains";

export const SEPOLIA_HEX = "0xaa36a7"; // 11155111

type Eip1193 = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  providers?: Eip1193[];
};

declare global {
  interface Window { ethereum?: Eip1193 }
}

/**
 * Pick a usable injected EIP-1193 provider. When several wallet extensions are
 * present (e.g. MetaMask + Phantom) `window.ethereum.providers` holds them all;
 * prefer MetaMask, otherwise the first that can sign EVM transactions.
 */
export function getInjectedProvider(): Eip1193 | null {
  if (typeof window === "undefined" || !window.ethereum) return null;
  const eth = window.ethereum;
  const list = Array.isArray(eth.providers) && eth.providers.length ? eth.providers : [eth];
  const metamask = list.find((p) => (p as unknown as { isMetaMask?: boolean }).isMetaMask);
  return metamask ?? list[0] ?? null;
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
