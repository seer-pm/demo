import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

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
      },
    ],
  },
  paths: {
    sources: "./src",
  },
};

export default config;
