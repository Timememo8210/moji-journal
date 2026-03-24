import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: {
          gold: '#B8860B',
          blue: '#6B8DA6',
        },
      },
      maxWidth: {
        journal: '720px',
      },
    },
  },
  plugins: [],
}
export default config
