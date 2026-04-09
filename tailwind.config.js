/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.5' }],  
        sm: ['1rem', { lineHeight: '1.6' }], 
        base: ['1.1rem', { lineHeight: '1.7' }], 
        lg: ['1.1875rem', { lineHeight: '1.6' }],
        xl: ['1.3125rem', { lineHeight: '1.5' }], 
        '2xl': ['1.5rem', { lineHeight: '1.4' }], 
        '3xl': ['1.875rem', { lineHeight: '1.35' }],
        '4xl': ['2.25rem', { lineHeight: '1.25' }], 
        '5xl': ['3rem', { lineHeight: '1.2' }],
      },
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        bg: 'var(--color-bg)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          2: 'var(--color-surface2)',
        },
        border: 'var(--color-border)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        faint: 'var(--color-faint)',
        sidebar: {
          DEFAULT: 'var(--color-sidebar)',
          text: 'var(--color-sidebar-text)',
          active: 'var(--color-sidebar-active)',
          hover: 'var(--color-sidebar-hover)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        lg: 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
}

export default config