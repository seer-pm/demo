# @seer-pm/contracts

Smart contracts for Seer

## Files

```
└── contracts
    ├── deploy: hardhat-deploy scripts
    ├── deployments: hardhat-deploy json files
    ├── scripts: utilities
    ├── src
    │   ├── interaction: third party smart contracts used by Seer
    │   └── token: Seer ERC20 token
    ├── test: hardhat & foundy tests
```

## Deployments

Refresh the list of deployed contracts by running `./scripts/generate-deployments-addresses.sh`.

### Gnosis

| Contract | Address |
|----------|---------|
| ConditionalRouter | [0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c) |
| FutarchyFactory | [0xe789e4A240d153AC55e32106821e785E71f6b792](https://gnosisscan.io/address/0xe789e4A240d153AC55e32106821e785E71f6b792) |
| FutarchyProposal | [0xec4fb999Db0e8cA28011D85EAD177810055b484c](https://gnosisscan.io/address/0xec4fb999Db0e8cA28011D85EAD177810055b484c) |
| FutarchyRealityProxy | [0x03E1fCfE3F1edc5833001588fb6377cB50A61cfc](https://gnosisscan.io/address/0x03E1fCfE3F1edc5833001588fb6377cB50A61cfc) |
| FutarchyRouter | [0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E) |
| GnosisRouter | [0xeC9048b59b3467415b1a38F63416407eA0c70fB8](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8) |
| Market | [0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a) |
| MarketFactory | [0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1) |
| MarketView | [0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C) |
| RealityProxy | [0xc260ADfAC11f97c001dC143d2a4F45b98e0f2D6C](https://gnosisscan.io/address/0xc260ADfAC11f97c001dC143d2a4F45b98e0f2D6C) |
| Wrapped1155Factory | [0xD194319D1804C1051DD21Ba1Dc931cA72410B79f](https://gnosisscan.io/address/0xD194319D1804C1051DD21Ba1Dc931cA72410B79f) |

### Ethereum

| Contract | Address |
|----------|---------|
| ConditionalRouter | [0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5) |
| MainnetRouter | [0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6) |
| Market | [0x8bdC504dC3A05310059c1c67E0A2667309D27B93](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93) |
| MarketFactory | [0x1F728c2fD6a3008935c1446a965a313E657b7904](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904) |
| MarketView | [0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a) |
| Realitio_v2_1_ArbitratorWithAppeals | [0x2018038203aEE8e7a29dABd73771b0355D4F85ad](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad) |
| RealityProxy | [0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E](https://etherscan.io/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E) |
| Wrapped1155Factory | [0xD194319D1804C1051DD21Ba1Dc931cA72410B79f](https://etherscan.io/address/0xD194319D1804C1051DD21Ba1Dc931cA72410B79f) |

### Optimism

| Contract | Address |
|----------|---------|
| ConditionalRouter | [0x3124e97ebF4c9592A17d40E54623953Ff3c77a73](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73) |
| Market | [0xAb797C4C6022A401c31543E316D3cd04c67a87fC](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC) |
| MarketFactory | [0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6) |
| MarketView | [0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00) |
| RealityProxy | [0xfE8bF5140F00de6F75BAFa3Ca0f4ebf2084A46B2](https://optimistic.etherscan.io/address/0xfE8bF5140F00de6F75BAFa3Ca0f4ebf2084A46B2) |
| Router | [0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD) |
| Wrapped1155Factory | [0xd194319d1804c1051dd21ba1dc931ca72410b79f](https://optimistic.etherscan.io/address/0xd194319d1804c1051dd21ba1dc931ca72410b79f) |

### Base

| Contract | Address |
|----------|---------|
| ConditionalRouter | [0xF5ccbf74121edBa492725F325D55356D517723B9](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9) |
| Market | [0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E) |
| MarketFactory | [0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6) |
| MarketView | [0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD) |
| RealityProxy | [0xfE8bF5140F00de6F75BAFa3Ca0f4ebf2084A46B2](https://basescan.org/address/0xfE8bF5140F00de6F75BAFa3Ca0f4ebf2084A46B2) |
| Router | [0x3124e97ebF4c9592A17d40E54623953Ff3c77a73](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73) |
| Wrapped1155Factory | [0xd194319d1804c1051dd21ba1dc931ca72410b79f](https://basescan.org/address/0xd194319d1804c1051dd21ba1dc931ca72410b79f) |

## Installation

### Prerequisites
Install Node.js and Yarn
```bash
# installs nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
# download and install Node.js (you may need to restart the terminal)
nvm install 20
# install yarn
npm install --global yarn
```

Clone the repo, then cd to contracts folder:
```
cd .\contracts\
```

### Install packages
```
yarn
```

### Foundry
```bash
curl -L https://foundry.paradigm.xyz | bash
# restart your terminal, then run:
foundryup
# install forge-std
forge install foundry-rs/forge-std
```
>If you’re using Windows, you’ll need to install and use [Git BASH](https://gitforwindows.org/) or [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) as your terminal, since Foundryup currently doesn’t support Powershell or Command Prompt (Cmd).

## Compile
```
yarn hardhat compile
```
>Please ignore the warnings. They are coming from third-party/mock contracts.

## Testing
**Foundry (bash)**
```bash
# compile the contracts
forge build
# run test
forge test
# run coverage
forge coverage
```

**Hardhat**
```bash
# run test
yarn hardhat test
# run coverage
yarn hardhat coverage
```

## Deploy
**Local**
```
yarn hh-local-deploy
```

**Gnosis**
```
yarn hardhat deploy --network gnosis
```

**Verify contracts on Gnosis**
1. Get an api key from [Gnosis Scan](https://docs.gnosisscan.io/getting-started/viewing-api-usage-statistics)
2. Add `GNOSISSCAN_API_KEY` to `.env` file
3. Run
    ```
    yarn verify:gnosis
    ```


