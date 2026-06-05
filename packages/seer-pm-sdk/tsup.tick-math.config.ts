import path from "node:path";
import { defineConfig } from "tsup";

const jsbiCjs = path.resolve(__dirname, "../../node_modules/jsbi/dist/jsbi-cjs.js");

/** SSR-safe tick-math: bundle Uniswap + jsbi (CJS) so dist has no runtime imports to source-mapped .ts. */
export default defineConfig({
  entry: ["src/tick-math.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: false,
  outDir: "dist",
  splitting: false,
  noExternal: ["@uniswap/v3-sdk", "@uniswap/sdk-core"],
  esbuildOptions(options) {
    options.alias = { ...options.alias, jsbi: jsbiCjs };
  },
});
