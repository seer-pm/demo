import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "hardhat-deploy";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.5.12",
      },
      {
        version: "0.6.12",
      },
      {
        version: "0.8.9",
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: "https://rpc.gnosischain.com",
      },
      mining: {
        auto: false,
        interval: 100,
      },
      saveDeployments: true,
    },
    localhost: {
      chainId: 31337,
      forking: {
        url: "https://rpc.gnosischain.com",
      },
      mining: {
        auto: false,
        interval: 100,
      },
      saveDeployments: true,
    },
    mainnet: {
      chainId: 1,
      url: "https://eth.llamarpc.com",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      saveDeployments: true,
    },
    gnosis: {
      chainId: 100,
      url: "https://rpc.gnosischain.com",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      saveDeployments: true,
      verify: {
        etherscan: {
          apiKey: process.env.GNOSISSCAN_API_KEY!,
        },
      },
    },
    goerli: {
      chainId: 5,
      url: process.env.GOERLI_RPC || "https://rpc.ankr.com/eth_goerli",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      saveDeployments: true,
      verify: {
        etherscan: {
          apiKey: process.env.ETHERSCAN_API_KEY!,
        }
      },
    },
    sepolia: {
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC || "https://rpc2.sepolia.org",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      saveDeployments: true,
      verify: {
        etherscan: {
          apiKey: process.env.ETHERSCAN_API_KEY!,
        }
      },
    },
  },
  paths: {
    sources: "./src",
  },
};

export default config;
