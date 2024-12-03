import { readContract } from "https://esm.sh/@wagmi/core@2.12.2";
import { RouterAbi } from "./abis/routerAbi.ts";
import { config } from "./config.ts";
import { routerAddressMapping } from "./constants.ts";
import { Address, Market } from "./types.ts";
export async function fetchWinningOutcomes(market: Market) {
  const routerAddress = routerAddressMapping[market.chainId];
  if (!routerAddress) return [];
  return await readContract(config, {
    abi: RouterAbi,
    address: routerAddress as Address,
    functionName: "getWinningOutcomes",
    args: [market.conditionId],
    chainId: market.chainId,
  });
}
