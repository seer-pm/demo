import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Minimal Vite config for React Cosmos: the main vite.config.ts pulls in vike, which is a
// full app framework and does not run under Cosmos. This keeps only the plugins and module
// aliases that fixtures need.
export default defineConfig({
  plugins: [react()],
  define: {
    global: "window",
    "process.env": "{}",
  },
  server: {
    fs: {
      allow: [".."],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "node-fetch": "isomorphic-fetch",
      jsbi: path.resolve(__dirname, "./../node_modules/jsbi/dist/jsbi-cjs.js"),
      "@seer-pm/sdk/contracts": path.resolve(__dirname, "../packages/seer-pm-sdk/generated/contracts"),
      "@seer-pm/sdk/subgraph": path.resolve(__dirname, "../packages/seer-pm-sdk/generated/subgraph"),
      "@seer-pm/sdk/abis/eternal-farming": path.resolve(__dirname, "../packages/seer-pm-sdk/abis/EternalFarmingAbi.ts"),
      "@seer-pm/sdk/sign-in": path.resolve(__dirname, "../packages/seer-pm-sdk/src/sign-in.ts"),
      "@seer-pm/sdk": path.resolve(__dirname, "../packages/seer-pm-sdk/src/index.ts"),
      "@seer-pm/react": path.resolve(__dirname, "../packages/seer-pm-react/src/index.ts"),
      "@seer-pm/discussions": path.resolve(__dirname, "../packages/seer-pm-discussions/src/index.ts"),
    },
  },
});
