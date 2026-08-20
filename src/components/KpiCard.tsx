interface KpiCardProps {
  label: string
  value: string
  tone?: 'neutral' | 'auto'
  helpText?: string
}

/** tone="auto" colore verde/vermelho a partir do sinal embutido no texto (ex.: "-R$ 10,00"). */
export function KpiCard({ label, value, tone = 'neutral', helpText }: KpiCardProps) {
  const isNegative = value.trim().startsWith('-')
  const colorClass =
    tone === 'auto' ? (isNegative ? 'text-loss' : 'text-profit') : 'text-slate-900'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${colorClass}`}>{value}</p>
      {helpText && <p className="mt-1 text-xs text-slate-400">{helpText}</p>}
    </div>
  )
}
