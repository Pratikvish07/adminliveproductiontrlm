/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          primary: '#1E3A8A',
          secondary: '#2563EB',
          bg: '#F8FAFC',
        }
      }
    },
  },
  plugins: [],
}
