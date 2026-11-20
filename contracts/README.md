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
| MarketView | [0x010Bc82218C4857CBF5639B0046E0E05a678D8D4](https://gnosisscan.io/address/0x010Bc82218C4857CBF5639B0046E0E05a678D8D4) |
| OpportunityCredits | [0xD2002562012BF42dEc477313CD1bcE1C24e780F6](https://gnosisscan.io/address/0xD2002562012BF42dEc477313CD1bcE1C24e780F6) |
| QuestionsFactory | [0x42cE29eA4C658577295561f8e0d03314d7d845c9](https://gnosisscan.io/address/0x42cE29eA4C658577295561f8e0d03314d7d845c9) |
| RealityProxy | [0xc260ADfAC11f97c001dC143d2a4F45b98e0f2D6C](https://gnosisscan.io/address/0xc260ADfAC11f97c001dC143d2a4F45b98e0f2D6C) |
| Wrapped1155Factory | [0xD194319D1804C1051DD21Ba1Dc931cA72410B79f](https://gnosisscan.io/address/0xD194319D1804C1051DD21Ba1Dc931cA72410B79f) |

### Ethereum

| Contract | Address |
|----------|---------|
| ConditionalRouter | [0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5) |
| LimitOrderHook | [0xE10A429d18E90fbD44be3678d2AE1ef3c1691040](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040) |
| MainnetRouter | [0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6) |
| Market | [0x8bdC504dC3A05310059c1c67E0A2667309D27B93](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93) |
| MarketFactory | [0x1F728c2fD6a3008935c1446a965a313E657b7904](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904) |
| MarketView | [0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA](https://etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA) |
| QuestionsFactory | [0x9D2166667f497B57d1cE356ed4C6E244b511f7c2](https://etherscan.io/address/0x9D2166667f497B57d1cE356ed4C6E244b511f7c2) |
| Realitio_v2_1_ArbitratorWithAppeals | [0x2018038203aEE8e7a29dABd73771b0355D4F85ad](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad) |
| RealityProxy | [0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E](https://etherscan.io/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E) |
| RewardCampaigns | [0xa6E4286C32E68679181bEacAA8384894550C6f06](https://etherscan.io/address/0xa6E4286C32E68679181bEacAA8384894550C6f06) |
| UniversalRewardsDistributor | [0x64d89bb0e7BdB71f81E9bdA770036a9139B284AB](https://etherscan.io/address/0x64d89bb0e7BdB71f81E9bdA770036a9139B284AB) |
| Wrapped1155Factory | [0xD194319D1804C1051DD21Ba1Dc931cA72410B79f](https://etherscan.io/address/0xD194319D1804C1051DD21Ba1Dc931cA72410B79f) |

### Optimism

| Contract | Address |
|----------|---------|
| ConditionalRouter | [0x3124e97ebF4c9592A17d40E54623953Ff3c77a73](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73) |
| LimitOrderHook | [0x1f78E79C20d1E77526aC21E3651FABFc22035040](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040) |
| Market | [0xAb797C4C6022A401c31543E316D3cd04c67a87fC](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC) |
| MarketFactory | [0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6) |
| MarketView | [0xDd193f64dbe184891f0beb3510AD69b5DC849BD1](https://optimistic.etherscan.io/address/0xDd193f64dbe184891f0beb3510AD69b5DC849BD1) |
| QuestionsFactory | [0xa6E4286C32E68679181bEacAA8384894550C6f06](https://optimistic.etherscan.io/address/0xa6E4286C32E68679181bEacAA8384894550C6f06) |
| RealityProxy | [0xfE8bF5140F00de6F75BAFa3Ca0f4ebf2084A46B2](https://optimistic.etherscan.io/address/0xfE8bF5140F00de6F75BAFa3Ca0f4ebf2084A46B2) |
| RewardCampaigns | [0xf7E64845A8737466CAD5687fFD718eF242E6e9aF](https://optimistic.etherscan.io/address/0xf7E64845A8737466CAD5687fFD718eF242E6e9aF) |
| Router | [0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD) |
| UniversalRewardsDistributor | [0x880e41A11451a2DC6783997E94dab75D66eBbCfB](https://optimistic.etherscan.io/address/0x880e41A11451a2DC6783997E94dab75D66eBbCfB) |
| Wrapped1155Factory | [0xd194319d1804c1051dd21ba1dc931ca72410b79f](https://optimistic.etherscan.io/address/0xd194319d1804c1051dd21ba1dc931ca72410b79f) |

### Base

| Contract | Address |
|----------|---------|
| ConditionalRouter | [0xF5ccbf74121edBa492725F325D55356D517723B9](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9) |
| LimitOrderHook | [0x19E8B37E9f4d69927Da1e13e989a2f955ee39040](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040) |
| Market | [0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E) |
| MarketFactory | [0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6) |
| MarketView | [0xDd193f64dbe184891f0beb3510AD69b5DC849BD1](https://basescan.org/address/0xDd193f64dbe184891f0beb3510AD69b5DC849BD1) |
| QuestionsFactory | [0xa6E4286C32E68679181bEacAA8384894550C6f06](https://basescan.org/address/0xa6E4286C32E68679181bEacAA8384894550C6f06) |
| RealityProxy | [0xfE8bF5140F00de6F75BAFa3Ca0f4ebf2084A46B2](https://basescan.org/address/0xfE8bF5140F00de6F75BAFa3Ca0f4ebf2084A46B2) |
| RewardCampaigns | [0x7563C95e6837D3256162eCAa7B5984681515eAa3](https://basescan.org/address/0x7563C95e6837D3256162eCAa7B5984681515eAa3) |
| Router | [0x3124e97ebF4c9592A17d40E54623953Ff3c77a73](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73) |
| UniversalRewardsDistributor | [0x34d7c267f4c2Faf52E0eB514A314C99aE3ACeE37](https://basescan.org/address/0x34d7c267f4c2Faf52E0eB514A314C99aE3ACeE37) |
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
# Build the bot's current ABI and run the tests (from contracts/).
yarn test
# Run only the campaign suite, with the same ABI build.
yarn test test/hardhat/RewardCampaigns.test.ts
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

**Rewards distributor**

The weekly V4 liquidity rewards (`packages/seer-pm-rewards`) are paid by a Morpho [Universal Rewards Distributor](https://docs.morpho.org/developers/contracts/rewards/) ([source](https://github.com/morpho-org/universal-rewards-distributor/tree/v1.0.0)), created through Morpho's `UrdFactory` on Ethereum, Optimism and Base ([factory addresses](https://docs.morpho.org/developers/contracts/addresses/)). It needs no verification: the factory deploys the bytecode Morpho already verified.
```
URD_OWNER=<safe> URD_ROOT_UPDATER=<bot wallet> yarn hardhat deploy --network optimism --tags RewardsDistributor --no-compile
```
`URD_OWNER` is required and `URD_TIMELOCK` defaults to 172800 (48 h). With `URD_ROOT_UPDATER`, the deployer creates the distributor as its own owner, enables the updater and then calls `setOwner(URD_OWNER)`, so the owner sends nothing. `setOwner` has no acceptance step: check `URD_OWNER` before running. A run that stops halfway finishes on the next one. Then copy the printed address and block into `PAYOUT_CHAINS` in `packages/seer-pm-rewards/src/chains.ts`.

**Reward campaigns registry**

Each chain with Seer V4 pools has a `RewardCampaigns` registry next to its distributor. It holds the campaigns of that chain's pools, which pay out on the same chain in its own (bridged) reward token, and escrows their budgets: a manager creates a campaign without a deposit and it earns from that block, any manager later funds it with `fund`, once and at any time (also after it ended), which deposits its whole budget and makes that manager its funder, every week, once the distributor accepts the root that proves what it emitted, the rewards bot releases that to the distributor, and once it ends, what it cannot have emitted goes back to the funder at once, and what it may have emitted since the last weekly release comes back after that week is released, minus what it did emit. A budget never grows, so more rewards for a pool are a new campaign on it. Deploy the distributor first.
```
REWARD_CAMPAIGNS_OWNER=<safe> REWARD_CAMPAIGNS_MANAGERS=<wallet>,<wallet> yarn hardhat deploy --network optimism --tags RewardCampaigns
```
Without `REWARD_CAMPAIGNS_OWNER` the deploy skips the registry, and so does a network with no distributor. `release` takes a proof against the distributor's accepted root, so anyone may call it and the bot needs no role on the registry: its wallet is only the distributor's `URD_ROOT_UPDATER`, whose roots wait out the timelock. The owner appoints and removes managers with `setManager`; managers create and fund campaigns from `/admin/rewards`. Only a campaign's funder changes its rate: its creator until it is funded, while it is still a manager, and afterwards the manager that funded it, also once removed. The owner cannot change a campaign. `fund` takes the hash of the rate history the funder read, so a rate change before the deposit is mined reverts it. Copy the printed address and block into `PAYOUT_CHAINS[<chain>].registry` in `packages/seer-pm-rewards/src/chains.ts`.

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

