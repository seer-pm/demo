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
| CirclesMarketFactory | [0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E) |
| ConditionalRouter | [0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c) |
| FutarchyFactory | [0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345) |
| FutarchyProposal | [0xec4fb999Db0e8cA28011D85EAD177810055b484c](https://gnosisscan.io/address/0xec4fb999Db0e8cA28011D85EAD177810055b484c) |
| FutarchyRealityProxy | [0x03E1fCfE3F1edc5833001588fb6377cB50A61cfc](https://gnosisscan.io/address/0x03E1fCfE3F1edc5833001588fb6377cB50A61cfc) |
| FutarchyRouter | [0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E) |
| GnosisRouter | [0xeC9048b59b3467415b1a38F63416407eA0c70fB8](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8) |
| Market | [0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a) |
| MarketFactory | [0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1) |
| MarketView | [0xdC4c9B3B49ad229B14879Ab22D10F607437c930f](https://gnosisscan.io/address/0xdC4c9B3B49ad229B14879Ab22D10F607437c930f) |
| OpportunityCredits | [0xD2002562012BF42dEc477313CD1bcE1C24e780F6](https://gnosisscan.io/address/0xD2002562012BF42dEc477313CD1bcE1C24e780F6) |
| RealityProxy | [0xc260ADfAC11f97c001dC143d2a4F45b98e0f2D6C](https://gnosisscan.io/address/0xc260ADfAC11f97c001dC143d2a4F45b98e0f2D6C) |
| Wrapped1155Factory | [0xD194319D1804C1051DD21Ba1Dc931cA72410B79f](https://gnosisscan.io/address/0xD194319D1804C1051DD21Ba1Dc931cA72410B79f) |

### Ethereum

| Contract | Address |
|----------|---------|
| ConditionalRouter | [0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5) |
| MainnetRouter | [0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6) |
| Market | [0x8bdC504dC3A05310059c1c67E0A2667309D27B93](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93) |
| MarketFactory | [0x1F728c2fD6a3008935c1446a965a313E657b7904](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904) |
| MarketView | [0x25A3E57E3070EA5b43e14F7796Fa13806BC9DA05](https://etherscan.io/address/0x25A3E57E3070EA5b43e14F7796Fa13806BC9DA05) |
| Realitio_v2_1_ArbitratorWithAppeals | [0x2018038203aEE8e7a29dABd73771b0355D4F85ad](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad) |
| RealityProxy | [0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E](https://etherscan.io/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E) |
| Wrapped1155Factory | [0xD194319D1804C1051DD21Ba1Dc931cA72410B79f](https://etherscan.io/address/0xD194319D1804C1051DD21Ba1Dc931cA72410B79f) |

### Optimism

| Contract | Address |
|----------|---------|
| ConditionalRouter | [0x3124e97ebF4c9592A17d40E54623953Ff3c77a73](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73) |
| Market | [0xAb797C4C6022A401c31543E316D3cd04c67a87fC](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC) |
| MarketFactory | [0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6) |
| MarketView | [0x14662A441C72cBE609155A02A5B433FC0D4C1443](https://optimistic.etherscan.io/address/0x14662A441C72cBE609155A02A5B433FC0D4C1443) |
| RealityProxy | [0xfE8bF5140F00de6F75BAFa3Ca0f4ebf2084A46B2](https://optimistic.etherscan.io/address/0xfE8bF5140F00de6F75BAFa3Ca0f4ebf2084A46B2) |
| Router | [0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD) |
| Wrapped1155Factory | [0xd194319d1804c1051dd21ba1dc931ca72410b79f](https://optimistic.etherscan.io/address/0xd194319d1804c1051dd21ba1dc931ca72410b79f) |

### Base

| Contract | Address |
|----------|---------|
| ConditionalRouter | [0xF5ccbf74121edBa492725F325D55356D517723B9](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9) |
| Market | [0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E) |
| MarketFactory | [0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6) |
| MarketView | [0x14662A441C72cBE609155A02A5B433FC0D4C1443](https://basescan.org/address/0x14662A441C72cBE609155A02A5B433FC0D4C1443) |
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

**Verify contracts**

Run the verification right after deploying:

Gnosis contracts are verified on [Blockscout](https://gnosisscan.io) (the old Gnosisscan by Etherscan was deprecated; gnosisscan.io is now a Blockscout instance). No API key is needed:
```
yarn verify:gnosis
# optional: also submit the sources to Sourcify
yarn sourcify:gnosis
```

Ethereum, Optimism, Base and Sepolia are verified through the Etherscan API v2, which uses a single [etherscan.io](https://etherscan.io/apidashboard) key for every chain:
1. Add `ETHERSCAN_API_KEY` to the `.env` file
2. Run the script for the network, e.g.
    ```
    yarn verify:ethereum
    yarn verify:optimism
    yarn verify:base
    yarn verify:sepolia
    ```
   To verify a single deployment: `npx hardhat --network base verify-deployments --contract MarketView`

   `verify-deployments` compares the deployed bytecode with the current local artifacts, so run it right after deploying. Deployments whose source changed since they were deployed will report a bytecode mismatch (they are normally already verified). External contracts saved in `deployments/` without compiler metadata are skipped.


