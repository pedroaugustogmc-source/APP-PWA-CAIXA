import { StatusBadge } from './StatusBadge'
import { Button } from './Button'
import { IconCloudOff, IconEdit, IconTrash } from './icons'
import { formatBRL, formatDias } from '../lib/format'
import { custoTotalAparelho, diasEmEstoque, todayISO } from '../lib/calculations'
import type { Aparelho } from '../types/domain'

const CONDICAO_LABELS: Record<Aparelho['condicao'], string> = {
  novo: 'Novo',
  seminovo: 'Seminovo',
  vitrine: 'Vitrine',
  defeito: 'Com defeito',
}

interface Props {
  aparelho: Aparelho & { pendenteSync?: boolean }
  diasAlerta: number
  onAlterarStatus: (status: 'em_estoque' | 'reservado' | 'devolvido' | 'baixado' | 'perdido_danificado') => void
  onEditar: () => void
  onExcluir: () => void
}

export function AparelhoCard({ aparelho, diasAlerta, onAlterarStatus, onEditar, onExcluir }: Props) {
  const emEstoqueOuReservado = aparelho.status === 'em_estoque' || aparelho.status === 'reservado'
  const dias = emEstoqueOuReservado ? diasEmEstoque(aparelho.data_compra, todayISO()) : null
  const prazo = aparelho.dias_planejados
  const parado = emEstoqueOuReservado && dias !== null && dias > (prazo ?? diasAlerta)

  return (
    <li
      className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        parado ? 'border-stale/40 border-l-4' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{aparelho.nome}</p>
          <p className="text-xs text-slate-500">
            {aparelho.modelo}
            {aparelho.cor ? ` · ${aparelho.cor}` : ''}
            {aparelho.capacidade_gb ? ` · ${aparelho.capacidade_gb}GB` : ''} · {CONDICAO_LABELS[aparelho.condicao]}
          </p>
          <p className="text-xs text-slate-400">
            IMEI {aparelho.imei ?? 'não informado'} · custo {formatBRL(custoTotalAparelho(aparelho))}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {!aparelho.pendenteSync && (
            <div className="-mt-1 -mr-1 flex items-center gap-0.5">
              <button
                type="button"
                onClick={onEditar}
                aria-label="Editar aparelho"
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <IconEdit className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onExcluir}
                aria-label="Excluir aparelho"
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-loss/10 hover:text-loss"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
          )}
          <StatusBadge status={aparelho.status} />
          {aparelho.pendenteSync && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
              <IconCloudOff className="h-3 w-3" /> aguardando envio
            </span>
          )}
        </div>
      </div>

      {dias !== null && (
        <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
          <p className="text-xs text-slate-400">Dias em estoque</p>
          <p className={`font-medium tabular-nums ${parado ? 'text-stale' : ''}`}>
            {formatDias(dias)}
            {prazo ? ` de ${prazo}` : ''}
          </p>
        </div>
      )}

      {parado && (
        <p className="mt-2 text-xs font-medium text-stale">
          Parado {prazo ? `— passou do prazo de ${prazo} dias` : `há mais de ${diasAlerta} dias`}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {emEstoqueOuReservado && (
          <>
            {aparelho.status === 'em_estoque' ? (
              <Button variant="secondary" size="sm" onClick={() => onAlterarStatus('reservado')}>
                Reservar
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => onAlterarStatus('em_estoque')}>
                Voltar ao estoque
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={() => onAlterarStatus('baixado')}>
              Vendido
            </Button>
            <Button variant="danger" size="sm" onClick={() => onAlterarStatus('perdido_danificado')}>
              Perdido/danificado
            </Button>
          </>
        )}
        {aparelho.status === 'vendido' && (
          <Button variant="secondary" size="sm" onClick={() => onAlterarStatus('devolvido')}>
            Registrar devolução
          </Button>
        )}
        {(aparelho.status === 'baixado' || aparelho.status === 'devolvido' || aparelho.status === 'perdido_danificado') && (
          <Button variant="secondary" size="sm" onClick={() => onAlterarStatus('em_estoque')}>
            Desfazer — voltar ao estoque
          </Button>
        )}
      </div>
    </li>
  )
}
