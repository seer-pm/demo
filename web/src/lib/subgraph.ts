import {
  curateGraphQLClient,
  getAppSubgraphUrl,
  graphQLClient,
  initApiHost,
  realityGraphQLClient,
  swaprGraphQLClient,
  uniswapGraphQLClient,
} from "@seer-pm/sdk";
import { getAppUrl } from "./utils";

initApiHost(getAppUrl());

export { graphQLClient, curateGraphQLClient, uniswapGraphQLClient, swaprGraphQLClient, realityGraphQLClient };
export { getAppSubgraphUrl as getSubgraphUrl };
