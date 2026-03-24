import type { Market } from "@seer-pm/sdk";
import { getWinningPositions } from "@seer-pm/sdk";
import type { WinningPositionsResult } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useClient } from "wagmi";
import { useMarketPositions } from "./useMarketPositions";

export const useWinningPositions = (account: Address | undefined, market: Market) => {
  const client = useClient({ chainId: market.chainId });
  const { data: positions = [] } = useMarketPositions(account, market);

  return useQuery<WinningPositionsResult | undefined, Error>({
    enabled: !!client && positions.length > 0,
    queryKey: [
      "useWinningPositions",
      market.id,
      market.chainId,
      positions.map((x) => ({ ...x, balance: x.balance.toString() })),
    ],
    queryFn: async () => getWinningPositions({ client: client!, market, positions }),
  });
};
