import "hardhat-deploy";
import { HardhatUserConfig } from "hardhat/config";

//npx hardhat node --fork https://gnosis-pokt.nodies.app --port 8546 --no-deploy --config gnosisforked.config.ts
const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      chainId: 31339,
    },
  },
};

export default config;
