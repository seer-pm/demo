import type { Config } from "@wagmi/core";
import { marketFactoryAddress } from "../generated/generated-market-factory";
import { readMarketViewGetMarkets } from "../generated/generated-market-view";
import type { SupportedChain } from "./chains";
import type { Market } from "./market-types";
import { mapOnChainMarket } from "./on-chain-market";

/**
 * Reads markets from the MarketView contract for a given chain.
 * Requires wagmi config for RPC/client (no config in SDK).
 */
export async function searchOnChainMarkets(config: Config, chainId: SupportedChain): Promise<Market[]> {
  return (
    await readMarketViewGetMarkets(config, {
      args: [BigInt(50), marketFactoryAddress[chainId]],
      chainId,
    })
  )
    .filter((m) => m.id !== "0x0000000000000000000000000000000000000000")
    .map((market) =>
      mapOnChainMarket(market, {
        chainId,
        outcomesSupply: 0n,
        liquidityUSD: 0,
        incentive: 0,
        hasLiquidity: false,
        categories: ["misc"],
        poolBalance: [],
        odds: [],
        url: "",
      }),
    );
}
