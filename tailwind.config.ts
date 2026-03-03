import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Colors are driven by CSS variables so the theme can be toggled
        'mc-bg': 'var(--mc-bg)',
        'mc-bg-secondary': 'var(--mc-bg-secondary)',
        'mc-bg-tertiary': 'var(--mc-bg-tertiary)',
        'mc-border': 'var(--mc-border)',
        'mc-text': 'var(--mc-text)',
        'mc-text-secondary': 'var(--mc-text-secondary)',
        'mc-accent': 'var(--mc-accent)',
        'mc-accent-green': 'var(--mc-accent-green)',
        'mc-accent-yellow': 'var(--mc-accent-yellow)',
        'mc-accent-red': 'var(--mc-accent-red)',
        'mc-accent-purple': 'var(--mc-accent-purple)',
        'mc-accent-pink': 'var(--mc-accent-pink)',
        'mc-accent-cyan': 'var(--mc-accent-cyan)',
        // Teammates.ai brand color
        'tm-brand': '#4f8ff7',
        'tm-brand-light': '#7aadff',
        'tm-brand-dark': '#2b6ed9',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(79, 143, 247, 0.15)',
        'glow-sm': '0 0 10px rgba(79, 143, 247, 0.1)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};

export default config;
