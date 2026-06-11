/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Escalas de cinza escuro (base)
        'slate-dark': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Acentos sofisticados (sem azul)
        'brand': {
          violet: '#a855f7',
          rose: '#ec4899',
          green: '#10b981',
          cyan: '#06b6d4',
          amber: '#f59e0b',
        },
      },
      fontSize: {
        // Tipografia refinada
        'xs': ['11px', { lineHeight: '16px', letterSpacing: '0.5px' }],
        'sm': ['12px', { lineHeight: '18px' }],
        'base': ['13px', { lineHeight: '20px' }],
        'lg': ['14px', { lineHeight: '22px', fontWeight: '500' }],
        'xl': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        '2xl': ['18px', { lineHeight: '28px', fontWeight: '600' }],
        '3xl': ['24px', { lineHeight: '32px', fontWeight: '700' }],
      },
      backdropBlur: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
    },
  },
  plugins: [],
}
