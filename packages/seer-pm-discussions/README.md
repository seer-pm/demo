# @seer-pm/discussions

TypeScript discussion UI for Seer markets.

## Usage

```tsx
import {
  Discussion,
  createDiscussionsClient,
  userFromAddress,
  type DiscussionUserPositionBadgeProps,
  type DiscussionButtonProps,
} from "@seer-pm/discussions";

const client = createDiscussionsClient({
  marketId,
  getAccessToken: () => accessToken,
});

function DiscussionButton({
  children,
  variant = "primary",
  isLoading,
  ...rest
}: DiscussionButtonProps) {
  return (
    <YourButton
      text={typeof children === "string" ? children : String(children ?? "")}
      variant={variant}
      isLoading={isLoading}
      {...rest}
    />
  );
}

function UserPositionBadge({ user }: DiscussionUserPositionBadgeProps) {
  return <YourBadge address={user.address} />;
}

<Discussion
  client={client}
  user={address ? userFromAddress(address) : null}
  onRequestConnect={signIn}
  components={{ Button: DiscussionButton, UserPositionBadge }}
/>
```

Pass your design-system button via `components.Button`. If omitted, CTAs fall back to a plain HTML `<button>` with no package styles. You can also pass `components.ConnectButton` to fully replace the signed-out connect CTA.

Use `components.UserPositionBadge` to render the commenter's position in the current market beside their name.

Author labels resolve primary ENS names via wagmi (`useEnsName`, mainnet). Wrap the tree in a `WagmiProvider` whose config includes mainnet so reverse lookups succeed; without that, addresses fall back to a shortened form.

## Styling (Tailwind)

The package is **Tailwind-only**. Components use utility classes plus CSS variables `--sd-*`. Importing `@seer-pm/discussions` also loads the package CSS (`tokens` + post content styles); you can also import `@seer-pm/discussions/style.css` explicitly if needed.

Wire the host Tailwind config:

```js
// tailwind.config.js
module.exports = {
  presets: [require("@seer-pm/discussions/tailwind")],
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/@seer-pm/discussions/dist/**/*.{js,mjs}",
  ],
};
```

The preset registers `sd-*` colors (`bg-sd-bg-main`, `text-sd-color-main`, …) that read from `--sd-*` on `.sd-root`.

`@tailwindcss/container-queries` is recommended if you rely on the thread’s `@container` layout.

## Theming

Styles use CSS custom properties on the public root class `sd-root` (also exported as `SD_ROOT_CLASS`). Typography inherits from the host (`font-family: inherit`). Defaults ship with the package CSS (imported automatically via the main entry).

Override tokens from the host stylesheet:

```css
.sd-root {
  --sd-bg-main: #ffffff;
  --sd-color-main: #0d1e33;
  --sd-border-main: #e0e2e5;
  /* override any --sd-* token; defaults ship in the package CSS */
}
```

A host can map its own design system onto `--sd-*` (for example Seer’s web app maps DaisyUI tokens in its stylesheet — that mapping is outside this package).

You can also pass `className` / `style` on `<Discussion />` (including CSS variables on `style`).

## Public API

- `Discussion` — thread UI (`components.Button` / `components.ConnectButton` / `components.UserPositionBadge`)
- `createDiscussionsClient` — HTTP client (`marketId`, `listComments`, `createComment`, `editComment`, `deleteComment`, `setLike`)
- `useDiscussions` — context hook
- `userFromAddress` — build `DiscussionUser` from a wallet
- `SD_ROOT_CLASS` — root class name for theming (`"sd-root"`)
- `@seer-pm/discussions/tailwind` — Tailwind preset (`sd-*` colors)
- Types: `DiscussionButtonProps`, `DiscussionConnectButtonProps`, `DiscussionUserPositionBadgeProps`, `DiscussionComponents`
