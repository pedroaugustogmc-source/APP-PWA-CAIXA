import { StatusBadge } from './StatusBadge'
import { Button } from './Button'
import { IconCloudOff, IconEdit, IconTrash } from './icons'
import { formatBRL, formatPercent } from '../lib/format'
import { isItemParado } from '../lib/dashboard'
import type { ItemCalculado } from '../types/domain'

interface Props {
  item: ItemCalculado & { pendenteSync?: boolean }
  diasAlerta: number
  onVender: () => void
  onCancelarVenda: () => void
  onMarcarPerdido: () => void
  onAlterarStatus: (status: 'em_estoque' | 'reservado') => void
  onEditar: () => void
  onExcluir: () => void
}

export function ItemCard({
  item,
  diasAlerta,
  onVender,
  onCancelarVenda,
  onMarcarPerdido,
  onAlterarStatus,
  onEditar,
  onExcluir,
}: Props) {
  const parado = isItemParado(item, diasAlerta)
  const prazo = item.dias_planejados

  return (
    <li
      className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        parado ? 'border-stale/40 border-l-4' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{item.nome}</p>
          <p className="text-xs text-slate-500">
            {item.categoria?.nome ?? 'Sem categoria'} · {item.condicao === 'novo' ? 'Novo' : 'Usado'} · custo{' '}
            {formatBRL(item.custo_total)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {!item.pendenteSync && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onEditar}
                aria-label="Editar item"
                className="text-slate-400 transition-colors hover:text-slate-700"
              >
                <IconEdit className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onExcluir}
                aria-label="Excluir item"
                className="text-slate-400 transition-colors hover:text-loss"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
          )}
          <StatusBadge status={item.status} />
          {item.pendenteSync && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
              <IconCloudOff className="h-3 w-3" /> aguardando envio
            </span>
          )}
        </div>
      </div>

      {item.status === 'vendido' && item.lucro_liquido !== null && (
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-sm">
          <div>
            <p className="text-xs text-slate-400">Venda</p>
            <p className="font-medium tabular-nums">{formatBRL(item.preco_venda ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Lucro</p>
            <p className={`font-semibold tabular-nums ${item.lucro_liquido < 0 ? 'text-loss' : 'text-profit'}`}>
              {formatBRL(item.lucro_liquido)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Margem / ROI</p>
            <p className="font-medium tabular-nums">
              {formatPercent(item.margem_pct ?? 0)} / {formatPercent(item.roi_pct ?? 0)}
            </p>
          </div>
        </div>
      )}

      {(item.status === 'em_estoque' || item.status === 'reservado') && (
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-sm">
          <div>
            <p className="text-xs text-slate-400">Preço mínimo</p>
            <p className="font-medium tabular-nums">{formatBRL(item.preco_minimo ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Preço sugerido</p>
            <p className="font-medium tabular-nums">{formatBRL(item.preco_sugerido ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Dias com você</p>
            <p className={`font-medium tabular-nums ${parado ? 'text-stale' : ''}`}>
              {item.dias_em_estoque ?? 0}
              {prazo ? ` de ${prazo}` : ''}
            </p>
          </div>
        </div>
      )}

      {parado && (
        <p className="mt-2 text-xs font-medium text-stale">
          Parado {prazo ? `— passou do prazo de ${prazo} dias` : `há mais de ${diasAlerta} dias`}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {(item.status === 'em_estoque' || item.status === 'reservado') && (
          <>
            <Button variant="primary" size="sm" onClick={onVender}>
              Vender
            </Button>
            {item.status === 'em_estoque' ? (
              <Button variant="secondary" size="sm" onClick={() => onAlterarStatus('reservado')}>
                Reservar
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => onAlterarStatus('em_estoque')}>
                Voltar ao estoque
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={onMarcarPerdido}>
              Perdido/danificado
            </Button>
          </>
        )}
        {item.status === 'vendido' && (
          <Button variant="secondary" size="sm" onClick={onCancelarVenda}>
            Cancelar venda
          </Button>
        )}
      </div>
    </li>
  )
}
