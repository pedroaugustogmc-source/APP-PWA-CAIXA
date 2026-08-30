import type { ItemCalculado } from '../../types/domain'
import { formatBRL, formatDate } from '../../lib/format'
import { Card, CardLabel } from '../Card'

interface Props {
  itensVendidos: ItemCalculado[]
  lucroTotal: number
}

/** Lista todas as vendas com o lucro individual de cada uma, mais o total somado. */
export function HistoricoVendasSection({ itensVendidos, lucroTotal }: Props) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <CardLabel>Histórico de vendas</CardLabel>
        <span className={`text-sm font-bold tabular-nums ${lucroTotal < 0 ? 'text-loss' : 'text-profit'}`}>
          {formatBRL(lucroTotal)}
        </span>
      </div>
      {itensVendidos.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma venda registrada ainda.</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {itensVendidos.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{item.nome}</p>
                <p className="text-xs text-slate-400">{item.data_venda ? formatDate(item.data_venda) : ''}</p>
              </div>
              <span
                className={`shrink-0 pl-2 font-semibold tabular-nums ${(item.lucro_liquido ?? 0) < 0 ? 'text-loss' : 'text-profit'}`}
              >
                {formatBRL(item.lucro_liquido ?? 0)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
