import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/v4.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  outDir: "dist",
  external: [/@seer-pm\/sdk/, /@seer-pm\/contracts-ts/, /[/\\]tick-math(?:\.ts)?$/],
});
