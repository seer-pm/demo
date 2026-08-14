import { gnosis } from "@/lib/chains";
import type { MarketDataMapping, SupportedChain } from "@seer-pm/sdk";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@seer-pm/sdk/subgraph";
import { OrderDirection, getSdk as getSwaprSdk } from "@seer-pm/sdk/subgraph/swapr";
import { getSdk as getUniswapSdk } from "@seer-pm/sdk/subgraph/uniswap";
import { type TimestampIdPageItem, paginateByTimestampId } from "./subgraphTimestampIdPagination";

export function getDexSubgraph(chainId: SupportedChain) {
  const client = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);
  if (!client) {
    throw new Error(`Subgraph not available for chain ${chainId}`);
  }
  return { client, sdk: chainId === gnosis.id ? getSwaprSdk : getUniswapSdk };
}

export function mappingTokenIds(mappings: MarketDataMapping): string[] {
  return [...mappings.allTokensIds];
}

export async function paginateDexByTimestampId<T extends TimestampIdPageItem>(args: {
  chainId: SupportedChain;
  tokenIds: string[];
  accountFilters: Record<string, unknown>[];
  startTime?: number;
  endTime?: number;
  orderBy: string;
  resultKey: string;
  // biome-ignore lint/suspicious/noExplicitAny:
  query: (sdk: any, vars: any) => Promise<Record<string, T[]>>;
}): Promise<T[]> {
  const { client, sdk } = getDexSubgraph(args.chainId);
  return paginateByTimestampId<T>({
    startTime: args.startTime,
    endTime: args.endTime,
    tokenIds: args.tokenIds,
    accountFilters: args.accountFilters,
    fetchPage: async (where, first) => {
      const data = await args.query(sdk(client), {
        first,
        orderBy: args.orderBy,
        orderDirection: OrderDirection.Desc,
        where,
      });
      return data[args.resultKey] ?? [];
    },
  });
}
