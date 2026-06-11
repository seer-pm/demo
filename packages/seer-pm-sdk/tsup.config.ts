import { defineConfig } from "tsup";

const entries = [
  "src/index.ts",
  "src/market.ts",
  "src/market-types.ts",
  "src/subgraph/index.ts",
  "src/swapr.ts",
  "src/create-market.ts",
  "src/market-pools.ts",
  "src/collateral.ts",
  "src/markets-fetch.ts",
  "src/market-odds.ts",
  "src/reality.ts",
  "src/liquidity-utils.ts",
  "src/chart-data.ts",
  "src/chains.ts",
  "src/cow.ts",
  "src/order-book.ts",
];

export default defineConfig({
  entry: entries,
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  outDir: "dist",
  /** Keep tick-math as a separate SSR-safe bundle (see tsup.tick-math.config.ts). */
  external: [/[/\\]tick-math(?:\.ts)?$/],
});
