import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { LucroPorCategoria } from '../../lib/dashboard'
import { formatBRL } from '../../lib/format'
import { CHART_COLORS } from '../../lib/chartColors'

export function LucroPorCategoriaChart({ dados }: { dados: LucroPorCategoria[] }) {
  if (dados.length === 0) return <p className="text-sm text-slate-400">Sem vendas registradas ainda.</p>

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, dados.length * 40)}>
      <BarChart data={dados} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="categoria_nome"
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip formatter={(value) => formatBRL(Number(value))} />
        <Bar dataKey="lucro_total" radius={[0, 4, 4, 0]}>
          {dados.map((d) => (
            <Cell
              key={d.categoria_id ?? 'sem-categoria'}
              fill={d.lucro_total < 0 ? CHART_COLORS.loss : CHART_COLORS.profit}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
