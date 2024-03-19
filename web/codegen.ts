import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: 'https://api.thegraph.com/subgraphs/name/xyzseer/seer-pm',
  documents: "./src/queries/*.graphql",
  generates: {
    'src/hooks/queries/generated.ts': {
        plugins: [
            'typescript',
            // https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-operations
            'typescript-operations',
            // https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-react-query
            //'typescript-react-query',
            // https://the-guild.dev/graphql/codegen/plugins/typescript/named-operations-object
            //'named-operations-object',
            // https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-graphql-request
            'typescript-graphql-request'

        ],
        config: {
            strictScalars: true,
            scalars: {
              BigDecimal: 'string',
              BigInt: 'string',
              Int8: 'string',
              Bytes: '`0x${string}`'
            },
        },
    },
  },
  ignoreNoDocuments: true,
};

export default config;