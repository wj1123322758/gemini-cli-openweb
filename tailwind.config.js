/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lab-bg': '#0f1115',
        'lab-surface': '#181c22',
        'lab-active': '#222933',
        'lab-border': '#2d333b',
        'lab-primary': '#4285f4', // Google Blue
        'lab-accent': '#8ab4f8',
        'lab-text-dim': '#9ca3af',
      }
    },
  },
  plugins: [],
}
