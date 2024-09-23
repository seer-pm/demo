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
    │   ├── mocks: hardhat tests mocks
    │   └── token: Seer ERC20 token
    ├── test: hardhat & foundy tests
```

## Deployments

Refresh the list of deployed contracts by running `./scripts/generate-deployments-markdown.sh`.

### Gnosis

- [GnosisRouter](https://gnosisscan.io/address/0xe94d6564Ec3C4918CF4401Fd7AC444C5c4837389)
- [Market](https://gnosisscan.io/address/0x60Eb95536F44C696d115D943aB98C26CBfC110BF)
- [MarketFactory](https://gnosisscan.io/address/0x2Dbe07d6A22C8D7E397DF5a01888148857582467)
- [MarketView](https://gnosisscan.io/address/0x0427D45906C8E1c156d8e06C1FEfC4584B916d9f)
- [RealityProxy](https://gnosisscan.io/address/0xDEC7c093623E971Ace6b023A15548b85A1c4a210)

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


