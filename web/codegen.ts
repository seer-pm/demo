import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: [
    "https://gateway-arbitrum.network.thegraph.com/api/8b2690ffdd390bad59638b894ee8d9f6/subgraphs/id/B4vyRqJaSHD8dRDb3BFRoAzuBK18c1QQcXq94JbxDxWH",
    "https://api.thegraph.com/subgraphs/name/kleros/legacy-curate-xdai",
    "https://api.thegraph.com/subgraphs/name/swaprhq/algebra-v19",
    "https://api.thegraph.com/subgraphs/name/swaprhq/algebrafarming-v19",
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
