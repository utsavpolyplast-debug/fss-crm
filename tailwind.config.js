/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#E6F1FB', 500:'#185FA5', 700:'#0C447C' }
      }
    }
  },
  plugins: []
}
