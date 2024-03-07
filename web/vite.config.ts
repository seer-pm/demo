import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import viteTsconfigPaths from "vite-tsconfig-paths";
import checker from "vite-plugin-checker";
import path from "path";

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
      'node-fetch': 'isomorphic-fetch',
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
});
