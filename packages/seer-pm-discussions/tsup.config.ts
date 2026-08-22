import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "tsup";

const external = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "viem",
  "wagmi",
];

function injectCssImport(file: string, statement: string) {
  const content = readFileSync(file, "utf8");
  if (content.includes("index.css")) return;
  writeFileSync(file, `${statement}\n${content}`);
}

export default defineConfig({
  entry: ["src/index.ts", "src/tooltip.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external,
  esbuildOptions(options) {
    options.loader = {
      ...options.loader,
      ".css": "css",
    };
  },
  async onSuccess() {
    injectCssImport("dist/index.mjs", 'import "./index.css";');
    injectCssImport("dist/index.js", 'require("./index.css");');
  },
});
