import fs from "fs";
import { join, parse } from "path";
import { type Config, type ContractConfig, defineConfig, loadEnv } from "@wagmi/cli";
import { actions, react } from "@wagmi/cli/plugins";
import { readFile, readdir } from "fs/promises";
import { Chain, mainnet } from "wagmi/chains";

const readArtifacts = async (SUPPORTED_CHAINS: Record<string, Chain>) => {
  const results: Record<string, ContractConfig> = {};

  for (const chainId in SUPPORTED_CHAINS) {
    const chainName = SUPPORTED_CHAINS[chainId].name.toLocaleLowerCase();
    const directoryPath = `../contracts/deployments/${chainName}`;

    if (chainName === "hardhat" && !fs.existsSync(directoryPath)) {
      throw new Error("Hardhat deployment not found");
    }

    const files = await readdir(directoryPath);

    for (const file of files) {
      const { name, ext } = parse(file);
      if (ext === ".json") {
        const filePath = join(directoryPath, file);
        const fileContent = await readFile(filePath, "utf-8");
        const jsonContent = JSON.parse(fileContent);

        const addresses = (results[name]?.address as Record<number, `0x${string}`>) || {};
        addresses[chainId] = jsonContent.address as `0x{string}`;
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
  import.meta.env = loadEnv({
    mode: process.env.NODE_ENV,
    envDir: process.cwd(),
  });

  const { SUPPORTED_CHAINS } = await import("./src/lib/chains");

  if (!SUPPORTED_CHAINS[mainnet.id]) {
    // we need it to have access to the RealitioForeignArbitrationProxy
    SUPPORTED_CHAINS[mainnet.id] = mainnet;
  }

  return {
    out: "src/hooks/contracts/generated.ts",
    contracts: Object.values(await readArtifacts(SUPPORTED_CHAINS)),
    plugins: [react(), actions()],
  };
};

export default defineConfig(getConfig);
