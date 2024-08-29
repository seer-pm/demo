const COLORS = {
  'blue-primary': '#24CDFE',
  'blue-secondary': '#200FB9',
  'blue-medium': '#EAF1FF',
  'blue-light': '#F8FAFF',

  'purple-primary': '#9747FF',
  'purple-secondary': '#B38FFF',
  'purple-medium': '#FBF8FF',
  'purple-light': '#FDFBFF',
  'purple-dark': '#59097E',

  'black': '#000000',
  'black-primary': '#333333',
  'black-secondary': '#999999',
  'black-medium': '#e5e5e5',
  'black-light': '#FBFBFB',

  'success-primary': '#00C42B',
  'success-light': '#F0FBF2',

  'warning-primary': '#FF9900',
  'warning-light': '#FFF9F0',

  'error-primary': '#F60C36',
  'error-light': '#FEF0F3',

  'tint-blue-primary': '#13C0CB',
  'tint-blue-light': '#E5FDFF',

  'gray-light': '#F0F0F0'
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{html,tsx}",
  ],
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
      ...COLORS,
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ['light'],
  },
};