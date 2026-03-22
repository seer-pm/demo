import fs from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { join, parse, resolve } from "node:path";
import { type Config, type ContractConfig, defineConfig } from "@wagmi/cli";
import { actions, react } from "@wagmi/cli/plugins";
import { base, gnosis, mainnet, optimism, sepolia } from "viem/chains";

const CHAIN_DIR_NAMES: Record<number, string> = {
  [mainnet.id]: "ethereum",
  [gnosis.id]: "gnosis",
  [optimism.id]: "optimism",
  [base.id]: "base",
  [sepolia.id]: "sepolia",
};

const CHAINS = [mainnet, gnosis, optimism, base, sepolia];

const getDeploymentsPath = (): string => {
  const envPath = process.env.CONTRACTS_DEPLOYMENTS_PATH;
  if (envPath) return resolve(envPath);
  return resolve(process.cwd(), "../../contracts/deployments");
};

const readArtifacts = async (chains: typeof CHAINS): Promise<ContractConfig[]> => {
  const deploymentsPath = getDeploymentsPath();
  const results: Record<string, ContractConfig> = {};

  for (const chain of chains) {
    const chainName = CHAIN_DIR_NAMES[chain.id];
    if (!chainName) continue;
    const directoryPath = join(deploymentsPath, chainName);

    if (!fs.existsSync(directoryPath)) continue;

    const files = await readdir(directoryPath);

    for (const file of files) {
      const { name, ext } = parse(file);
      if (ext === ".json") {
        const filePath = join(directoryPath, file);
        const fileContent = await readFile(filePath, "utf-8");
        const jsonContent = JSON.parse(fileContent);

        const addresses = (results[name]?.address as Record<number, `0x${string}`>) || {};
        addresses[chain.id] = jsonContent.address as `0x${string}`;

        results[name] = {
          name,
          address: addresses,
          abi: jsonContent.abi,
        };
      }
    }
  }

  return Object.values(results);
};

const getConfig = async (): Promise<Config[]> => {
  const allContracts = await readArtifacts(CHAINS);

  const contractsMapping: Record<string, string[]> = {
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
    out: `generated/contracts/${key}.ts`,
    contracts: allContracts.filter((contract) => contractNames.includes(contract.name)),
    plugins: [react(), actions()],
  }));
};

export default defineConfig(getConfig);
