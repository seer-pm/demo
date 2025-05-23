import "hardhat-deploy";
import { HardhatUserConfig } from "hardhat/config";

//pnpm exec hardhat node --fork https://eth-pokt.nodies.app --no-deploy --config mainnetforked.config.ts
const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      chainId: 31338,
    },
  },
};

export default config;
