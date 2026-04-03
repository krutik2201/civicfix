/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'civic-blue': '#2563eb',
        'civic-red': '#dc2626',
        'civic-green': '#16a34a',
        'civic-yellow': '#f59e0b',
        'brand-primary': '#0f172a', /* slate-900 */
        'brand-bg': '#f9fafb',      /* gray-50 */
        'brand-warning': '#f97316', /* orange-500 */
        'brand-success': '#16a34a', /* green-600 */
        'brand-error': '#dc2626',   /* red-600 */
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}