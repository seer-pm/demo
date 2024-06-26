import type { CodegenConfig } from "@graphql-codegen/cli";
import { gnosis } from "viem/chains";
import {
  CURATE_SUBGRAPH_URLS,
  SUBGRAPH_URLS,
  SWAPR_ALGEBRA_FARMING_SUBGRAPH_URLS,
  SWAPR_ALGEBRA_SUBGRAPH_URLS,
} from "./src/lib/subgraph";
const config: CodegenConfig = {
  overwrite: true,
  schema: [
    SUBGRAPH_URLS[gnosis.id]!,
    CURATE_SUBGRAPH_URLS[gnosis.id]!,
    SWAPR_ALGEBRA_SUBGRAPH_URLS[gnosis.id]!,
    SWAPR_ALGEBRA_FARMING_SUBGRAPH_URLS[gnosis.id]!,
  ],
  documents: "./src/queries/*.graphql",
  generates: {
    "src/hooks/queries/generated.ts": {
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
    },
  },
  ignoreNoDocuments: true,
};

export default config;
