# Uniswap V4 Subgraph

### Running Unit Tests

1. Install [Docker](https://docs.docker.com/get-docker/) if you don't have it already
2. Install postgres: `brew install postgresql`
3. `yarn run build:docker`
4. `yarn run test`

### Adding New Chains

1. Create a new subgraph config in `src/utils/chains.ts`. This will require adding a new `<NETWORK_NAME>_NETWORK_NAME` const for the corresponding network.
2. Add a new entry in `networks.json` for the new chain. The network name should be derived from the CLI Name in The Graph's [supported networks documenation](https://thegraph.com/docs/en/developing/supported-networks/). The factory address can be derived from Uniswap's deployments documentation (not yet available).
3. To deploy to Alchemy, run the following command:

```
yarn run deploy:alchemy --
  <SUBGRAPH_NAME>
  --version-label <VERSION_LABEL>
  --deploy-key <DEPLOYMENT_KEY>
  --network <NETWORK_NAME>
```

## Generating subgraph.yaml

The `subgraph.yaml` file can be automatically generated from the `networks.json` configuration for a specific network. This ensures that all contract addresses and start blocks are correctly synchronized.

To generate the subgraph.yaml:

1. Make sure your `networks.json` is up to date with the correct contract addresses and start blocks
2. Run:
   ```bash
   yarn generate-subgraph <network>
   ```
   For example:
   ```bash
   yarn generate-subgraph mainnet
   # or
   yarn generate-subgraph arbitrum-one
   ```

This will create a new `subgraph.yaml` file based on the network-specific configuration. The script will:

- Use the contract templates defined for each contract type (PoolManager, PositionManager, etc.)
- Generate data sources for each contract in the specified network
- Preserve all the necessary event handlers and ABI configurations

Available networks can be found in `networks.json`.

## Seer deployment (seer-v4-pools)

Fork of [Uniswap/v4-subgraph](https://github.com/Uniswap/v4-subgraph) at upstream commit
`0c13ab2` (fix(robinhood): set ETH/USDG v4 pool for USD pricing, #87). It lives in this repo
but outside the Yarn workspace: it keeps its own `yarn.lock` and `node_modules` on Yarn 1
(`packageManager` in `package.json`, picked up by corepack), so run every command from this
directory. `subgraph.yaml` is generated per network and not committed.

```
cd v4-subgraph
yarn install --frozen-lockfile
yarn generate-subgraph base && yarn codegen && yarn build
```

This fork indexes only Uniswap V4 pools that contain a Seer outcome token, plus the
PositionManager positions opened in those pools:

- `MarketFactory` data source registers every Seer market (`SeerMarket`) and its wrapped
  outcome tokens (`OutcomeToken`, read from `Market.wrappedOutcome(i)`, Invalid included).
- `handleInitialize` skips pools whose currencies are not `OutcomeToken`s
  (`requireSeerOutcomeToken` in `src/utils/chains.ts`).
- `handleModifyLiquidity` upserts a `Position` (pool, ticks, liquidity, owner via
  `PositionManager.ownerOf`) when the sender is the PositionManager; `handleTransfer`
  only updates owners of known positions and marks burns.

Networks: `base`, `optimism`, `mainnet` (`networks.json`, start blocks = LimitOrderHook deploy).

```
goldsky login                      # Seer project
yarn deploy-goldsky-base           # seer-v4-pools-base/1.0.0
yarn deploy-goldsky-optimism
yarn deploy-goldsky-mainnet
```
