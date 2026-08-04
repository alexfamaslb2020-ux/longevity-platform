import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#f2f7f3',
          100: '#e2ede4',
          200: '#c7dacb',
          300: '#a2bfa9',
          400: '#779d82',
          500: '#5b8267',
          600: 'hsl(var(--primary))',
          700: '#3a5c46',
          800: '#314b3b',
          900: '#2a3f32',
          950: '#16221b',
        },
        gold: {
          50: '#faf6ec',
          100: '#f2e8d0',
          200: '#e5d2a5',
          300: '#d6b876',
          400: '#c9a257',
          500: '#b98b41',
          600: '#a47234',
          700: '#855a2d',
          800: '#6d4929',
          900: '#5b3d26',
        },
        sand: {
          50: '#faf9f6',
          100: '#f4f2ec',
          200: '#e8e4da',
          300: '#d8d1c2',
          400: '#c2b7a3',
          500: '#ad9e87',
          600: '#9c8a72',
          700: '#82725d',
          800: '#6a5d4e',
          900: '#574c41',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(26, 32, 28, 0.04), 0 6px 24px -8px rgba(26, 32, 28, 0.08)',
        'card-hover': '0 2px 4px rgba(26, 32, 28, 0.05), 0 16px 40px -10px rgba(26, 32, 28, 0.16)',
        pop: '0 4px 12px rgba(26, 32, 28, 0.08), 0 24px 56px -12px rgba(26, 32, 28, 0.22)',
        'pop-lg': '0 12px 32px -8px rgba(26, 32, 28, 0.16), 0 40px 90px -20px rgba(26, 32, 28, 0.28)',
        'glow-sage': '0 0 0 4px hsl(157 25% 45% / 0.12)',
        'glow-gold': '0 0 0 4px hsl(38 45% 50% / 0.12)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-600px 0' },
          '100%': { backgroundPosition: '600px 0' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-6px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s linear infinite',
        fadeIn: 'fadeIn 0.3s ease-out',
        slideIn: 'slideIn 0.25s ease-out',
        'slideIn-right': 'slideInRight 0.25s ease-out',
        scaleIn: 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
