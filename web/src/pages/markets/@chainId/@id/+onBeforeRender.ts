import { getUseGraphMarketKey, useGraphMarketQueryFn } from "@/hooks/useMarket";
import { SupportedChain } from "@/lib/chains";
import { getOpeningTime } from "@/lib/market";
import { queryClient } from "@/lib/query-client";
import { dehydrate } from "@tanstack/react-query";
import { Address, isAddress } from "viem";
import { PageContext } from "vike/types";

export default async function onBeforeRender(pageContext: PageContext) {
  const market = await queryClient.fetchQuery({
    queryKey: getUseGraphMarketKey(pageContext.routeParams.id as Address),
    queryFn: async () => {
      return useGraphMarketQueryFn(
        pageContext.routeParams.id as Address,
        Number(pageContext.routeParams.chainId) as SupportedChain,
      );
    },
  });
  const dehydratedState = dehydrate(queryClient);

  if (isAddress(pageContext.routeParams.id) && market?.url) {
    // we are fetching the market by address, redirect to the url
    // TODO: on production this redirect doesn't work
    //throw redirect(paths.market(market), 301);
  }

  return {
    pageContext: {
      dehydratedState,
      title: `Seer | ${market.marketName}`,
      description: `Answer opening date: ${getOpeningTime(market)}. Outcomes: ${market.outcomes
        .slice(0, -1)
        .join(", ")}.`,
    },
  };
}
