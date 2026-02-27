# @seer-pm/sdk

SDK for the [Seer](https://seer.pm) prediction market protocol. Use it to create markets, resolve, split/merge/redeem positions, and trade outcome tokens from your app.

## Install

```bash
npm install @seer-pm/sdk
# or
yarn add @seer-pm/sdk
# or
pnpm add @seer-pm/sdk
```

## Usage

```ts
import { SDK_VERSION } from "@seer-pm/sdk";
```

See the [integration docs](https://github.com/seer-pm/demo/tree/main/integration-docs) for full flows (create market, resolve, trading, API).

## Publishing (maintainers)

From the monorepo root:

```bash
yarn workspace @seer-pm/sdk build
npm publish -w @seer-pm/sdk
```

Only the `packages/seer-sdk` package is published to npm; the rest of the repository is not included in the published tarball.

## License

MIT
