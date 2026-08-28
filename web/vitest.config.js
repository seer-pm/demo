import path from "node:path";
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths';

const sdk = (...p) => path.resolve(__dirname, "../packages/seer-pm-sdk", ...p);

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    // Netlify/Vite resolve `@seer-pm/sdk/*` through the package `exports` map, i.e. through
    // `dist/`. Vitest has no build step, so point the subpaths at source. Keep this list in sync
    // with the subpaths the functions actually import (see AGENTS.md on SDK subpath imports).
    // Array form: `find` is matched longest-first and `/subgraph` (the client barrel in src)
    // must not be swallowed by the `/subgraph/*` prefix that points at generated documents.
    alias: [
      { find: /^@seer-pm\/sdk\/subgraph\/(.*)$/, replacement: sdk("generated/subgraph") + "/$1" },
      { find: "@seer-pm/sdk/subgraph", replacement: sdk("src/subgraph/index.ts") },
      { find: /^@seer-pm\/sdk\/contracts\/(.*)$/, replacement: sdk("generated/contracts") + "/$1" },
      { find: "@seer-pm/sdk/abis/eternal-farming", replacement: sdk("abis/EternalFarmingAbi.ts") },
    ].concat(Object.entries({
      "@seer-pm/sdk/market-types": sdk("src/market-types.ts"),
      "@seer-pm/sdk/market-pools": sdk("src/market-pools.ts"),
      "@seer-pm/sdk/market-odds": sdk("src/market-odds.ts"),
      "@seer-pm/sdk/markets-fetch": sdk("src/markets-fetch.ts"),
      "@seer-pm/sdk/create-market": sdk("src/create-market.ts"),
      "@seer-pm/sdk/liquidity-utils": sdk("src/liquidity-utils.ts"),
      "@seer-pm/sdk/collateral": sdk("src/collateral.ts"),
      "@seer-pm/sdk/chains": sdk("src/chains.ts"),
      "@seer-pm/sdk/reality": sdk("src/reality.ts"),
      "@seer-pm/sdk/sign-in": sdk("src/sign-in.ts"),
      "@seer-pm/sdk/market": sdk("src/market.ts"),
      "@seer-pm/sdk": sdk("src/index.ts"),
      "@seer-pm/react": path.resolve(__dirname, "../packages/seer-pm-react/src/index.ts"),
      "@seer-pm/discussions": path.resolve(__dirname, "../packages/seer-pm-discussions/src/index.ts"),
    }).map(([find, replacement]) => ({ find, replacement }))),
  },
  test: {
    include: ['**/*.test.ts', '**/*.test.tsx'],
    globals: true
  },
})
