/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{html,tsx,ts}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Open Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Times New Roman', 'serif'],
        italic: ['Instrument Serif', 'Times New Roman', 'serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#fff',
      black: '#000',
      'blue-primary': 'oklch(var(--blue-primary) / <alpha-value>)',
      'blue-secondary': 'oklch(var(--blue-secondary) / <alpha-value>)',
      'blue-medium': 'oklch(var(--blue-medium) / <alpha-value>)',
      'blue-light': 'oklch(var(--blue-light) / <alpha-value>)',
      'purple-primary': 'oklch(var(--purple-primary) / <alpha-value>)',
      'purple-secondary': 'oklch(var(--purple-secondary) / <alpha-value>)',
      'purple-medium': 'oklch(var(--purple-medium) / <alpha-value>)',
      'purple-light': 'oklch(var(--purple-light) / <alpha-value>)',
      'purple-dark': 'oklch(var(--purple-dark) / <alpha-value>)',
      'black-primary': 'oklch(var(--black-primary) / <alpha-value>)',
      'black-secondary': 'oklch(var(--black-secondary) / <alpha-value>)',
      'black-medium': 'oklch(var(--black-medium) / <alpha-value>)',
      'black-light': 'oklch(var(--black-light) / <alpha-value>)',
      'success-primary': 'oklch(var(--success-primary) / <alpha-value>)',
      'success-light': 'oklch(var(--success-light) / <alpha-value>)',
      'warning-primary': 'oklch(var(--warning-primary) / <alpha-value>)',
      'warning-light': 'oklch(var(--warning-light) / <alpha-value>)',
      'error-primary': 'oklch(var(--error-primary) / <alpha-value>)',
      'error-light': 'oklch(var(--error-light) / <alpha-value>)',
      'tint-blue-primary': 'oklch(var(--tint-blue-primary) / <alpha-value>)',
      'tint-blue-light': 'oklch(var(--tint-blue-light) / <alpha-value>)',
      'gray-light': 'oklch(var(--gray-light) / <alpha-value>)',
      // seerbeta tokens (plain hex/rgb vars — no alpha channel)
      surface: 'var(--surface)',
      'surface-2': 'var(--surface-2)',
      'bg-page': 'var(--bg)',
      'bg-2': 'var(--bg-2)',
      'bg-3': 'var(--bg-3)',
      ink: 'var(--ink)',
      'ink-2': 'var(--ink-2)',
      'ink-3': 'var(--ink-3)',
      'ink-4': 'var(--ink-4)',
      'ink-5': 'var(--ink-5)',
      'border-soft': 'var(--border)',
      'border-soft-2': 'var(--border-2)',
      'border-strong': 'var(--border-strong)',
      blue: 'var(--blue)',
      'blue-hover': 'var(--blue-hover)',
      'blue-soft': 'var(--blue-soft)',
      'blue-text': 'var(--blue-text)',
      pos: 'var(--pos)',
      'pos-text': 'var(--pos-text)',
      neg: 'var(--neg)',
      'neg-text': 'var(--neg-text)',
      'cat-1': 'var(--cat-1)',
      'cat-2': 'var(--cat-2)',
      'cat-3': 'var(--cat-3)',
      'cat-4': 'var(--cat-4)',
      'cat-5': 'var(--cat-5)',
      verified: 'var(--verified)',
    },
  },
  plugins: [require("daisyui"), require('@tailwindcss/container-queries'),],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          // seerbeta light palette
          "base-100": "#ffffff", // surface
          "base-200": "#f3f2ec", // bg-2
          "base-300": "#ece8dc", // border
          "base-content": "#0f1115", // ink
          "--card-bg": "#ffffff",
          "--separator-100": "#ece8dc",
        },
      },
      {
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          // seerbeta dark palette
          "base-100": "#130c24", // surface
          "base-200": "#20183c", // bg-2
          "base-300": "#261c46", // border
          "base-content": "#f4f1ff", // ink
          "neutral": "#20183c",
          "--card-bg": "#130c24",
          "--separator-100": "#261c46",
        },
      },
    ],
  },
};