/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0f766e',
        heading: '#0f172a',
        background: '#f8fafc',
        card: '#ffffff',
        text: '#0f172a',
        muted: '#64748b',
        positive: '#16a34a',
        caution: '#d97706',
        critical: '#dc2626',
        border: '#e2e8f0',
        tealSoft: '#ecfeff',
        mintSoft: '#ecfdf5',
        amberSoft: '#fffbeb',
        slateSoft: '#f1f5f9'
      },
      boxShadow: {
        soft: '0 16px 40px rgba(15, 23, 42, 0.08)',
        card: '0 12px 32px rgba(15, 23, 42, 0.08)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
