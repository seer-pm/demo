---
target: header
total_score: 20
max_score: 36
na_heuristics: 9
p0_count: 2
p1_count: 2
timestamp: 2026-10-12T11-48-14Z
slug: web-src-components-layout-header-tsx
---
# Critique: global header (Header.tsx + MarketsFilter in header)

Method: dual-agent (A: design review · B: detector). Browser inspection skipped: no browser automation tool exposed. Detector: 0 findings on Header.tsx, MarketsFilter.tsx, MarketCategoryNav.tsx, BrandLockup.tsx.

## Heuristics (0-4)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | Active filters shown only as a red dot; no count, no chips |
| 2 | Match real world | 2 | "App" label, PersonAdd icon for account menu |
| 3 | User control | 3 | Search state lost from view when leaving home |
| 4 | Consistency | 1 | Two headers: search appears/disappears, Create Market changes slot and component |
| 5 | Error prevention | 3 | Two filled purple CTAs (Create + Connect) for disconnected users |
| 6 | Recognition over recall | 2 | No search off home; Portfolio duplicated in nav and account menu |
| 7 | Flexibility | 2 | No global search / shortcut; Sort buried in Filter panel |
| 8 | Minimalist | 2 | ~13 targets in one row on home at 1280-1500 |
| 9 | Error recovery | n/a | No error states in the header beyond the network switch |
| 10 | Help | 2 | "?" dropdown without accessible name |
Total: 20/36 (heuristic 9 n/a).

## Priority issues
- [P0] Header layout depends on route (isHome): search, nav and Create Market all change slot. Fix: one header, same JSX on every route; search global; drop the .seer-discovery-header order/margin hacks.
- [P0] Filter lives in the global header but acts on one list. Fix: move Filter (+ Sort) into the home toolbar row next to the category chips; anchor the panel absolute to that row and delete the fixed top:125/200/250px values (they only hold while the beta banner is visible).
- [P1] On home at 1280-1500px `.seer-account-nav > .dropdown { display:none }` hides the balance/Deposit/Account menu for connected users. Fix: never hide account functions per breakpoint; collapse nav into More first.
- [P1] Create Market: two implementations (LinkButton.seer-create-button vs .seer-global-create with hard-coded #7d33ff) and at 1200-1279px on non-home it renders next to the logo because the nav is hidden at <=1279 but the pill only at <=1199. Fix: one component, one slot before the wallet cluster, soft-accent style, same breakpoint as the desktop cluster.
- [P2] Mobile home header stacks ~3 rows of sticky chrome (~200px). Fix: one row (logo, search icon, theme, menu); search opens a sheet; Filter/Sort in page toolbar.

## Persona red flags
- Alex: no search off home; Sort hidden; Deposit menu hidden on home at laptop widths; filter state only a red dot.
- Jordan: two purple CTAs; App/Policies at top level; unlabeled "?"; header changes shape after first navigation.

## Minor
- AccountDisplay is a clickable div without role/keyboard handler.
- Nav at 12px/400 reads as tertiary next to 13px controls.
- Theme toggle duplicated (mobile actions + mobile menu).
- useNavRenderer is not a hook but carries the use prefix.
- Policies could move to footer or More.

## Questions
- Does Create Market belong in the global header at all in Operate mode?
- Should the home grid still filter live as you type once search is global?
- Why is there no prediction-market signal (balance figure, positions count) in the header?
