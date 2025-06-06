/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ['class'],
	content: ['./src/**/*.{html,js,svelte,ts}', './src/**/*.{js,ts,jsx,tsx,mdx}'],
	theme: {
		fontFamily: {
			sans: ['Space Mono', 'monospace'],
			serif: ['Space Mono', 'monospace'],
			mono: ['Space Mono', 'monospace'],
			orbitron: ['Space Mono', 'monospace']
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
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
					900: 'hsl(var(--primary-hue) var(--primary-saturation) 15%)'
				},
				brand: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				// Chat message colors
				chat: {
					// Him (left bubbles)
					him: {
						bg: '#F4EAFA',
						border: '#C998E6',
						text: '#EED2FF'
					},
					// User (right bubbles)
					user: {
						bg: '#4B1A5E',
						border: '#A170BD',
						text: '#D68FFF'
					}
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			animation: {
				blink: 'blink 1s infinite',
				'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite'
			},
			keyframes: {
				blink: {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0' }
				}
			},
			// Add opacity values for consistent reference
			opacity: {
				'05': '0.05',
				10: '0.1',
				60: '0.6'
			}
		}
	},
	plugins: []
};
