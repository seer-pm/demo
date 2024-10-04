import type { CodegenConfig } from "@graphql-codegen/cli";
import { gnosis, mainnet } from "viem/chains";
import {
  CURATE_SUBGRAPH_URLS,
  SUBGRAPH_URLS,
  SWAPR_ALGEBRA_FARMING_SUBGRAPH_URLS,
  SWAPR_ALGEBRA_SUBGRAPH_URLS,
  UNISWAP_SUBGRAPH_URLS,
} from "./src/lib/subgraph";

const schemasAndDocuments = [
  {
    type: "seer",
    schema: SUBGRAPH_URLS[gnosis.id]!,
    documents: "./src/queries/markets.graphql",
  },
  {
    type: "curate",
    schema: CURATE_SUBGRAPH_URLS[gnosis.id]!,
    documents: "./src/queries/curate.graphql",
  },
  {
    type: "swapr",
    schema: [SWAPR_ALGEBRA_SUBGRAPH_URLS[gnosis.id]!, SWAPR_ALGEBRA_FARMING_SUBGRAPH_URLS[gnosis.id]!],
    documents: "./src/queries/swapr.graphql",
  },
  {
    type: "uniswap",
    schema: UNISWAP_SUBGRAPH_URLS[mainnet.id],
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
