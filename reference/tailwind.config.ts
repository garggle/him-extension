import type { Config } from 'tailwindcss';
const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '*.{js,ts,jsx,tsx,mdx}',
  ],
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
        purple: {
          100: 'hsl(var(--primary-hue) var(--primary-saturation) 95%)',
          200: 'hsl(var(--primary-hue) var(--primary-saturation) 85%)',
          300: 'hsl(var(--primary-hue) var(--primary-saturation) 75%)',
          400: 'hsl(var(--primary-hue) var(--primary-saturation) 65%)',
          500: 'hsl(var(--primary-hue) var(--primary-saturation) 55%)',
          600: 'hsl(var(--primary-hue) var(--primary-saturation) 45%)',
          700: 'hsl(var(--primary-hue) var(--primary-saturation) 35%)',
          800: 'hsl(var(--primary-hue) var(--primary-saturation) 25%)',
          900: 'hsl(var(--primary-hue) var(--primary-saturation) 15%)',
        },
        brand: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
        orbitron: ['Orbitron', 'sans-serif'],
      },
      animation: {
        blink: 'blink 1s infinite',
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
