/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        'soft': '0 2px 8px rgba(0,0,0,0.1)',
        'glass': '0 4px 20px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}

