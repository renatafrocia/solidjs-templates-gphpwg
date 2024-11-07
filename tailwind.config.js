/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/components/upload/**/*.{js,ts,jsx,tsx}",
    "./src/components/home/**/*.{js,ts,jsx,tsx}",
    "./src/components/test/**/*.{js,ts,jsx,tsx}",
    "./src/components/interactors/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}