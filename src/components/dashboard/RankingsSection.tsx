import type { MargemPorFornecedor, MargemPorPlataforma, PerdasKpi } from '../../lib/dashboard'
import { RankedMargemList } from '../RankedMargemList'
import { formatBRL } from '../../lib/format'
import { Card, CardLabel } from '../Card'

interface Props {
  porPlataforma: MargemPorPlataforma[]
  porFornecedor: MargemPorFornecedor[]
  perdas: PerdasKpi
}

export function RankingsSection({ porPlataforma, porFornecedor, perdas }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardLabel>Canal de venda mais lucrativo</CardLabel>
          <RankedMargemList
            itens={porPlataforma.map((p) => ({
              key: p.plataforma_id ?? 'sem-plataforma',
              nome: p.plataforma_nome,
              margem_media: p.margem_media,
              quantidade: p.quantidade_vendida,
            }))}
          />
        </Card>
        <Card>
          <CardLabel>Fornecedor mais lucrativo</CardLabel>
          <RankedMargemList
            itens={porFornecedor.map((f) => ({
              key: f.fornecedor_id ?? 'sem-fornecedor',
              nome: f.fornecedor_nome,
              margem_media: f.margem_media,
              quantidade: f.quantidade_vendida,
            }))}
          />
        </Card>
      </div>

      <Card>
        <p className="mb-1 text-xs font-medium text-slate-500">Perdas/danos do período</p>
        <p className="text-sm text-slate-700">
          {perdas.quantidade} {perdas.quantidade === 1 ? 'item perdido' : 'itens perdidos'} · impacto de{' '}
          <span className="font-semibold text-loss">{formatBRL(perdas.valor_total)}</span> no lucro
        </p>
      </Card>
    </div>
  )
}
