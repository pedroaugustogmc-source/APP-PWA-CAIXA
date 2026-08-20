import { StatusBadge } from './StatusBadge'
import { formatBRL, formatDias, formatPercent } from '../lib/format'
import { isItemParado } from '../lib/dashboard'
import type { Categoria } from '../types/domain'
import type { ItemCalculado } from '../types/domain'

interface Props {
  item: ItemCalculado
  categoriaNome: Categoria['nome'] | undefined
  diasAlerta: number
  onVender: () => void
  onCancelarVenda: () => void
  onMarcarPerdido: () => void
}

export function ItemCard({ item, categoriaNome, diasAlerta, onVender, onCancelarVenda, onMarcarPerdido }: Props) {
  const parado = isItemParado(item, diasAlerta)

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">
            {categoriaNome ?? 'Sem categoria'}
            {item.identificador ? ` · ${item.identificador}` : ''}
          </p>
          <p className="text-xs text-slate-500">
            {item.condicao === 'novo' ? 'Novo' : 'Usado'} · custo {formatBRL(item.custo_unitario)}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      {item.status === 'vendido' && item.lucro_liquido !== null && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-xs text-slate-400">Venda</p>
            <p className="font-medium">{formatBRL(item.preco_venda ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Lucro</p>
            <p className={`font-semibold ${item.lucro_liquido < 0 ? 'text-loss' : 'text-profit'}`}>
              {formatBRL(item.lucro_liquido)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Margem / ROI</p>
            <p className="font-medium">
              {formatPercent(item.margem_pct ?? 0)} / {formatPercent(item.roi_pct ?? 0)}
            </p>
          </div>
        </div>
      )}

      {(item.status === 'em_estoque' || item.status === 'reservado') && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-xs text-slate-400">Preço mínimo</p>
            <p className="font-medium">{formatBRL(item.preco_minimo ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Preço sugerido</p>
            <p className="font-medium">{formatBRL(item.preco_sugerido ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Em estoque há</p>
            <p className={`font-medium ${parado ? 'text-stale' : ''}`}>{formatDias(item.dias_em_estoque ?? 0)}</p>
          </div>
        </div>
      )}

      {parado && <p className="mt-2 text-xs font-medium text-stale">⚠ Estoque parado há mais de {diasAlerta} dias</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {(item.status === 'em_estoque' || item.status === 'reservado') && (
          <>
            <button type="button" onClick={onVender} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
              Vender
            </button>
            <button
              type="button"
              onClick={onMarcarPerdido}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-loss"
            >
              Perdido/danificado
            </button>
          </>
        )}
        {item.status === 'vendido' && (
          <button
            type="button"
            onClick={onCancelarVenda}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Cancelar venda
          </button>
        )}
      </div>
    </li>
  )
}
