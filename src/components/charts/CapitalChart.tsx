import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CapitalKpi } from '../../lib/dashboard'
import { formatBRL } from '../../lib/format'
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from '../../lib/chartColors'

export function CapitalChart({ capital }: { capital: CapitalKpi }) {
  const dados = [
    { label: 'Investido', valor: capital.investido_total, cor: CHART_COLORS.neutral },
    { label: 'Realizado (vendido)', valor: capital.realizado, cor: CHART_COLORS.profit },
    { label: 'Preso em estoque', valor: capital.preso_em_estoque, cor: CHART_COLORS.stale },
    { label: 'Perdido/danificado', valor: capital.perdido, cor: CHART_COLORS.loss },
  ]

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={dados} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
        <Tooltip formatter={(value) => formatBRL(Number(value))} {...CHART_TOOLTIP_STYLE} />
        <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
          {dados.map((d) => (
            <Cell key={d.label} fill={d.cor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
