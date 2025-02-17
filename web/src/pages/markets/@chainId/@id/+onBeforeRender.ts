import { useGraphMarketQueryFn } from "@/hooks/useMarket";
import { SupportedChain } from "@/lib/chains";
import { getOpeningTime } from "@/lib/market";
import { FetchMarketParams } from "@/lib/markets-search";
import { queryClient } from "@/lib/query-client";
import { getAppUrl } from "@/lib/utils";
import { dehydrate } from "@tanstack/react-query";
import { Address, isAddress } from "viem";
import { PageContext } from "vike/types";

export default async function onBeforeRender(pageContext: PageContext) {
  try {
    const { id, chainId } = pageContext.routeParams;
    const { title, description } = await queryClient.fetchQuery({
      queryKey: ["marketMetadata", id.toLocaleLowerCase(), chainId],
      staleTime: Number.POSITIVE_INFINITY,
      gcTime: Number.POSITIVE_INFINITY,
      queryFn: async () => {
        try {
          const params: FetchMarketParams = { chainsList: [chainId] };

          if (!isAddress(id, { strict: false })) {
            params.url = id;
          } else {
            params.id = id;
          }
          const { metadata } = await fetch(`${getAppUrl()}/.netlify/functions/market-metadata`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
          }).then((response) => response.json());
          return metadata;
        } catch (e) {
          const market = await useGraphMarketQueryFn(
            pageContext.routeParams.id as Address,
            Number(pageContext.routeParams.chainId) as SupportedChain,
          );
          return {
            title: `Seer | ${market.marketName}`,
            description: `Answer opening date: ${getOpeningTime(market)}. Outcomes: ${market.outcomes
              .slice(0, -1)
              .join(", ")}.`,
          };
        }
      },
    });
    const dehydratedState = dehydrate(queryClient);
    return {
      pageContext: {
        dehydratedState,
        title,
        description,
      },
    };
  } catch (e) {}
}
