import type { CodegenConfig } from "@graphql-codegen/cli";
import { gnosis, mainnet } from "viem/chains";
import { SUBGRAPHS } from "./src/lib/subgraph-endpoints";

const schemasAndDocuments = [
  {
    type: "seer",
    schema: SUBGRAPHS.seer[gnosis.id],
    documents: "./src/queries/markets.graphql",
  },
  {
    type: "tokens",
    schema: SUBGRAPHS.tokens[gnosis.id],
    documents: "./src/queries/tokens.graphql",
  },
  {
    type: "curate",
    schema: SUBGRAPHS.curate[gnosis.id],
    documents: "./src/queries/curate.graphql",
  },
  {
    type: "swapr",
    schema: [SUBGRAPHS.algebra[gnosis.id], SUBGRAPHS.algebrafarming[gnosis.id]],
    documents: "./src/queries/swapr.graphql",
  },
  {
    type: "uniswap",
    schema: SUBGRAPHS.uniswap[mainnet.id],
    documents: "./src/queries/uniswap.graphql",
  },
  {
    type: "reality",
    schema: SUBGRAPHS.reality[gnosis.id],
    documents: "./src/queries/reality.graphql",
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
