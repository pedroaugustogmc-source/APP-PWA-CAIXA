import { useItens } from '../hooks/useItens'
import { toCsv, downloadCsv, type CsvColumn } from '../lib/csv'
import { todayISO } from '../lib/calculations'
import type { ItemCalculado } from '../types/domain'

const itemColunas: CsvColumn<ItemCalculado>[] = [
  { key: 'nome', label: 'Produto', value: (i) => i.nome },
  { key: 'categoria', label: 'Categoria', value: (i) => i.categoria?.nome ?? '' },
  { key: 'fornecedor', label: 'Fornecedor', value: (i) => i.fornecedor?.nome ?? '' },
  { key: 'condicao', label: 'Condição', value: (i) => i.condicao },
  { key: 'status', label: 'Status', value: (i) => i.status },
  { key: 'data_compra', label: 'Data da compra', value: (i) => i.data_compra },
  { key: 'custo_compra', label: 'Custo de compra', value: (i) => i.custo_compra },
  {
    key: 'custos_extras',
    label: 'Despesas extras',
    value: (i) => i.custos_extras.map((c) => `${c.label}: ${c.valor}`).join(' | '),
  },
  { key: 'custo_total', label: 'Custo total', value: (i) => i.custo_total },
  { key: 'dias_planejados', label: 'Prazo planejado (dias)', value: (i) => i.dias_planejados },
  { key: 'data_venda', label: 'Data da venda', value: (i) => i.data_venda },
  { key: 'preco_venda', label: 'Preço de venda', value: (i) => i.preco_venda },
  { key: 'plataforma', label: 'Plataforma', value: (i) => i.plataforma?.nome ?? '' },
  { key: 'lucro_liquido', label: 'Lucro líquido', value: (i) => i.lucro_liquido },
  { key: 'margem_pct', label: 'Margem', value: (i) => i.margem_pct },
  { key: 'roi_pct', label: 'ROI', value: (i) => i.roi_pct },
  { key: 'dias_em_estoque', label: 'Dias em estoque', value: (i) => i.dias_em_estoque },
  { key: 'observacoes', label: 'Observações', value: (i) => i.observacoes },
]

export function ExportDataSection() {
  const { itens } = useItens()

  function exportar() {
    downloadCsv(`catira-itens-${todayISO()}.csv`, toCsv(itens, itemColunas))
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-1 font-semibold text-slate-900">Backup dos dados</h3>
      <p className="mb-3 text-xs text-slate-500">
        Exporte tudo em CSV de vez em quando — é o registro financeiro do seu negócio.
      </p>
      <button
        type="button"
        onClick={exportar}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
      >
        Exportar itens
      </button>
    </section>
  )
}
