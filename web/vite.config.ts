import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import vike from "vike/plugin";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import { cjsInterop } from "vite-plugin-cjs-interop";

const seerPmSdkSrc = path.resolve(__dirname, "../packages/seer-pm-sdk/src");
const seerPmReactSrc = path.resolve(__dirname, "../packages/seer-pm-react/src");

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vike(),
    checker({ typescript: true }),
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
      // Allow serving files from one level up to the project root
      allow: [".."],
    },
  },
  ssr: {
    noExternal: [
      "react-easy-crop",
      "echarts-for-react",
      "@bigmi/core",
      "@uniswap/sdk-core",
    ],
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: "node-fetch", replacement: "isomorphic-fetch" },
      { find: "jsbi", replacement: path.resolve(__dirname, "../node_modules/jsbi/dist/jsbi.mjs") },
      {
        find: "@seer-pm/sdk/order-book",
        replacement: path.resolve(seerPmSdkSrc, "order-book.ts"),
      },
      {
        find: "@seer-pm/sdk/contracts",
        replacement: path.resolve(__dirname, "../packages/seer-pm-sdk/generated/contracts"),
      },
      {
        find: "@seer-pm/sdk/subgraph",
        replacement: path.resolve(__dirname, "../packages/seer-pm-sdk/generated/subgraph"),
      },
      {
        find: "@seer-pm/sdk/abis/eternal-farming",
        replacement: path.resolve(__dirname, "../packages/seer-pm-sdk/abis/EternalFarmingAbi.ts"),
      },
      { find: /^@seer-pm\/react\/(.+)$/, replacement: `${seerPmReactSrc}/$1` },
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
