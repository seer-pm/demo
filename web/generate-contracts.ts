import dotenv from "dotenv";
dotenv.config()

import { type ContractConfig } from "@wagmi/cli";
import { readdir, readFile } from "fs/promises";
import { parse, join } from "path";
import { writeFileSync } from "fs";
import { Chain } from "wagmi/chains";
import { SUPPORTED_CHAINS } from "./src/lib/chains";

const readArtifacts = async (chain: Chain) => {
  const chainName = chain.name.toLocaleLowerCase();
  const directoryPath = `../contracts/deployments/${chainName === "hardhat" ? "localhost" : chainName}`;
  const files = await readdir(directoryPath);

  const results: ContractConfig[] = [];
  for (const file of files) {
    const { name, ext } = parse(file);
    if (ext === ".json") {
      const filePath = join(directoryPath, file);
      const fileContent = await readFile(filePath, "utf-8");
      const jsonContent = JSON.parse(fileContent);
      results.push({
        name,
        address: jsonContent.address as `0x{string}`,
        abi: jsonContent.abi,
      });
    }
  }
  return results;
};

function saveAddresses(abis, addresses) {
  const addressesCode = `import { Address } from "viem";

  type AddressMap = Record<number, Address>;
  
  export type AddressConfigValues = {
  ${Object.keys(abis)
    .map((contract) => `	${contract}: AddressMap;`)
    .join("\n")}
  };
  
  export const ADDRESSES_CONFIG: AddressConfigValues = ${JSON.stringify(addresses, null, "\t")}`;

  writeFileSync("./src/lib/addresses.ts", addressesCode);
}

function saveAbis(abis) {
  for (const abi in abis) {
    const abiCode = `export const ${abi}Abi = ${JSON.stringify(abis[abi], null, "\t")} as const;`;
    writeFileSync(`./src/abi/${abi}Abi.ts`, abiCode);
  }
}

(async () => {
  const abis = {};
  const addresses = {};
  for (let chainId in SUPPORTED_CHAINS) {
    const deploymentContracts = await readArtifacts(SUPPORTED_CHAINS[chainId]);
    for (let contract in deploymentContracts) {
      if (!abis[deploymentContracts[contract].name]) {
        abis[deploymentContracts[contract].name] =
          deploymentContracts[contract].abi;
        addresses[deploymentContracts[contract].name] = {};
      }
      addresses[deploymentContracts[contract].name][chainId] =
        deploymentContracts[contract].address;
    }
  }

  saveAbis(abis);

  saveAddresses(abis, addresses);
})();
