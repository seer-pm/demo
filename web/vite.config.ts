import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import vike from "vike/plugin";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import { cjsInterop } from "vite-plugin-cjs-interop";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vike(),
    checker({ typescript: true }),
    cjsInterop({
      dependencies: ["react-paginate"],
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
    noExternal: ["react-easy-crop", "echarts-for-react", "@bigmi/core"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "node-fetch": "isomorphic-fetch",
      jsbi: path.resolve(__dirname, "./../node_modules/jsbi/dist/jsbi-cjs.js"),
      "@seer-pm/sdk/contracts": path.resolve(__dirname, "../packages/seer-pm-sdk/generated/contracts"),
      "@seer-pm/sdk/subgraph": path.resolve(__dirname, "../packages/seer-pm-sdk/generated/subgraph"),
      "@seer-pm/sdk/abis/eternal-farming": path.resolve(__dirname, "../packages/seer-pm-sdk/abis/EternalFarmingAbi.ts"),
      "@seer-pm/sdk": path.resolve(__dirname, "../packages/seer-pm-sdk/src/index.ts"),
      "@seer-pm/react": path.resolve(__dirname, "../packages/seer-pm-react/src/index.ts"),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
});
