import type { ItemCalculado } from '../types/domain'
import { formatBRL, formatDias } from '../lib/format'

interface Props {
  itens: ItemCalculado[]
  modo: 'lucro' | 'parado'
}

export function Top5List({ itens, modo }: Props) {
  if (itens.length === 0) return <p className="text-sm text-slate-400">Nada por aqui ainda.</p>

  return (
    <ul className="space-y-1.5">
      {itens.map((item, idx) => (
        <li key={item.id} className="flex items-center justify-between text-sm">
          <span className="text-slate-700">
            {idx + 1}. {item.identificador || item.id.slice(0, 8)}
          </span>
          <span className={modo === 'lucro' ? 'font-semibold text-profit' : 'font-semibold text-stale'}>
            {modo === 'lucro' ? formatBRL(item.lucro_liquido ?? 0) : formatDias(item.dias_em_estoque ?? 0)}
          </span>
        </li>
      ))}
    </ul>
  )
}
