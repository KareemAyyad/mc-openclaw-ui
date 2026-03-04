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
        // Premium Light Theme
        'mc-bg': '#f8fafc', // slate-50 base
        'mc-bg-secondary': '#ffffff', // white pane
        'mc-bg-tertiary': '#f1f5f9', // slate-100 elevated 

        // Borders (Subtle Glass)
        'mc-border': 'rgba(15, 23, 42, 0.08)',
        'mc-border-hover': 'rgba(15, 23, 42, 0.15)',

        // Typography Hierarchy
        'mc-text': '#0f172a', // slate-900
        'mc-text-secondary': '#64748b', // slate-500

        // Premium Neon Accents (Adjusted for light theme)
        'mc-accent': '#0284c7', // sky-600 primary action
        'mc-accent-green': '#059669', // emerald-600 online/success
        'mc-accent-yellow': '#d97706', // amber-600 warning
        'mc-accent-red': '#dc2626', // red-600 error
        'mc-accent-purple': '#7c3aed', // violet-600 highlight
        'mc-accent-pink': '#db2777', // pink-600 accent
        'mc-accent-cyan': '#0891b2', // cyan-600 bright accent
      },
      fontFamily: {
        // Use a clean geometric sans for UI, keeping mono for tech details
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      // Subtle Animations for micro-interactions
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
