// Espelha as cores do tema (src/index.css @theme) — Recharts precisa de valores literais.
export const CHART_COLORS = {
  profit: '#16a34a',
  loss: '#dc2626',
  stale: '#f59e0b',
  neutral: '#64748b',
  neutralLight: '#cbd5e1',
} as const

/** Estilo compartilhado do tooltip do Recharts, pra combinar com os cards do app. */
export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.08)',
    fontSize: 12,
    padding: '8px 12px',
  },
  labelStyle: { color: '#0f172a', fontWeight: 600, marginBottom: 2 },
  itemStyle: { color: '#334155' },
  cursor: { fill: '#f1f5f9' },
} as const
