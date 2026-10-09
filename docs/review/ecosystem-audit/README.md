# Seer ecosystem UI audit

Reviewed 9 October 2026. Scope: public entry pages of https://seer.pm/, https://deep.seer.pm/, https://opportunity.seer.pm/ and https://futarchy.fi/. This is a first-pass audit, not a certification of every route or wallet flow. No production sites were modified.

## Method and limits

Impeccable 4.5.2 installed in the local Codex skills directory, with its version-pinned engine 0.1.14. Applied the audit checklist to browser screenshots, rendered DOM and viewport measurements. Ran the deterministic detector against downloaded public HTML and same-origin linked CSS. Deep and Opportunity render much of their UI in JavaScript, so a quiet static scan is not evidence they are issue-free. Browser inspection supplements it.

Desktop captures: 1280px wide. Mobile captures: 390px wide using browser viewport emulation, not a physical phone. No wallet connection, trades or form submissions. Keyboard traversal, full contrast sampling, reduced-motion behavior, alternate themes, performance profiling, source bundles and transaction states remain untested. No defensible aggregate /20 score is available from this limited scope.

## Implementation integrity verdict

Needs work at the ecosystem level: the four entry points do not yet communicate a shared Seer system. Each has useful product-specific content to retain. A common foundation should unify identity, navigation, typography, spacing and accessibility while allowing each product's task layout to differ. Futarchy's existing identity should remain intact until its rebranding scope is agreed.

| Dimension | Result | Evidence / remaining work |
| --- | --- | --- |
| Accessibility | Verified issues | Seer has no h1-h6 headings, an unnamed dismiss button, and 8px mobile navigation/body text. Full WCAG review outstanding. |
| Performance | Not scored | No controlled performance trace or source bundle analysis. |
| Theming | Partial inspection | Visible identities differ. Token implementation and alternate themes need source access. |
| Responsive | Verified issues | Futarchy hero overlaps its CTA and page scroll width is 435px at a 390px viewport. Deep mobile title is clipped. |
| Implementation integrity | Partial inspection | Browser evidence shows task hierarchy problems; detector warnings require context, not blind acceptance. |

## Priorities

Seven grouped findings: P0: 0 confirmed; P1: 3; P2: 4; P3: 0. Separate measured implementation defects from UX judgments below.

### P1: Seer mobile type is too small

Location: seer.pm, navigation and feature descriptions. Measured computed font size of 8px on Documentation and the Create Unique Markets description at 390px. This makes routine reading and navigation difficult. Use responsive reflow with readable body type and generous touch targets instead of scaling the desktop composition down. Small type alone is not a specific WCAG failure; test resize and reflow separately. Suggested command: `impeccable adapt`.

### P1: Seer heading structure and dismiss label are missing

Location: seer.pm, page headings and announcement close button. DOM contains no h1-h6 elements; one icon-only button lacks visible text, aria-label and title. Screen-reader users lose heading navigation and a named control. Add one meaningful h1, ordered section headings and an accessible dismiss name. Relevant criteria: WCAG 1.3.1 and 4.1.2. Suggested command: `impeccable harden`.

### P1: Futarchy mobile hero overlaps and overflows

Location: futarchy.fi, first viewport. At 390px, the hero copy overlaps Learn How and document width reaches 435px. The large heading also starts behind the top navigation in the captured state. Repair header offset, text wrapping, hero sizing and CTA flow. Verify WCAG 1.4.10 at 320 CSS px after repair. Screenshot: futarchy-mobile.png. Suggested command: `impeccable adapt`.

### P2: Futarchy hero readability varies with its background

Location: futarchy.fi, desktop hero. Dark headline/body text sits across a bright-to-dark blurred field; parts become difficult to read. Visual finding, not a measured WCAG contrast verdict. Give text a stable contrasting surface and measure the worst background state; retain the distinct identity. Suggested command: `impeccable harden`.

### P2: Deep discovery is pushed below setup

Location: deep.seer.pm, first viewport. The three-step wallet setup occupies most of mobile's upper screen; the header title clips to “AI Predi”. The populated desktop chart initially displays a very large number of series. Browsing a useful opportunity takes too much scanning. Keep market browsing available before wallet setup, shorten the setup panel, and default the chart to a small selected comparison with an explicit all-series option. This is a UX recommendation, not proof the wallet is required to browse. Suggested commands: `impeccable distill`, `impeccable adapt`.

### P2: Opportunity takes too long to reach its markets

Location: opportunity.seer.pm, hero. A long premise, explanatory paragraph and five-step diagram precede the market entry point. On mobile the first market CTA sits at the bottom of the first screen; actual market cards are further down. Put a concise purpose and active opportunities earlier, with process detail available below. Retain the sponsor's final-decision explanation. Suggested commands: `impeccable layout`, `impeccable clarify`.

### P2: Seer homepage does not guide visitors to the specialised frontends

Location: seer.pm, main navigation and page content. The inspected entry page sends visitors mainly to the general app and documentation; Deep, Opportunity and Futarchy are not presented as clear paths. Add an ecosystem section based on visitor intent, explaining each product in one sentence and linking directly to it. Avoid making visitors learn the protocol's implementation details before choosing a task. Suggested command: `impeccable shape`.

## Detector interpretation

The static scan flags small text/leading and contrast candidates on Seer, plus contrast/decorative-background candidates on Futarchy. Tiny mobile text is independently confirmed in the browser. Other contrast hits need measured rendered foreground/background pairs before being called violations.

Reject generic “AI colour palette” warnings as a reason to remove Seer's purple: #7D33FF, #141223, white, the official bird/wordmark and supplied line motifs are explicit user choices. A decorative-grid warning is advisory, not a functional defect. Do not infer that any site was AI-generated from these heuristics. Raw detector output is retained in detector.json; reported counts are grouped verified findings, not the detector's raw hit total.

## Keep

- Seer: direct app/documentation links and real market-type examples.
- Deep: explicit network/collateral guidance, searchable series and original/dependency market definitions.
- Opportunity: a concrete live pilot, readable mobile stacking and an explanation of who makes the final decision.
- Futarchy: a distinctive identity, clear app entry and an explanation of conditional markets.

## Implementation and handover

Start with seer.pm as the ecosystem entry point, then Deep, Opportunity and Futarchy. Fix the verified mobile/semantic defects before decorative refinements. Follow with `impeccable harden`, `impeccable adapt`, targeted `impeccable layout` / `impeccable clarify`, and finally `impeccable polish`. Re-audit after fixes.

The current checkout is the Seer app repository. Source repositories and ownership for these four deployed surfaces still need to be identified before modifying their implementations. Keep each site's implementation changes in its own repository/branch, with a shared brand specification and a current/proposed preview per site. Do not place four replacement apps inside the existing Seer trading app just to host demos.

Retain Joseph's approved colours, Open Sans for Seer UI, official bird and wordmark, full-scale subtle motifs, short handover bullets and inspectable Git changes. The audit does not change existing app behaviour or financial logic.
