import type { CodegenConfig } from "@graphql-codegen/cli";
import { gnosis, mainnet, sepolia } from "viem/chains";

const chainIds = [mainnet.id, sepolia.id, gnosis.id] as const;

export type SupportedChain = (typeof chainIds)[number];
const api = "8b2690ffdd390bad59638b894ee8d9f6";

export type SubgraphTypes = "seer" | "curate" | "curate-fallback" | "uniswap" | "algebra" | "algebrafarming";
export const SUBGRAPHS: Record<SubgraphTypes, Partial<Record<SupportedChain, string>>> = {
  seer: {
    [gnosis.id]: `https://api.studio.thegraph.com/query/74975/seer-pm/version/latest`,
    [mainnet.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/BMQD869m8LnGJJfqMRjcQ16RTyUw6EUx5jkh3qWhSn3M`,
  },
  curate: {
    // TODO: add fallback urls? or change subgraph?
    [gnosis.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/9hHo5MpjpC1JqfD3BsgFnojGurXRHTrHWcUcZPPCo6m8`,
    [mainnet.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/A5oqWboEuDezwqpkaJjih4ckGhoHRoXZExqUbja2k1NQ`,
  },
  "curate-fallback": {
    [gnosis.id]: "https://api.studio.thegraph.com/query/61738/legacy-curate-gnosis/version/latest",
    [mainnet.id]: "https://api.studio.thegraph.com/query/61738/legacy-curate-mainnet/version/latest",
  },
  algebra: {
    [gnosis.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/AAA1vYjxwFHzbt6qKwLHNcDSASyr1J1xVViDH8gTMFMR`,
  },
  algebrafarming: {
    [gnosis.id]: `https://gateway-arbitrum.network.thegraph.com/api/${api}/subgraphs/id/4WysHZ1gFJcv1HLAobLMx3dS9B6aovExzyG3n7kRjwKT`,
  },
  uniswap: {
    [mainnet.id]: `https://gateway.thegraph.com/api/${api}/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`,
  },
};

const schemasAndDocuments = [
  {
    type: "seer",
    schema: SUBGRAPHS.seer[gnosis.id]!,
    documents: "./src/queries/markets.graphql",
  },
  {
    type: "curate",
    schema: SUBGRAPHS.curate[gnosis.id]!,
    documents: "./src/queries/curate.graphql",
  },
  {
    type: "swapr",
    schema: [SUBGRAPHS.algebra[gnosis.id]!, SUBGRAPHS.algebrafarming[gnosis.id]!],
    documents: "./src/queries/swapr.graphql",
  },
  {
    type: "uniswap",
    schema: SUBGRAPHS.uniswap[mainnet.id]!,
    documents: "./src/queries/uniswap.graphql",
  },
];

const generates = schemasAndDocuments.reduce(
  (acum, curr) => {
    acum[`src/hooks/queries/gql-generated-${curr.type}.ts`] = {
      schema: curr.schema,
      documents: curr.documents,
      plugins: [
        "typescript",
        // https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-operations
        "typescript-operations",
        // https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-react-query
        //'typescript-react-query',
        // https://the-guild.dev/graphql/codegen/plugins/typescript/named-operations-object
        //'named-operations-object',
        // https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-graphql-request
        "typescript-graphql-request",
      ],
      config: {
        strictScalars: true,
        scalars: {
          BigDecimal: "string",
          BigInt: "string",
          Int8: "string",
          Bytes: "`0x${string}`",
          Timestamp: "string",
        },
      },
    };

    return acum;
  },
  {} as CodegenConfig["generates"],
);

const config: CodegenConfig = {
  overwrite: true,
  generates,
  ignoreNoDocuments: true,
};

export default config;
