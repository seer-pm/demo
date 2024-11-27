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
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: [".."],
    },
  },
  ssr: {
    noExternal: ["react-easy-crop"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
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
