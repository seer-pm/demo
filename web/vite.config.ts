/**
 * Vite config for the Seer web app (Vike SSR + client hydration).
 *
 * ## Monorepo dev
 * `@seer-pm/sdk` and `@seer-pm/react` resolve to package **source** for fast HMR.
 * Subpaths below resolve to pre-built **dist** or package source via aliases:
 *
 *   - `src/tick-math.ts`       → `@seer-pm/sdk/tick-math` (source; pure bigint)
 *   - `src/liquidity-utils.ts` → `@seer-pm/sdk/liquidity-utils` (dist)
 *   - `@seer-pm/order-book`    → light entry (config + URLs; no Uniswap)
 *   - `@seer-pm/order-book/v4` → Uniswap-heavy ops (limit orders, mint, pools)
 *   - `@seer-pm/contracts-ts/*` → generated contract sources
 *
 * After changing liquidity-utils, run `yarn build` in the SDK package, or keep
 * `yarn dev` running there (tsup --watch) in a second terminal while developing.
 * Imports from `@seer-pm/sdk` (main entry) and tick-math still use source and update on save.
 *
 * ## Uniswap (why CJS aliases + order-book split)
 * `@seer-pm/order-book/v4` and residual v3 helpers use `@uniswap/*`.
 * Those packages mix CJS and ESM; their `.esm.js` builds break in two places:
 *
 * 1. **SSR (dev):** Vite's module runner evaluates CJS Uniswap as ESM →
 *    `exports is not defined` / `module is not defined`.
 *    Root fix: main `@seer-pm/order-book` stays Uniswap-free so SSR (Outcomes,
 *    MarketTabs, useMarketPools) never loads `@uniswap/*`. Heavy UI stays on
 *    `@seer-pm/order-book/v4` + `clientOnly` where needed. Do NOT put
 *    `@uniswap/*` in `ssr.noExternal`.
 *
 * 2. **Production client build (Rollup):** Aliasing Uniswap to `.esm.js` caused
 *    `default is not exported` (e.g. `import JSBI from 'jsbi'` inside sdk-core).
 *    Mitigation: alias `@uniswap/*` to **CJS entry points** below + `cjsInterop`.
 *
 * ## Dev vs production
 * | Concern                   | Dev (`vite dev`)              | Prod (`vike build`)        |
 * |---------------------------|-------------------------------|----------------------------|
 * | Uniswap resolution        | CJS aliases + cjsInterop      | Same; Rollup bundles client chunks |
 * | tick-math                 | package source via alias      | Same                       |
 * | order-book / contracts-ts | package source via alias      | Same                       |
 * | SSR                       | Vike pre-renders; swap widget client-only | SSR bundle + static HTML where configured |
 * | package.json exports      | Bypassed; aliases win         | Same                       |
 */
import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import vike from "vike/plugin";
import { defineConfig, type Plugin } from "vite";
import checker from "vite-plugin-checker";
import { cjsInterop } from "vite-plugin-cjs-interop";

const seerPmSdkSrc = path.resolve(__dirname, "../packages/seer-pm-sdk/src");
const seerPmSdkDist = path.resolve(__dirname, "../packages/seer-pm-sdk/dist");
const seerPmReactSrc = path.resolve(__dirname, "../packages/seer-pm-react/src");
const seerOrderBookSrc = path.resolve(__dirname, "../packages/seer-pm-order-book/src");
const seerContractsTsGenerated = path.resolve(
  __dirname,
  "../packages/seer-pm-contracts-ts/generated/contracts",
);

// Uniswap/jsbi: use CJS builds — required for prod Rollup; works in dev with cjsInterop.
const jsbiCjs = path.resolve(__dirname, "../node_modules/jsbi/dist/jsbi-cjs.js");
const uniswapSdkCore = path.resolve(__dirname, "../node_modules/@uniswap/sdk-core/dist/cjs/src/index.js");
const uniswapV3Sdk = path.resolve(__dirname, "../node_modules/@uniswap/v3-sdk/dist/index.js");
const uniswapV4Sdk = path.resolve(__dirname, "../node_modules/@uniswap/v4-sdk/dist/cjs/src/index.js");

