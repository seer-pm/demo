import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/distributor.ts", "src/claims.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  outDir: "dist",
});
