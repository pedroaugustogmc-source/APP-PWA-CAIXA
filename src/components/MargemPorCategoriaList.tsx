import type { MargemPorCategoria } from '../lib/dashboard'
import { formatPercent } from '../lib/format'

export function MargemPorCategoriaList({ dados }: { dados: MargemPorCategoria[] }) {
  if (dados.length === 0) return <p className="text-sm text-slate-400">Sem vendas registradas ainda.</p>

  return (
    <ul className="space-y-1.5">
      {dados.map((d) => (
        <li key={d.categoria_id ?? 'sem-categoria'} className="flex items-center justify-between text-sm">
          <span className="text-slate-700">
            {d.categoria_nome} <span className="text-slate-400">({d.quantidade_vendida})</span>
          </span>
          <span className={`font-semibold ${d.margem_media < 0 ? 'text-loss' : 'text-profit'}`}>
            {formatPercent(d.margem_media)}
          </span>
        </li>
      ))}
    </ul>
  )
}
