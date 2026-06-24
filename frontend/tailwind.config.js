/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kahe-blue': '#0066b2',
        'kahe-green': '#28a745',
      }
    },
  },
  plugins: [],
}
