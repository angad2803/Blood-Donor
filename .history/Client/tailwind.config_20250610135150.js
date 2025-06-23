/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hospital: {
          50: "#e3fdfd",
          100: "#cbf1f1",
          200: "#a6e3e9",
          300: "#71c9ce",
          400: "#39a2ae",
          500: "#297a7e",
          600: "#206568",
          700: "#174e52",
          800: "#0d383b",
          900: "#032224",
        },
      },
    },
  },
  plugins: [],
};
