/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(148, 163, 184, 0.08), 0 24px 80px rgba(15, 23, 42, 0.45)',
      },
      colors: {
        ink: '#08111f',
        mist: '#d9e4f5',
        coral: '#ff7d61',
        teal: '#58d6c6',
        gold: '#f8c95d',
      },
    },
  },
  plugins: [],
};
