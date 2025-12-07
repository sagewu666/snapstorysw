/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',

    './components/**/*.{js,ts,jsx,tsx}',
    './utils/**/*.{js,ts,jsx,tsx}',

    // 如果你的 functions 下不会用 tailwind，可以删除这行
    './functions/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        'brand-blue': '#2563EB',
        'brand-green': '#22C55E',
        'brand-red': '#EF4444',
        'brand-yellow': '#FACC15',
        'brand-purple': '#8B5CF6',
        'brand-orange': '#F97316',
      },
    },
  },

  plugins: [],
};
