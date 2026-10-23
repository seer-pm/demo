import { defineConfig } from "tsup";

export default defineConfig({
  // Two entries so a site without React (the Astro landing) never pulls in the React bindings.
  entry: { index: "src/index.ts", "react/index": "src/react/index.ts" },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["react", "react/jsx-runtime"],
});
