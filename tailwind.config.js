/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#E6F1FB', 100:'#B5D4F4', 500:'#185FA5', 700:'#0C447C', 900:'#042C53' }
      }
    }
  },
  plugins: []
}
