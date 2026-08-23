import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { LucroPorMes } from '../../lib/dashboard'
import { formatBRL, formatMes } from '../../lib/format'
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from '../../lib/chartColors'

export function LucroMensalChart({ dados }: { dados: LucroPorMes[] }) {
  if (dados.length === 0) return <p className="text-sm text-slate-400">Sem dados suficientes ainda.</p>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={dados} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="mes" tickFormatter={formatMes} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
        <Tooltip
          formatter={(value) => formatBRL(Number(value))}
          labelFormatter={(label) => formatMes(String(label))}
          {...CHART_TOOLTIP_STYLE}
        />
        <Bar dataKey="lucro" radius={[4, 4, 0, 0]}>
          {dados.map((d) => (
            <Cell key={d.mes} fill={d.lucro < 0 ? CHART_COLORS.loss : CHART_COLORS.profit} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
