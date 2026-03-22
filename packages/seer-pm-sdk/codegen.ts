import type { CodegenConfig } from "@graphql-codegen/cli";
import { gnosis, mainnet } from "viem/chains";
import { SUBGRAPHS } from "./src/subgraph/subgraph-endpoints";

const schemasAndDocuments = [
  {
    type: "seer",
    schema: SUBGRAPHS.seer[gnosis.id],
    documents: "./queries/markets.graphql",
  },
  {
    type: "tokens",
    schema: SUBGRAPHS.tokens[gnosis.id],
    documents: "./queries/tokens.graphql",
  },
  {
    type: "curate",
    schema: SUBGRAPHS.curate[gnosis.id],
    documents: "./queries/curate.graphql",
  },
  {
    type: "swapr",
    schema: [SUBGRAPHS.algebra[gnosis.id], SUBGRAPHS.algebrafarming[gnosis.id]],
    documents: "./queries/swapr.graphql",
  },
  {
    type: "uniswap",
    schema: SUBGRAPHS.uniswap[mainnet.id],
    documents: "./queries/uniswap.graphql",
  },
  {
    type: "reality",
    schema: SUBGRAPHS.reality[gnosis.id],
    documents: "./queries/reality.graphql",
  },
];

const generates = schemasAndDocuments.reduce(
  (acum, curr) => {
    acum[`generated/subgraph/${curr.type}.ts`] = {
      schema: curr.schema,
      documents: curr.documents,
      plugins: ["typescript", "typescript-operations", "typescript-graphql-request"],
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
