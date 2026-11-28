import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './utils/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        ground: '#0F1115',
        abyss: '#0B0D11',
        surface: '#161A21',
        elevated: '#1C2430',
        borderSubtle: '#232836',
        borderStrong: '#34404F',
        ink: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
          dark: '#090D11',
        },
        mint: {
          DEFAULT: '#10B981',
          bright: '#14D496',
          teal: '#14B8A6',
          dim: '#0B3A2C',
        },
        signal: {
          blue: '#3B82F6',
          amber: '#F59E0B',
          coral: '#EF4444',
          slate: '#64748B',
        },
      },
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        editorial: ['"Josefin Sans"', 'sans-serif'],
        sans: ['Manrope', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      transitionTimingFunction: {
        signal: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      transitionDuration: {
        fast: '120ms',
        mid: '220ms',
        panel: '360ms',
      },
      maxWidth: {
        frame: '1240px',
      },
    },
  },
}
