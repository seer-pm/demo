/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{html,tsx}",
    "node_modules/flowbite-react/lib/esm/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Open Sans', 'sans-serif'],
      },
    },
  },
  plugins: [require("daisyui")],
};
