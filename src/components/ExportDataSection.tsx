import { useMemo } from 'react'
import { useLotes } from '../hooks/useLotes'
import { useItens } from '../hooks/useItens'
import { useDespesas } from '../hooks/useDespesas'
import { useCategorias } from '../hooks/useCategorias'
import { toCsv, downloadCsv, type CsvColumn } from '../lib/csv'
import { todayISO } from '../lib/calculations'
import type { LoteCalculado, ItemCalculado, DespesaGeral } from '../types/domain'

const loteColunas: CsvColumn<LoteCalculado>[] = [
  { key: 'data_compra', label: 'Data da compra', value: (l) => l.data_compra },
  { key: 'categoria', label: 'Categoria', value: (l) => l.categoria?.nome ?? '' },
  { key: 'fornecedor', label: 'Fornecedor', value: (l) => l.fornecedor?.nome ?? '' },
  { key: 'quantidade_comprada', label: 'Quantidade comprada', value: (l) => l.quantidade_comprada },
  { key: 'custo_produto', label: 'Custo produto', value: (l) => l.custo_produto },
  { key: 'custo_frete', label: 'Custo frete', value: (l) => l.custo_frete },
  { key: 'custo_extra', label: 'Custo extra', value: (l) => l.custo_extra },
  { key: 'custo_total_lote', label: 'Custo total do lote', value: (l) => l.custo_total_lote },
  { key: 'custo_unitario', label: 'Custo unitário', value: (l) => l.custo_unitario },
  { key: 'quantidade_em_estoque', label: 'Quantidade em estoque', value: (l) => l.quantidade_em_estoque },
  { key: 'quantidade_vendida', label: 'Quantidade vendida', value: (l) => l.quantidade_vendida },
  { key: 'observacoes', label: 'Observações', value: (l) => l.observacoes },
]

const despesaColunas: CsvColumn<DespesaGeral>[] = [
  { key: 'data', label: 'Data', value: (d) => d.data },
  { key: 'categoria_despesa', label: 'Categoria', value: (d) => d.categoria_despesa },
  { key: 'descricao', label: 'Descrição', value: (d) => d.descricao },
  { key: 'valor', label: 'Valor', value: (d) => d.valor },
]

export function ExportDataSection() {
  const { lotes } = useLotes()
  const { itens } = useItens()
  const { despesas } = useDespesas()
  const { categorias } = useCategorias()

  const categoriaPorId = useMemo(() => new Map(categorias.map((c) => [c.id, c.nome])), [categorias])

  const itemColunas: CsvColumn<ItemCalculado>[] = useMemo(
    () => [
      { key: 'identificador', label: 'Identificador', value: (i) => i.identificador },
      { key: 'categoria', label: 'Categoria', value: (i) => categoriaPorId.get(i.lote.categoria_id ?? '') ?? '' },
      { key: 'condicao', label: 'Condição', value: (i) => i.condicao },
      { key: 'status', label: 'Status', value: (i) => i.status },
      { key: 'data_venda', label: 'Data da venda', value: (i) => i.data_venda },
      { key: 'preco_venda', label: 'Preço de venda', value: (i) => i.preco_venda },
      { key: 'plataforma', label: 'Plataforma', value: (i) => i.plataforma?.nome ?? '' },
      { key: 'custo_unitario', label: 'Custo unitário', value: (i) => i.custo_unitario },
      { key: 'lucro_liquido', label: 'Lucro líquido', value: (i) => i.lucro_liquido },
      { key: 'margem_pct', label: 'Margem', value: (i) => i.margem_pct },
      { key: 'roi_pct', label: 'ROI', value: (i) => i.roi_pct },
      { key: 'dias_em_estoque', label: 'Dias em estoque', value: (i) => i.dias_em_estoque },
      { key: 'observacoes', label: 'Observações', value: (i) => i.observacoes },
    ],
    [categoriaPorId],
  )

  function exportar<T>(nome: string, dados: T[], colunas: CsvColumn<T>[]) {
    downloadCsv(`catira-${nome}-${todayISO()}.csv`, toCsv(dados, colunas))
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-1 font-semibold text-slate-900">Backup dos dados</h3>
      <p className="mb-3 text-xs text-slate-500">
        Exporte tudo em CSV de vez em quando — é o registro financeiro do seu negócio.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => exportar('lotes', lotes, loteColunas)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          Exportar lotes
        </button>
        <button
          type="button"
          onClick={() => exportar('itens', itens, itemColunas)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          Exportar itens
        </button>
        <button
          type="button"
          onClick={() => exportar('despesas', despesas, despesaColunas)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          Exportar despesas
        </button>
      </div>
    </section>
  )
}
