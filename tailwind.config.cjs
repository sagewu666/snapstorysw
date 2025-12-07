/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './**/*.{js,ts,jsx,tsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        // 你的品牌色（可以在 className 里直接使用 bg-brand-red）
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
