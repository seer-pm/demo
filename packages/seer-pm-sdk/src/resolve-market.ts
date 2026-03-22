import { encodeFunctionData } from "viem";
import type { Address } from "viem";
import { marketAbi } from "../generated/contracts/market-factory";
import type { Execution } from "./execution";

/**
 * Returns an Execution (to, value, data, chainId) for resolving a market (Market.resolve()).
 * Use this to send the tx (e.g. sendTransaction) or to add to a 7702 batch.
 *
 * @param marketAddress - Market contract address
 * @param chainId - Chain id
 */
export function getResolveMarketExecution(marketAddress: Address, chainId: number): Execution {
  const data = encodeFunctionData({
    abi: marketAbi,
    functionName: "resolve",
    args: [],
  });

  return {
    to: marketAddress,
    value: 0n,
    data,
    chainId,
  };
}
