import type { Address } from "viem";
import { base, gnosis, mainnet, optimism, sepolia } from "viem/chains";
import {
  conditionalRouterAddress,
  futarchyRouterAddress,
  gnosisRouterAddress,
  mainnetRouterAddress,
  routerAddress,
} from "../generated/contracts/router";

/** Minimal market shape needed for router resolution. */
export interface MarketLike {
  id: Address;
  type: "Generic" | "Futarchy";
  chainId: number;
}

export type RouterTypes = "base" | "mainnet" | "gnosis";

/** Map of router contract addresses by chain (from generated contracts). */
export interface RouterAddressMap {
  futarchyRouterAddress: Record<number, Address>;
  gnosisRouterAddress: Record<number, Address>;
  mainnetRouterAddress: Record<number, Address>;
  routerAddress: Record<number, Address>;
  conditionalRouterAddress: Record<number, Address>;
}

/** Deployed Seer router addresses by chain (generated from contracts). Not DEX routers. */
export const routerAddressMap: RouterAddressMap = {
  conditionalRouterAddress,
  futarchyRouterAddress,
  gnosisRouterAddress,
  mainnetRouterAddress,
  routerAddress,
};

/** Router contract addresses on `chainId` across all deployed router roles (CTF only). */
export function getRouterAddresses(chainId: number): Address[] {
  const out: Address[] = [];
  for (const map of Object.values(routerAddressMap)) {
    const addr = map[chainId];
    if (addr) out.push(addr);
  }
  return out;
}

export const CHAIN_ROUTERS: Record<number, RouterTypes> = {
  [gnosis.id]: "gnosis",
  [mainnet.id]: "mainnet",
  [optimism.id]: "base",
  [base.id]: "base",
  [sepolia.id]: "base",
};

const DEFAULT_CHAIN_ID = gnosis.id;

export function getRouterAddress(market: MarketLike): Address {
  if (market.type === "Futarchy") {
    return routerAddressMap.futarchyRouterAddress[market.chainId];
  }
  const chainId = market.chainId ?? DEFAULT_CHAIN_ID;
  return (
    routerAddressMap.gnosisRouterAddress[chainId] ??
    routerAddressMap.mainnetRouterAddress[chainId] ??
    routerAddressMap.routerAddress[chainId]
  );
}

export function getRedeemRouter(isRedeemToParentCollateral: boolean, market: MarketLike): Address {
  if (market.type === "Futarchy") {
    return routerAddressMap.futarchyRouterAddress[market.chainId];
  }
  if (isRedeemToParentCollateral) {
    return routerAddressMap.conditionalRouterAddress[market.chainId];
  }
  return getRouterAddress(market);
}
