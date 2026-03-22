# Generic prompt: Seer prediction market website (for Google Stitch)

Use this prompt when asking Stitch (or an AI design tool) to generate a Seer prediction market website. It has two parts:

1. **Seer data model and UI requirements** (fixed) – Same for every Seer site. Stitch must use this to know what data exists and how to build the UI.
2. **Site identity and scope** (customize) – You fill this in per project: what the site is about and what look & feel you want.

---

## Part 1: Seer data model and UI requirements (do not change)

All Seer prediction market sites use the same data structures. Stitch should base the UI on these fields and behaviors.

**Responsive design:** Produce designs for **desktop** and **mobile**. Every screen (homepage, market detail, etc.) must have both a desktop and a mobile layout so the site works well on large and small viewports.

### Market fields

Every market object has at least:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique Seer market identifier (address or id). |
| `chainId` | number | EVM chain id (e.g. `100` for Gnosis Chain). |
| `marketName` | string | Human-readable title/question of the market. |
| `type` | string | One of: `"Scalar"`, `"Multi Scalar"`, `"Categorical"`, `"Multi Categorical"`. |
| `outcomes` | string[] | Per-outcome labels (same length as `wrappedTokens`). |
| `wrappedTokens` | Address[] | Seer outcome token contract addresses, one per outcome. |
| `liquidityUSD` | number \| null | Current liquidity in USD. |
| `url` | string? | Optional slug for `app.seer.pm` (fallback to `id` if missing). |
| `verification.status` | string? | One of: `"verified"` \| `"verifying"` \| `"challenged"` \| `"not_verified"`. |
| `status` (derived) | string | From `getMarketStatus(market)`: e.g. `OPEN`, `CLOSED`, `RESOLVED`. |
| `parentMarket` | Address | Parent market address (zero address = root/non-conditional). |
| `parentOutcome` | number | Index of the parent outcome this market is conditional on, if any. |

**Derived for UI:**

- **`seerMarketPath`**: `https://app.seer.pm/markets/${market.chainId}/${market.url || market.id}`.
- **`typeText`**: Display text for market type via `MARKET_TYPES_TEXTS[getMarketType(market)]`.
- **`statusText`**: Display text for status via `STATUS_TEXTS[getMarketStatus(market)](hasLiquidity)`.

### Outcome-level fields

For each outcome index `i`:

| Field | Description |
|-------|-------------|
| `outcomeIndex` | Index `i` (zero-based). |
| `name` | `market.outcomes[i]` or fallback `"Outcome ${i + 1}"`; for generic markets use `#${i + 1}` prefix. |
| `wrappedTokenAddress` | `market.wrappedTokens[i]`. |
| `symbol` | Token symbol from metadata, or fallback to `name`. |
| `balance` | User’s outcome token balance (formatted: 0 → "0", tiny → "<0.0001", &lt;1 → 4 decimals, else localized max 2 decimals). |
| `odds` | Current odds/probability as percentage (e.g. `"65.3%"`). |
| `imageUrl` | Optional URL from host app/CMS via `images[i]`. |
| `tokenExplorerUrl` | `getTokenExplorerUrl(market.chainId, wrappedTokenAddress)`. |
| `poolExplorerUrl` | Link to the outcome’s liquidity pool in the DEX/explorer (if pool exists). |
| `createPoolUrl` | Link to create/add liquidity for that outcome (if no pool). |

### Core screens

**Header (all pages)**

- Every page must have a **header** with a **Connect wallet** button in the **top-right**. When the user is not connected it shows "Connect wallet" (or similar); when connected it can show a shortened address or a "Disconnect" control. The rest of the header is for logo, site name, and navigation as needed.

**Homepage (markets list)**

- Per market card: `id`, `chainId`, `marketName`; short outcome preview (first 2–3 names); `statusText`; `typeText`; `liquidityUSD` (formatted, fallback `"0.00"` / `"<0.01"`); optional verification badge from `verification.status`.
- Click → navigate to **Market detail page**.

**Market detail page**

- **Header:** `marketName`, `id`, `typeText`, `statusText`, `chainId`, `liquidityUSD`, `verification.status` (Verified | Verifying | Challenged | Not verified | Not available), and "View on Seer" → `seerMarketPath`.
- **Outcomes:** Rows with optional `imageUrl` (or avatar from first letter), outcome `name`, user balance, odds, links: Contract → `tokenExplorerUrl`, Pool → `poolExplorerUrl` or Create pool → `createPoolUrl`.
- **Trading widget** (swap/trade panel). Stitch should design it as follows — the implementation will wire it to Seer via `@seer-pm/react`; the UI must include:
  - **Two stacked rows**, each with a label, an amount, and a dropdown:
    - **Top row – "Sell"**: Left: numeric **input** (user types amount to sell). Right: **dropdown** to choose what to sell (collateral token, e.g. stablecoin, or one of the market’s outcome tokens). Show "Balance: X" for the selected token. Below the input, optional **percentage buttons** (e.g. 25%, 50%, 75%, 100%) to set amount from balance.
    - **Center:** A **swap / invert button** (e.g. vertical swap icon) that flips the direction: what was "Sell" becomes "Buy" and vice versa, so the user can either buy outcome tokens with collateral or sell outcome tokens for collateral.
    - **Bottom row – "Buy"**: Left: **read-only amount** (quote: how much the user will receive; show "…" or loading while fetching quote). Right: **dropdown** to choose what to receive (outcome token or collateral). Show "Balance: X" for the selected token.
  - **Dropdown options:** For this market, the options are: the market’s outcome tokens (one per outcome, with name/symbol) and the collateral token (e.g. stablecoin). Top and bottom dropdowns are independent; the swap button only swaps the two rows’ roles.
  - **Optional alerts** (above or below the two rows): "This outcome has no liquidity" (when the selected outcome has no pool); "Insufficient balance" when the user’s balance is below the required amount; and a short quote error message (e.g. "Not enough liquidity. Try a smaller amount.") when the quote fails.
  - **Summary line:** e.g. "Avg Price" and "Slippage Tolerance" (e.g. 0.5%) — values come from the quote.
  - **Primary action button:** One of: "Change network" (when the user is on the wrong chain); "Approve" (when the collateral token needs approval before trading); or "Place Trade" (and "Executing…" while the transaction is pending). Single main button; state depends on wallet and quote.
  - **Flow:** User selects pay/receive via dropdowns (or uses the invert button), enters amount in the sell input, sees the receive amount update (quote). Then Approve if needed, then Place Trade. Loading and errors should be shown in the button label or via toasts/notifications.

**Redeem (winning positions)**

- Show **Redeem** only when: market is closed/resolved and user has at least one winning position.
- Content: title "Redeem", short copy, primary action "Redeem on Seer" opening redeem flow at `seerMarketPath`.
- Conditional markets: redeeming child returns parent outcome tokens; user may need to redeem parent next to get base collateral.

---

## Part 2: Site identity and scope (customize for each project)

**Replace this section** with your project’s specifics before sending the prompt to Stitch.

- **Site name and goal:** What this prediction market site is for (e.g. “Sports outcomes”, “DAO governance”).
- **Aesthetic and identity:** Look and feel (e.g. dark/futuristic, light/minimal, brand colors, “AI agent” theme).
- **Extra requirements (optional):** Any specific pages, copy, or behaviors beyond the core screens above.

### Placeholder example (replace with your own)

```markdown
- **Name:** [Your site name]
- **Goal:** [One sentence: what this prediction market site is for]
- **Aesthetic:** [e.g. Modern dark theme, futuristic; or: Light, minimal, editorial]
- **Extra:** [Any specific features, copy, or links]
```

