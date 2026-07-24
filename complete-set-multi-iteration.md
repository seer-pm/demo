# Complete-set routes: 2-iteration optimization (future work)

Planning doc for a v2 extension of complete-set routing. **Not implemented yet** — use this as the starting point when we pick it up.

## Context (v1 today)

v1 compares only **two single-step routes**:

| User intent | Alternative route |
|-------------|-------------------|
| Buy outcome | **mint + sell** (one split, sell opposite once) |
| Sell outcome | **buy + merge** (buy opposite once, merge once) |

Winner must beat direct swap by **≥ 0.5%** (`MIN_COMPLETE_SET_SAVINGS_PERCENT`).

### Limitation observed in the wild

For **exact-in buy** with **110 sDAI**, a user manually sketched a better path than both v1 options:

1. **Direct buy:** ~147 UP for 110 sDAI  
2. **Single mint+sell:** 110 UP (split 110, sell all DOWN for ~40 sDAI, net cost ~70 sDAI)  
3. **Manual multi-step:** mint 110 → sell DOWN → mint 10 → sell DOWN → buy UP with leftover sDAI → **~171 UP** for 110 sDAI net spend  

v1 correctly picks **direct** (147 > 110) but misses the **multi-step composite** because it never reuses recovered collateral for another mint+sell or a follow-up buy.

Full optimal routing (unbounded iterations) is hard: state space, AMM curvature, slippage, gas, batching. **Proposal: cap at 2 iterations** as a practical v2.

---

## Proposal: 2-iteration complete-set buy path

Extend the **buy / exact-in** (and possibly **buy / exact-out**) case with a bounded search:

### Iteration model

Each **iteration** is one of:

- **mint+sell leg:** split `X` collateral → `X` target + `X` opposite (+ Invalid); sell all opposite for collateral proceeds  
- **direct buy leg:** spend `Y` collateral on AMM for target outcome  

**Budget:** user’s input collateral (exact-in) or target output constraint (exact-out).

**Max iterations:** **2** composite legs total (e.g. mint+sell → mint+sell, mint+sell → buy, buy → mint+sell — exact templates TBD).

After iteration 1, **leftover collateral** (from sell proceeds minus what was consumed in leg 2) stays in the simulated wallet for leg 2.

### Example (110 sDAI, buy UP)

| Step | Action | Result (rough) |
|------|--------|----------------|
| 1 | mint+sell: split 110, sell DOWN | 110 UP, ~40 sDAI recovered |
| 2a | mint+sell: split 10, sell DOWN | +10 UP, ~3 sDAI recovered |
| 2b | direct buy: spend ~33 sDAI on UP | +51 UP |
| **Total** | | **~171 UP** for 110 sDAI wallet spend |

v2 would **quote** a small set of 2-leg templates (not exhaustive search), pick the best vs direct and vs single mint+sell, still subject to **≥ 0.5%** threshold.

### Sell side (buy+merge)

Mirror idea for **sell**: e.g. buy+merge then another leg with recovered collateral or a second merge cycle. Lower priority; validate buy-side first.

---

## Why 2 iterations (not N)

| | 1 (v1) | 2 (proposed v2) | Unbounded |
|--|--------|-----------------|-----------|
| UX / gas | Simple, 7702 batch friendly | Still batchable (~4–6 calls) | Many txs, hard to explain |
| Implementation | Done | Fixed templates, small search | Optimizer / graph search |
| Coverage | Misses recycle paths | Captures reported manual wins | Theoretical max |

Two iterations match the manual example (mint+sell → mint+sell → buy counts as **2 composite legs** if “buy” is leg 2, or mint+sell × 2 plus a third “buy” — **needs disambiguation**, see open questions).

---

## Suggested algorithm (sketch)

For **buy, exact-in**, amount `B`:

1. Quote **direct** (baseline).  
2. Quote **single mint+sell** (v1 alternative).  
3. For each **2-leg template** in a fixed list:
   - Simulate leg 1 (AMM quote at current pool state).  
   - Update virtual balances: target tokens, remaining collateral.  
   - Simulate leg 2 from remaining collateral (and optionally cap split size).  
   - Compute total target out and effective net collateral in.  
4. Compare best composite vs direct using same metric as v1 (exact-in → max tokens out).  
5. Apply **0.5%** minimum savings; return winning route + **execution plan** (ordered calls for 7702 batch).

**Templates to evaluate (initial set):**

- `mintSell → mintSell`  
- `mintSell → directBuy`  
- `directBuy → mintSell` (less common; include if cheap to quote)

Do **not** nested search over continuous split sizes in v2 first pass — use heuristics (e.g. leg1 = full budget split; leg2 = all recovered collateral, or grid of 2–3 split sizes for leg 1).

---

## Execution & UI impact

- **SDK:** new quote module (e.g. `complete-set-quote-v2.ts` or extend `complete-set-quote.ts`) returning a **leg list** (not only one `completeSetLeg`).  
- **Trade builder:** chain split / swap / merge calls in order; approvals for all touched tokens.  
- **7702:** prefer single batch; legacy path = more txs (already an issue for v1 buy+merge).  
- **Confirmation modal:** show 2-step breakdown (reuse `SwapTokensConfirmation` patterns).  
- **Threshold:** keep `MIN_COMPLETE_SET_SAVINGS_PERCENT = 0.5`.

---

## Out of scope for this doc / v2 pass

- Fill-to-estimate (target price across both pools)  
- PSM3 + complete-set  
- Complete-set composite routes  
- Unbounded iteration / LP optimization  
- Gas cost in route comparison (v1 also ignores gas)

---

## Open questions (resolve before implementation)

1. **Leg counting:** Is “mint+sell → buy” **2 iterations** or **3 actions**? Recommend: **2 legs** where leg = {mint+sell} or {directBuy}, max 2 legs.  
2. **Exact-out buy:** Same 2-leg search with metric “min net collateral for target out”?  
3. **Invalid balance:** Multi mint+sell only needs collateral; no Invalid required (unlike buy+merge).  
4. **Pool state between legs:** Quotes assume sequential execution at quote-time prices; slippage per leg.  
5. **Split sizing:** Fixed “all in leg 1” vs optimize leg-1 split size with one binary search?  
6. **Sell path:** Ship buy-side 2-iteration first; defer sell-side templates.

---

## Acceptance criteria (when we implement)

- [ ] For the known **110 sDAI / UP** scenario, quoted 2-leg path ≥ manual estimate (~171 UP) within slippage tolerance, beats direct (~147) by ≥ 0.5%.  
- [ ] v1 behavior unchanged when 2-leg path does not beat threshold.  
- [ ] Unit tests for template simulation (mock quotes).  
- [ ] Integration test or script against forked Gnosis market.  
- [ ] Confirmation UI shows both legs clearly.  
- [ ] 7702 batch executes atomically for full 2-leg buy path.

---

## References in codebase

- v1 quote/compare: `packages/seer-pm-sdk/src/complete-set-quote.ts`  
- v1 execution: `packages/seer-pm-sdk/src/complete-set-trade.ts`  
- React wiring: `packages/seer-pm-react/src/hooks/useQuoteTrade.ts`  
- UI: `web/src/components/Market/SwapTokens/SwapTokensConfirmation.tsx`  
- Tests: `web/src/lib/complete-set.test.ts`

---

## One-line summary

**Extend complete-set buy routing from a single mint+sell to at most 2 composite legs (e.g. mint+sell then buy, or mint+sell twice), reusing recovered collateral, still requiring ≥ 0.5% improvement over direct swap.**