/**
 * When resolving from SDK **source**, relative `./liquidity-utils` bypasses package.json exports.
 * Redirect to dist bundle.
 */
function seerPmSdkBundledMath(): Plugin {
  const liquidityUtilsDist = path.join(seerPmSdkDist, "liquidity-utils.mjs");

  return {
    name: "seer-pm-sdk-bundled-math",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer?.includes(`${path.sep}packages${path.sep}seer-pm-sdk${path.sep}src`)) {
        return null;
      }
      if (source === "./liquidity-utils" || source === "../liquidity-utils") {
        return liquidityUtilsDist;
      }
      return null;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    seerPmSdkBundledMath(),
    react(),
    vike(),
    checker({ typescript: true }),
    // Default import interop for CJS deps in both dev and prod client bundles.
    cjsInterop({
      dependencies: [
        "react-paginate",
        "jsbi",
        "@uniswap/sdk-core",
        "@uniswap/v3-sdk",
        "@uniswap/v4-sdk",
      ],
    }),
  ],
  define: {
    global: "window",
    "process.env": "{}",
  },
  build: {
    rollupOptions: {
      output: {
        intro: "globalThis.process = globalThis.process || { env: {} };",
      },
    },
  },
  server: {
    fs: {
      // Monorepo: allow importing from packages/*.
      allow: [".."],
    },
  },
  ssr: {
    // Do NOT list @uniswap/* here — bundling them in SSR retriggers CJS/ESM issues.
    // SSR uses @seer-pm/order-book (light). Uniswap lives under @seer-pm/order-book/v4
    // and clientOnly() swap/liquidity/open-orders UI.
    noExternal: ["react-easy-crop", "echarts-for-react", "@bigmi/core"],
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: "node-fetch", replacement: "isomorphic-fetch" },
      { find: "jsbi", replacement: jsbiCjs },
      { find: "@uniswap/sdk-core", replacement: uniswapSdkCore },
      { find: "@uniswap/v3-sdk", replacement: uniswapV3Sdk },
      { find: "@uniswap/v4-sdk", replacement: uniswapV4Sdk },
      {
        find: /^@seer-pm\/contracts-ts\/(.+)$/,
        replacement: `${seerContractsTsGenerated}/$1.ts`,
      },
      {
        find: "@seer-pm/sdk/subgraph",
        replacement: path.resolve(__dirname, "../packages/seer-pm-sdk/generated/subgraph"),
      },
      { find: "@seer-pm/sdk/tick-math", replacement: path.resolve(seerPmSdkSrc, "tick-math.ts") },
      {
        find: "@seer-pm/sdk/liquidity-utils",
        replacement: path.join(seerPmSdkDist, "liquidity-utils.mjs"),
      },
      {
        find: "@seer-pm/sdk/abis/eternal-farming",
        replacement: path.resolve(__dirname, "../packages/seer-pm-sdk/abis/EternalFarmingAbi.ts"),
      },
      // More specific /v4 alias must come before the main order-book alias.
      { find: "@seer-pm/order-book/v4", replacement: path.resolve(seerOrderBookSrc, "v4.ts") },
      { find: "@seer-pm/order-book", replacement: path.resolve(seerOrderBookSrc, "index.ts") },
      {
        find: /^@seer-pm\/react\/(.+)$/,
        replacement: `${seerPmReactSrc}/$1`,
      },
      { find: "@seer-pm/react", replacement: path.resolve(seerPmReactSrc, "index.ts") },
      { find: "@seer-pm/sdk", replacement: path.resolve(seerPmSdkSrc, "index.ts") },
    ],
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
});
