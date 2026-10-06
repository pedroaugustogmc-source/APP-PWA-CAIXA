import { IconEdit, IconTrash } from './icons'
import { formatBRL } from '../lib/format'
import type { Acessorio } from '../types/domain'

interface Props {
  acessorio: Acessorio
  onEditar: () => void
  onExcluir: () => void
}

export function AcessorioCard({ acessorio, onEditar, onExcluir }: Props) {
  const estoqueBaixo = acessorio.quantidade_estoque <= acessorio.estoque_minimo

  return (
    <li
      className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        estoqueBaixo ? 'border-stale/40 border-l-4' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{acessorio.nome}</p>
          <p className="text-xs text-slate-500">{acessorio.categoria?.nome ?? 'Sem categoria'}</p>
          <p className="text-xs text-slate-400">
            custo {formatBRL(acessorio.custo_unitario)} · venda {formatBRL(acessorio.preco_venda)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onEditar}
            aria-label="Editar acessório"
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <IconEdit className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onExcluir}
            aria-label="Excluir acessório"
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-loss/10 hover:text-loss"
          >
            <IconTrash className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
        <div>
          <p className="text-xs text-slate-400">Em estoque</p>
          <p className={`font-semibold tabular-nums ${estoqueBaixo ? 'text-stale' : 'text-slate-900'}`}>
            {acessorio.quantidade_estoque} un.
          </p>
        </div>
        {estoqueBaixo && <span className="text-xs font-medium text-stale">Estoque baixo (mín. {acessorio.estoque_minimo})</span>}
      </div>
    </li>
  )
}
