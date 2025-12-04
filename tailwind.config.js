/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'damage-floor': '#3b82f6',
        'damage-wall': '#f97316',
        'damage-ceiling': '#92400e',
        'damage-fixture': '#ef4444',
        'damage-infrastructure': '#7c3aed',
        'flood-water': '#3b6e8f',
      },
    },
  },
  plugins: [],
}
