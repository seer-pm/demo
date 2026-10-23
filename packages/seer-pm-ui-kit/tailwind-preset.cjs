/** Tailwind 3 bindings for the Seer tokens. Load tokens.css on the page as well. */

// color-mix lets opacity modifiers such as bg-seer-purple/40 work on hex custom properties.
const token = (name) => `color-mix(in srgb, var(${name}) calc(<alpha-value> * 100%), transparent)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        seer: {
          purple: token("--seer-brand-purple"),
          "purple-hover": token("--seer-brand-purple-hover"),
          "purple-on-ink": token("--seer-brand-purple-on-ink"),
          ink: token("--seer-brand-ink"),
          lavender: token("--seer-brand-lavender"),
          "on-ink": token("--seer-on-ink"),
          "on-ink-muted": token("--seer-on-ink-muted"),
          "ink-border": token("--seer-ink-border"),
          page: token("--seer-page"),
          surface: token("--seer-surface"),
          "surface-raised": token("--seer-surface-raised"),
          text: token("--seer-text"),
          muted: token("--seer-muted"),
          border: token("--seer-border"),
          "accent-soft": token("--seer-accent-soft"),
          "accent-text": token("--seer-accent-text"),
          positive: token("--seer-positive"),
          negative: token("--seer-negative"),
          warning: token("--seer-warning"),
          "series-1": token("--seer-series-1"),
          "series-2": token("--seer-series-2"),
          "series-3": token("--seer-series-3"),
          "series-4": token("--seer-series-4"),
        },
      },
      borderRadius: {
        control: "var(--seer-radius-sm)",
        surface: "var(--seer-radius-md)",
      },
      fontFamily: {
        seer: ["var(--seer-font-sans)"],
      },
    },
  },
};
