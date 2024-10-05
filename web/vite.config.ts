import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import viteTsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteTsconfigPaths({
      root: "..",
      projects: [path.resolve(__dirname, "tsconfig.json")],
    }),
    checker({ typescript: true }),
  ],
  resolve: {
    alias: {
      "node-fetch": "isomorphic-fetch",
      jsbi: path.resolve(__dirname, "./../node_modules/jsbi/dist/jsbi-cjs.js"),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
});
