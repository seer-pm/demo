import dotenv from "dotenv";
dotenv.config()

import { type Config, type ContractConfig, defineConfig } from "@wagmi/cli";
import { react, actions } from "@wagmi/cli/plugins";
import { readdir, readFile } from "fs/promises";
import { parse, join } from "path";
import { SUPPORTED_CHAINS } from "./src/lib/chains";

const readArtifacts = async () => {
  const results: Record<string, ContractConfig> = {};

  for(let chainId in SUPPORTED_CHAINS) {
    const chainName = SUPPORTED_CHAINS[chainId].name.toLocaleLowerCase();
    const directoryPath = `../contracts/deployments/${chainName}`;
    const files = await readdir(directoryPath);
  
    for (const file of files) {
      const { name, ext } = parse(file);
      if (ext === ".json") {
        const filePath = join(directoryPath, file);
        const fileContent = await readFile(filePath, "utf-8");
        const jsonContent = JSON.parse(fileContent);

        const addresses = (results[name]?.address as Record<number, `0x${string}`>) || {}
        addresses[chainId] = jsonContent.address as `0x{string}`
        results[name] = {
          name,
          address: addresses,
          abi: jsonContent.abi,
        };
      }
    }
  }

  return results;
};

const getConfig = async (): Promise<Config> => {
  return {
    out: "src/hooks/contracts/generated.ts",
    contracts: Object.values(await readArtifacts()),
    plugins: [react(), actions()],
  };
};

export default defineConfig(getConfig);