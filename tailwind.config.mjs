/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'jeopardy-blue': '#060CE9',
        'jeopardy-gold': '#D69F4C',
        'jeopardy-dark': '#010a3f',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Swiss 911', 'Impact', 'sans-serif'],
      }
    },
  },
  plugins: [],
};