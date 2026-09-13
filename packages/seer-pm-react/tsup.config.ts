import { defineConfig } from "tsup";

// The V4 hooks are separate entries so consumers that never touch the order book do not pull
// @uniswap/* (via @seer-pm/order-book/v4) into their bundle through the main index.
export default defineConfig({
  entry: [
    "src/index.ts",
    "src/hooks/useAddV4Liquidity.ts",
    "src/hooks/useIsOrderBookPoolInitialized.ts",
    "src/hooks/usePlaceV4LimitOrder.ts",
    "src/hooks/useManageV4LimitOrders.ts",
    "src/hooks/useUserV4Positions.ts",
    "src/hooks/useManageV4Positions.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  outDir: "dist",
});
