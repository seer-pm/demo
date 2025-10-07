import fs from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { join, parse } from "node:path";
import { type Config, type ContractConfig, defineConfig, loadEnv } from "@wagmi/cli";
import { actions, react } from "@wagmi/cli/plugins";
import { Chain, gnosis, mainnet, optimism, sepolia } from "wagmi/chains";
import { FAST_TESTNET_FACTORY } from "./src/lib/constants";

const readArtifacts = async (chains: Chain[]) => {
  const results: Record<string, ContractConfig> = {};

  for (const chain of chains) {
    const chainName = chain.id === optimism.id ? "optimism" : chain.name.toLocaleLowerCase();
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
        addresses[chain.id] = jsonContent.address as `0x{string}`;

        if (process.env.VITE_IS_FAST_TESTNET === "1" && name === "MarketFactory" && chain.id === gnosis.id) {
          addresses[chain.id] = FAST_TESTNET_FACTORY;
        }

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

const getConfig = async (): Promise<Config[]> => {
  import.meta.env = loadEnv({
    mode: process.env.NODE_ENV,
    envDir: process.cwd(),
  });

  const { SUPPORTED_CHAINS } = await import("./src/lib/chains");

  const chains = Object.values(SUPPORTED_CHAINS);
  if (!chains.some((chain) => chain.id === sepolia.id)) {
    chains.push(sepolia);
  }
  if (process.env.VITE_IS_FAST_TESTNET === "1") {
    chains.push(mainnet);
  }

  const allContracts = Object.values(await readArtifacts(chains));

  const contractsMapping = {
    curate: ["LightGeneralizedTCR"],
    reality: ["Reality"],
    arbitrators: [
      "RealitioForeignArbitrationProxyWithAppeals",
      "RealitioForeignProxyOptimism",
      "RealitioForeignProxyBase",
      "Realitio_v2_1_ArbitratorWithAppeals",
    ],
    "market-factory": ["MarketFactory", "Market", "FutarchyFactory"],
    "market-view": ["MarketView"],
    router: ["Router", "MainnetRouter", "GnosisRouter", "ConditionalRouter", "FutarchyRouter"],
    "multi-drop": ["MultiDrop", "GovernedRecipient"],
    "trading-credits": ["SeerCredits", "CreditsManager"],
  };

  return Object.entries(contractsMapping).map(([key, contractNames]) => ({
    out: `src/hooks/contracts/generated-${key}.ts`,
    contracts: allContracts.filter((contract) => contractNames.includes(contract.name)),
    plugins: [react(), actions()],
  }));
};

export default defineConfig(getConfig);
