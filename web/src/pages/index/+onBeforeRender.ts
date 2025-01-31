import { UseGraphMarketsParams, getUseGraphMarketsKey, useGraphMarketsQueryFn } from "@/hooks/useMarkets";
import { queryClient } from "@/lib/query-client";
import { dehydrate } from "@tanstack/react-query";

export default async function onBeforeRender() {
  const params: UseGraphMarketsParams = {
    chainsList: [],
    type: "Generic",
    marketName: "",
    marketStatusList: [],
    creator: "",
    participant: "",
    orderBy: undefined,
    orderDirection: undefined,
  };
  await queryClient.prefetchQuery({
    queryKey: getUseGraphMarketsKey(params),
    queryFn: async () => {
      return useGraphMarketsQueryFn(params);
    },
  });
  const dehydratedState = dehydrate(queryClient);

  return {
    pageContext: {
      dehydratedState,
    },
  };
}
