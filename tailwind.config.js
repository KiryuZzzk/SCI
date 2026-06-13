/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#080d14',
        surface: '#0f1923',
        'surface-2': '#1a2535',
        'surface-3': '#243040',
        foreground: '#f0f4f8',
        muted: '#5a7a9a',
        accent: {
          DEFAULT: '#e63946',
          light: '#ff6b6b',
          dark: '#c1121f',
        },
        gap: {
          critical: '#ef4444',
          moderate: '#f59e0b',
          good: '#22c55e',
          excellent: '#06b6d4',
        },
        incident: {
          medical: '#f472b6',
          fire: '#fb923c',
          traffic: '#a78bfa',
          security: '#38bdf8',
        },
        dependency: {
          erum:     '#f472b6',
          ssc:      '#38bdf8',
          pc:       '#22c55e',
          bomberos: '#fb923c',
          cruzroja: '#ef4444',
          sedena:   '#84cc16',
          marina:   '#0ea5e9',
          hospital: '#a78bfa',
        },
        sci: {
          red:    '#ef4444',
          yellow: '#facc15',
          green:  '#22c55e',
        },
        ops: {
          crit: '#dc2626',
          warn: '#d97706',
          ok:   '#059669',
          info: '#2563eb',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
