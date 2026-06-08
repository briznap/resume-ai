import type { Config } from 'tailwindcss'

// Colors are mapped to the CSS custom properties defined in src/index.css so
// the Design System palette lives in exactly one place. NOTE: because these
// resolve to var()/rgba values (not channel triplets), Tailwind's `/opacity`
// modifiers (e.g. `bg-bg/80`) will NOT work on them — use the dedicated CSS
// classes in index.css for anything needing translucency.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'agent-bg': 'var(--color-agent-bg)',
        line: 'var(--color-border)',
        'line-strong': 'var(--color-border-strong)',
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          light: 'var(--color-accent-light)',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
