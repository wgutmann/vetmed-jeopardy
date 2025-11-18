/** @type {import('tailwindcss').Config} */
export default {
  content: ['./{src,components,services}/**/*.{astro,html,js,jsx,ts,tsx,vue}', './*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'jeopardy-blue': '#060CE9',
        'jeopardy-gold': '#D69F4C',
        'jeopardy-dark': '#010a3f',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};