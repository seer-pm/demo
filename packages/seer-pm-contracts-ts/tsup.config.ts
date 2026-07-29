import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["generated/contracts/*.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  outDir: "dist",
});
