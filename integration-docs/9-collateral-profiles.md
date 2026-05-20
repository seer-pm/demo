# Collateral profiles (multi-primary)

Seer supports **multiple collateral tokens per chain**. Each integration chooses which collateral its UI targets; the shared app backend indexes **all** registered collaterals.

Use **@seer-pm/sdk** as the source of truth for addresses, decimals, and per-profile options (e.g. xDAI only with sDAI on Gnosis).

---

## Concepts

| Concept | Meaning |
|---------|---------|
| **Collateral profile** | One **primary** ERC20 used by markets on that chain, plus optional **secondary** (e.g. xDAI for sDAI) and optional **swap** tokens (e.g. USDS/USDC for sUSDS on OP/Base). |
| **Registry** | Named profiles per chain in the SDK (`default`, `circles` on Gnosis, …). List with `getCollateralProfiles(chainId)`. |
| **Active profile** | The profile your **frontend build** uses for defaults. Optional `configureCollateral("circles")`; otherwise **`default`**. |
| **Market collateral** | Each market’s on-chain `collateralToken`. Pools and positions use this address; it must match a registered primary. |

**Important:** xDAI as **secondary** only applies to the **sDAI** profile on Gnosis. A site using **s-gCRC** has no xDAI secondary — users split/merge/redeem with s-gCRC only.

---

## SDK registry and helpers

```typescript
import {
  configureCollateral,
  getCollateralProfiles,
  getCollateralProfileByName,
  getDefaultCollateralProfile,
  getActiveCollateralProfile,
  getActivePrimaryCollateral,
  getAllPrimaryCollateralAddresses,
} from "@seer-pm/sdk";
```

### Gnosis (chain 100) — registered profiles

| Primary | Symbol | Decimals | Secondary |
|---------|--------|----------|-----------|
| `0xaf204776c7245bf4147c2612bf6e5972ee483701` | sDAI | 18 | xDAI / wxDAI (native) |
| `0xeef7b1f06b092625228c835dd5d5b14641d1e54a` | s-gCRC | 18 | none |

Other chains keep one profile each (sDAI on mainnet, sUSDS on Base/Optimism, etc.) — see `getCollateralProfiles` in the SDK.

### Configure active profile (frontend / site build only)

Optional. If omitted, the site uses the **`default`** profile (sDAI on Gnosis):

```typescript
import { configureCollateral } from "@seer-pm/sdk";

// s-gCRC-focused white-label site:
configureCollateral("circles");
```

`configureCollateral` throws if the name is unknown (e.g. `configureCollateral("bogus")`).

Call it once at app startup, before Seer UI or portfolio hooks. Sites that use **`default`** (e.g. app.seer.pm with sDAI on Gnosis) do not need to call it at all.

How you wire the profile name in your build (hardcoded, env var, etc.) is up to each frontend — the SDK only exposes `configureCollateral(name)`.

**Do not** call `configureCollateral` in the shared Netlify backend. One backend instance serves multiple frontends (app.seer.pm, white-label sites, etc.).

### Helpers (typical usage)

| Helper | When to use |
|--------|-------------|
| `getCollateralProfiles(chainId)` | List all registered profiles (default first). |
| `getCollateralProfileByName(chainId, name)` | Lookup by name (`"default"`, `"circles"`, …). |
| `getDefaultCollateralProfile(chainId)` | The `default` profile (API default when `collateralProfile` param omitted). |
| `getActiveCollateralProfile(chainId)` | Active site profile after `configureCollateral`. |
| `getActivePrimaryCollateral(chainId)` | Active primary `Token` (portfolio fetch, header balance). |
| `getAllPrimaryCollateralAddresses(chainId)` | All primaries on a chain (background jobs). |

---

## Per-market vs site collateral

- **Trading / pools:** Use the market’s `collateralToken` on-chain; for UI metadata use `getActivePrimaryCollateral(chainId)` / `getActiveCollateralProfile(chainId)` until per-market resolution is needed.
- **Site chrome** (header balance, portfolio totals, bridge destination): Use `getActiveCollateralProfile(chainId)`.
- **Conditional markets:** Collateral for the child is the parent’s **outcome token**, not a chain profile (unchanged — see [Conditional market](5-conditional-market.md)).

Example — collateral for a generic market on a s-gCRC-focused site:

```typescript
import { getActivePrimaryCollateral } from "@seer-pm/sdk";

const collateral = getActivePrimaryCollateral(market.chainId);
// use for approvals, split/merge, etc.
```

---

## HTTP API: `collateralProfile` query parameter

Portfolio and related endpoints accept an optional **`collateralProfile`** query param: the **registered profile name** (`default`, `circles`, …) to use for that request. The backend resolves it to the profile’s primary token via `getCollateralProfileByName`.

| Function | `collateralProfile` param |
|----------|---------------------------|
| `get-portfolio` | Yes — filters positions to markets with that profile’s primary `collateralToken`. |
| `get-portfolio-value` | Yes — same filter; 24h MTM in that denomination. |
| `get-portfolio-pl` | Yes — PnL, router legs, and swap cashflow for that primary only. |

If omitted, the API defaults to the **`default`** profile (sDAI on Gnosis).

The **@seer-pm/sdk** `fetchPortfolio*` functions send `collateralProfile` from `getActiveCollateralProfileName()` after `configureCollateral`.

Example:

```
GET /.netlify/functions/get-portfolio?account=0x...&chainId=100&collateralProfile=circles
```

---

## Split / merge on Gnosis (sDAI vs s-gCRC)

| Profile | Split with ERC20 | Split with native xDAI |
|---------|------------------|------------------------|
| sDAI | `splitPosition(sDAI, market, amount)` | `splitFromBase(market)` payable in xDAI (GnosisRouter) |
| s-gCRC | `splitPosition(s-gCRC, market, amount)` | not available |

Pass `collateralToken` explicitly to `getSplitExecution` / `getMergeExecution` / `getRedeemExecution` — use the market’s collateral or the profile primary, not a global default.

See [Split, merge and redeem](4-split-merge-and-redeem.md).

---

## White-label sites

1. Call `configureCollateral("circles")` (or another registered name) once at startup.
2. Filter market listings client-side: `market.collateralToken === getActivePrimaryCollateral(chainId).address` (or show all markets but only enable trade for matching collateral).
3. Portfolio hooks (`usePortfolioValue`, `usePortfolioPnL`) already pass the active profile name to the API when using current `@seer-pm/react`.

The shared backend continues to index DEX prices, transfers, and liquidity for **all** registered primaries regardless of which frontend calls the API.
