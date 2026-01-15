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
        sans: ['Open Sans', 'sans-serif'],
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
    },
  },
  plugins: [require("daisyui"), require('@tailwindcss/container-queries'),],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          // Custom CSS variables for light theme
          "--card-bg": "#ffffff",
          "--separator-100": "#e5e5e5",
        },
      },
      {
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          "--bc": "100% 0 0", // white in oklch format
          // Custom CSS variables for dark theme
          "--card-bg": "#1e2329",
          "--separator-100": "#323942",
        },
      },
    ],
  },
};