# @seer-pm/ui-kit

Electric Foundation tokens, brand assets and the UI that every Seer site shares: the landing at
seer.pm, the Seer app, Deep, Futarchy, Opportunity Markets and Risk Pricing.

What belongs here is what defines the brand or what at least two sites render. Anything only one
site needs stays in that site.

## Contents

| Import | What it gives you |
| --- | --- |
| `@seer-pm/ui-kit/tokens.css` | Colour, radius, font and motion custom properties, light and dark |
| `@seer-pm/ui-kit/base.css` | Opt-in document defaults: page colours, font, selection, caret, scrollbar, focus ring |
| `@seer-pm/ui-kit/fonts.css` | Self-hosted Open Sans (variable weight) |
| `@seer-pm/ui-kit/components.css` | Buttons, fields, the dialog, the brand lockup, icons and the ecosystem footer |
| `@seer-pm/ui-kit/tailwind.css` | Tailwind 4 `@theme` bindings |
| `@seer-pm/ui-kit/tailwind` | Tailwind 3 preset |
| `@seer-pm/ui-kit` | `seerApps`, footer and social links, `convergencePaths()` |
| `@seer-pm/ui-kit/react` | `BrandLockup`, `BrandStreak`, `Dialog`, `EcosystemFooter`, `ThemeToggle` |
| `@seer-pm/ui-kit/assets/*` | Wordmark (SVG), bird (WebP), app logo (PNG), footer icons (SVG) |

## Usage

Astro, Vite or any bundler that resolves CSS imports from packages:

```css
@import "@seer-pm/ui-kit/fonts.css";
@import "@seer-pm/ui-kit/tokens.css";
@import "@seer-pm/ui-kit/base.css";
@import "@seer-pm/ui-kit/components.css";
```

Next.js with Tailwind 4:

```css
@import "tailwindcss";
@import "@seer-pm/ui-kit/tokens.css";
@import "@seer-pm/ui-kit/tailwind.css";
```

Then `bg-seer-page text-seer-text rounded-surface` and the rest follow the active theme.

Tailwind 3:

```js
module.exports = { presets: [require("@seer-pm/ui-kit/tailwind")] };
```

React:

```tsx
import { EcosystemFooter } from "@seer-pm/ui-kit/react";

<EcosystemFooter homeUrl="/" groups={[{ title: "App", links: [{ name: "Markets", url: "/" }] }]} />;
```

Without React, render the same markup and classes (see `src/react/EcosystemFooter.tsx`) and read
the links from `seerApps`, `seerFooterGroups` and `seerSocialLinks`.

## Theming

Light is the default. Dark applies under `[data-theme="dark"]` (the Seer app) or `.dark`
(next-themes in class mode), on `<html>` or on any element, so one section can take the other
theme. The brand values (`--seer-brand-*`, `--seer-on-ink*`) are the same in both themes.

| Token | Role |
| --- | --- |
| `--seer-page`, `--seer-surface`, `--seer-surface-raised` | Page ground, cards, nested surfaces |
| `--seer-text`, `--seer-muted` | Primary and secondary text |
| `--seer-border` | Hairlines and outlines |
| `--seer-accent-soft`, `--seer-accent-text` | Secondary button, selected states, links on page |
| `--seer-positive`, `--seer-negative`, `--seer-warning` | Gains and losses, errors, pending states; 4.5:1 as text on every ground |
| `--seer-brand-purple`, `--seer-brand-purple-hover` | Primary action and brand fields |
| `--seer-brand-ink`, `--seer-on-ink`, `--seer-on-ink-muted`, `--seer-ink-border` | Ink fields and what sits on them |
| `--seer-brand-lavender`, `--seer-brand-purple-on-ink` | Display type and motifs on ink, from the brand posters |
| `--seer-radius-sm`, `--seer-radius-md`, `--seer-radius-full` | Controls and badges, surfaces and rows, pills |

Status fills and outlines come from the status colours at fixed strengths rather than from tokens
of their own: 10% for a fill and 40% for its border (`bg-seer-negative/10 border-seer-negative/40`
in Tailwind 4, `color-mix(in oklab, var(--seer-negative) 10%, transparent)` in plain CSS). In the
light theme a status colour as text on its own fill holds 4.5:1 only when the fill sits on
`--seer-surface`; over the page or a raised surface it drops to about 4.2:1. There, set the fill's
text in `--seer-text` and keep the status colour for its icon and border.

## Components

The kit owns how these look; state and behaviour stay in each site.

**Buttons.** `.seer-button` plus one variant: `-primary`, `-secondary`, `-outline` (a standalone
alternative) or `-ghost` (inside toolbars, rows and dialog headers). Sizes `-sm` (32px) and `-lg`
(48px) around the 40px default, `-block` for full width, `-icon` for a square icon-only control
(give it an `aria-label`). `disabled` or `aria-disabled="true"` dims it; `aria-busy="true"` adds a
spinner and keeps the label.

**Fields.**

```html
<label class="seer-field">
  <span class="seer-label">Amount</span>
  <span class="seer-input-group">
    <input class="seer-input" inputmode="decimal" placeholder="0.00" />
    <span class="seer-input-affix">sDAI</span>
    <button class="seer-button seer-button-ghost seer-button-sm" type="button">Max</button>
  </span>
  <span class="seer-hint">Available 2,400.00 sDAI</span>
</label>
```

`.seer-input` also styles `<textarea>` and `<select>` on its own. `aria-invalid="true"` turns the
border to `--seer-negative`; pair it with a `.seer-error` line that names the problem.

**Dialog.** `.seer-dialog` on a native `<dialog>` opened with `showModal()`, with
`.seer-dialog-panel` wrapping `-header` (a `-heading` with `-title` and an optional
`-description`, then a ghost icon button with `.seer-icon-close`), an optional `-body` and an
optional `-footer`. `.seer-dialog-wide` is 640px. On screens up to 640px it becomes a bottom sheet.
In React, `Dialog` keeps the element in step with `open` and points `aria-describedby` at the
description:

```tsx
<Dialog open={open} onClose={() => setOpen(false)} title="Confirm swap" dismissible={!pending}
  description="Prices can move before the transaction confirms."
  footer={<button className="seer-button seer-button-primary">Confirm swap</button>}>
  …
</Dialog>
```

**Theme toggle.** `ThemeToggle theme={theme} onToggle={toggle}` is a ghost icon button whose icon
(`.seer-icon-sun`, `.seer-icon-moon`) and label name the theme a click switches to. The site keeps
the choice, follows the system until there is one, and applies it before first paint.

**Lockup.** `BrandLockup appName="Futarchy"` (or a `.seer-brand-app` span after the wordmark) sets
an application's name after the Seer wordmark. `EcosystemFooter` takes the same `appName`.

**Footer width.** The footer's content is 1480px wide with a `clamp(16px, 4vw, 32px)` gutter. A
site with another content column sets `--seer-footer-max-width` and `--seer-footer-gutter` on
`.seer-footer` so the edges line up.

## Deliberate departures from the brand kit

- Open Sans replaces PP Neue Montreal and Suisse Intl Mono on every site, so the landing and the
  apps read as one system.
- The line motif converges toward the right, as the second round of the rebrand brief requires.
  `convergencePaths()` has no option to mirror it.

## Publishing

`yarn workspace @seer-pm/ui-kit build`, then `npm publish` from this directory. CSS and assets ship
as source, so the same `exports` resolve inside the monorepo and from npm.
