import type { MargemPorFornecedor, MargemPorPlataforma, PerdasKpi } from '../../lib/dashboard'
import { RankedMargemList } from '../RankedMargemList'
import { formatBRL } from '../../lib/format'

interface Props {
  porPlataforma: MargemPorPlataforma[]
  porFornecedor: MargemPorFornecedor[]
  perdas: PerdasKpi
}

export function RankingsSection({ porPlataforma, porFornecedor, perdas }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium text-slate-500">Canal de venda mais lucrativo</p>
          <RankedMargemList
            itens={porPlataforma.map((p) => ({
              key: p.plataforma_id ?? 'sem-plataforma',
              nome: p.plataforma_nome,
              margem_media: p.margem_media,
              quantidade: p.quantidade_vendida,
            }))}
          />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium text-slate-500">Fornecedor mais lucrativo</p>
          <RankedMargemList
            itens={porFornecedor.map((f) => ({
              key: f.fornecedor_id ?? 'sem-fornecedor',
              nome: f.fornecedor_nome,
              margem_media: f.margem_media,
              quantidade: f.quantidade_vendida,
            }))}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-1 text-xs font-medium text-slate-500">Perdas/danos do período</p>
        <p className="text-sm text-slate-700">
          {perdas.quantidade} {perdas.quantidade === 1 ? 'item perdido' : 'itens perdidos'} · impacto de{' '}
          <span className="font-semibold text-loss">{formatBRL(perdas.valor_total)}</span> no lucro
        </p>
      </div>
    </div>
  )
}
