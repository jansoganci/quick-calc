import type { Config } from 'tailwindcss'
import daisyui from 'daisyui'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        qc: {
          primary: '#1D3A5F',
          'primary-content': '#FFFFFF',
          'base-100': '#FFFFFF',
          'base-200': '#FCFCFD',
          'base-300': '#EDEEF0',
          'base-content': '#16181C',
          error: '#A0503C',
          'error-content': '#FFFFFF',
        },
      },
    ],
  },
} satisfies Config
