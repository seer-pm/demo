import type { Address } from "viem";
import type { Log } from "viem";
import { parseEventLogs } from "viem/utils";
import { futarchyFactoryAbi, marketFactoryAbi } from "../generated/contracts/market-factory";

/**
 * Parses transaction logs for a MarketFactory `NewMarket` event and returns the new market address.
 * Returns `undefined` if the event is not found.
 */
export function getNewMarketFromLogs(logs: Log[]): Address | undefined {
  const parsed = parseEventLogs({
    abi: marketFactoryAbi,
    eventName: "NewMarket",
    logs,
  });
  return parsed[0]?.args?.market as Address | undefined;
}

/**
 * Parses transaction logs for a FutarchyFactory `NewProposal` event and returns the new proposal address.
 * Returns `undefined` if the event is not found.
 */
export function getNewProposalFromLogs(logs: Log[]): Address | undefined {
  const parsed = parseEventLogs({
    abi: futarchyFactoryAbi,
    eventName: "NewProposal",
    logs,
  });
  return parsed[0]?.args?.proposal as Address | undefined;
}
