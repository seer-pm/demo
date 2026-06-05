/**
 * Vite config for the Seer web app (Vike SSR + client hydration).
 *
 * ## Monorepo dev
 * `@seer-pm/sdk` and `@seer-pm/react` resolve to package **source** for fast HMR.
 * Subpaths below resolve to pre-built **dist** bundles instead — editing their `.ts`
 * sources does NOT hot-reload in the web app until dist is rebuilt:
 *
 *   - `src/tick-math.ts`       → `@seer-pm/sdk/tick-math`
 *   - `src/order-book.ts`      → `@seer-pm/sdk/order-book`
 *   - `src/liquidity-utils.ts` → `@seer-pm/sdk/liquidity-utils`
 *
 * After changing those files, run `yarn build` in `packages/seer-pm-sdk`, or keep
 * `yarn dev` running there (tsup --watch) in a second terminal while developing.
 * Imports from `@seer-pm/sdk` (main entry) still use source and update on save.
 *
 * ## Uniswap / tick-math (why so many aliases)
 * Liquidity and order-book code uses `@seer-pm/sdk/tick-math` and `@uniswap/*`.
 * Those packages mix CJS and ESM; their `.esm.js` builds break in two places:
 *
 * 1. **SSR (dev):** Vite's module runner follows source maps into virtual `.ts` files
 *    (`jsbi`, `@uniswap/sdk-core`) → `module is not defined`.
 *    Mitigation: heavy swap UI is `clientOnly` in +Page.tsx; `@uniswap/*` is NOT in
 *    `ssr.noExternal`, so the server graph avoids them. SSR-safe paths use
 *    `liquidity-utils` / subgraph `sqrtPrice` instead of tick-math where possible.
 *
 * 2. **Production client build (Rollup):** Aliasing Uniswap to `.esm.js` caused
 *    `default is not exported` (e.g. `import JSBI from 'jsbi'` inside sdk-core).
 *    Mitigation: alias `@uniswap/*` to **CJS entry points** below + `cjsInterop`.
 *
 * ## Dev vs production
 * | Concern              | Dev (`vite dev`)     | Prod (`vike build`)        |
 * |----------------------|----------------------|----------------------------|
 * | Uniswap resolution   | CJS aliases + cjsInterop | Same; Rollup bundles client chunks |
 * | tick-math / order-book | dist `.mjs` via alias | Same                       |
 * | SSR                  | Vike pre-renders; swap widget client-only | SSR bundle + static HTML where configured |
 * | SDK package.json exports | Bypassed; aliases win | Same                       |
 *
 * Run `npm run build` in `packages/seer-pm-sdk` before web build if tick-math dist is missing.
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

// Uniswap/jsbi: use CJS builds — required for prod Rollup; works in dev with cjsInterop.
const jsbiCjs = path.resolve(__dirname, "../node_modules/jsbi/dist/jsbi-cjs.js");
const uniswapSdkCore = path.resolve(__dirname, "../node_modules/@uniswap/sdk-core/dist/cjs/src/index.js");
const uniswapV3Sdk = path.resolve(__dirname, "../node_modules/@uniswap/v3-sdk/dist/index.js");
const uniswapV4Sdk = path.resolve(__dirname, "../node_modules/@uniswap/v4-sdk/dist/index.js");

/**
 * When resolving from SDK **source**, relative `./tick-math` bypasses package.json exports.
 * Redirect to dist bundles (tick-math embeds v3-sdk; built separately via tsup.tick-math.config.ts).
 * Only needed for dev paths that import SDK source (e.g. order-book.ts from index.ts).
 */
function seerPmSdkBundledMath(): Plugin {
  const tickMathDist = path.join(seerPmSdkDist, "tick-math.mjs");
  const liquidityUtilsDist = path.join(seerPmSdkDist, "liquidity-utils.mjs");

  return {
    name: "seer-pm-sdk-bundled-math",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer?.includes(`${path.sep}packages${path.sep}seer-pm-sdk${path.sep}src`)) {
        return null;
      }
      if (source === "./tick-math" || source === "../tick-math") {
        return tickMathDist;
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
    // @swapr/sdk (and its 0x deps) reference process in the browser; provide a shim.
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
      // Monorepo: allow importing from packages/seer-pm-sdk and packages/seer-pm-react.
      allow: [".."],
    },
  },
  ssr: {
    // Do NOT list @uniswap/* here — bundling them in SSR retriggers source-map / CJS issues.
    // Swap/liquidity UI that needs Uniswap is loaded via clientOnly() on the market page.
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
        find: "@seer-pm/sdk/contracts",
        replacement: path.resolve(__dirname, "../packages/seer-pm-sdk/generated/contracts"),
      },
      {
        find: "@seer-pm/sdk/subgraph",
        replacement: path.resolve(__dirname, "../packages/seer-pm-sdk/generated/subgraph"),
      },
      // Dist-only SDK subpaths (see header): rebuild packages/seer-pm-sdk after edits.
      // tick-math → tsup.tick-math.config.ts; order-book / liquidity-utils → main tsup build.
      { find: "@seer-pm/sdk/order-book", replacement: path.join(seerPmSdkDist, "order-book.mjs") },
      { find: "@seer-pm/sdk/tick-math", replacement: path.join(seerPmSdkDist, "tick-math.mjs") },
      {
        find: "@seer-pm/sdk/liquidity-utils",
        replacement: path.join(seerPmSdkDist, "liquidity-utils.mjs"),
      },
      {
        find: "@seer-pm/sdk/abis/eternal-farming",
        replacement: path.resolve(__dirname, "../packages/seer-pm-sdk/abis/EternalFarmingAbi.ts"),
      },
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
