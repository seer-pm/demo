import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS } from "hardhat/builtin-tasks/task-names";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "./tasks/verify-deployments";
const glob = require("glob");
const path = require("path");

dotenv.config();

subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS).setAction(async (_, hre, runSuper) => {
  const paths = await runSuper();

  const otherDirectoryGlob = path.join(hre.config.paths.root, "test", "hardhat", "mocks", "**", "*.sol");
  const otherPaths = glob.sync(otherDirectoryGlob);

  return [...paths, ...otherPaths];
});

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.4.18",
      },
      {
        version: "0.5.12",
      },
      {
        version: "0.7.6",
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
      {
        version: "0.8.28",
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 31337,
      // forking: {
      //   url: "https://rpc.gnosischain.com",
      // },
      mining: {
        auto: false,
        interval: 100,
      },
      saveDeployments: true,
      allowUnlimitedContractSize: true,
      // gas: "auto",
    },
    localhost: {
      chainId: 31337,
      forking: {
        url: process.env.GNOSIS_RPC || "https://rpc.gnosischain.com",
      },
      mining: {
        auto: false,
        interval: 100,
      },
      saveDeployments: true,
    },
    ethereum: {
      chainId: 1,
      url: "https://mainnet.gateway.tenderly.co",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      saveDeployments: true,
    },
    gnosis: {
      chainId: 100,
      url: process.env.GNOSIS_RPC || "https://rpc.gnosischain.com",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      saveDeployments: true,
      // Gnosisscan (by Etherscan) was deprecated; gnosisscan.io is now served by Blockscout, whose
      // Etherscan-compatible API needs no key. gnosis.blockscout.com redirects here with a 301,
      // which breaks the verification POST, so use gnosisscan.io directly.
      // Verified with hardhat-deploy's `etherscan-verify` task (see `yarn verify:gnosis`).
      verify: {
        etherscan: {
          apiKey: "blockscout",
          apiUrl: "https://gnosisscan.io",
        },
      },
    },
    optimism: {
      chainId: 10,
      url: process.env.OPTIMISM_RPC || "https://optimism-mainnet.public.blastapi.io",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      saveDeployments: true,
    },
    base: {
      chainId: 8453,
      url: process.env.BASE_RPC || "https://base.llamarpc.com",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      saveDeployments: true,
    },
    sepolia: {
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      saveDeployments: true,
    },
  },
  // Etherscan API v2: a single etherscan.io key works for every Etherscan-run explorer
  // (Ethereum, Optimism, Base, Sepolia). Used by the `verify-deployments` task.
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY ?? "",
  },
  sourcify: {
    enabled: false,
  },
  paths: {
    sources: "./src",
  },
  mocha: {
    timeout: 100000000,
  },
  gasReporter: {
    // enabled: true,
  },
};

export default config;
