import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Teammates.ai refined dark theme — modern, premium, 2026
        'mc-bg': '#0a0e14',
        'mc-bg-secondary': '#12161e',
        'mc-bg-tertiary': '#1a1f2b',
        'mc-border': '#262d3a',
        'mc-text': '#d4dae5',
        'mc-text-secondary': '#7a8599',
        'mc-accent': '#4f8ff7',
        'mc-accent-green': '#34d07a',
        'mc-accent-yellow': '#e5a821',
        'mc-accent-red': '#f04d4d',
        'mc-accent-purple': '#9b6dff',
        'mc-accent-pink': '#e05599',
        'mc-accent-cyan': '#22c997',
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
