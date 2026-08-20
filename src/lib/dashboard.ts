import type { Categoria, DespesaGeral, ItemCalculado, LoteCalculado } from '../types/domain'
import { lucroLiquidoNegocio, media, soma, todayISO } from './calculations'

/** KPIs 1–8 do dashboard, todos derivados aqui — nenhuma fórmula duplicada em página/componente. */

export interface PeriodoFiltro {
  inicio: string
  fim: string
}

export function periodoMesAtual(referencia = todayISO()): PeriodoFiltro {
  const [ano, mes] = referencia.split('-')
  const inicio = `${ano}-${mes}-01`
  const ultimoDia = new Date(Number(ano), Number(mes), 0).getDate()
  const fim = `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}`
  return { inicio, fim }
}

export function periodoMesAnterior(referencia = todayISO()): PeriodoFiltro {
  const [anoStr, mesStr] = referencia.split('-')
  const ano = Number(anoStr)
  const mes = Number(mesStr)
  const mesAnterior = mes === 1 ? 12 : mes - 1
  const anoAnterior = mes === 1 ? ano - 1 : ano
  return periodoMesAtual(`${anoAnterior}-${String(mesAnterior).padStart(2, '0')}-01`)
}

function dentroDoPeriodo(dataISO: string, periodo?: PeriodoFiltro): boolean {
  if (!periodo) return true
  return dataISO >= periodo.inicio && dataISO <= periodo.fim
}

export function itensVendidosNoPeriodo(itens: ItemCalculado[], periodo?: PeriodoFiltro): ItemCalculado[] {
  return itens.filter((i) => i.status === 'vendido' && i.data_venda !== null && dentroDoPeriodo(i.data_venda, periodo))
}

export function itensPerdidosNoPeriodo(itens: ItemCalculado[], periodo?: PeriodoFiltro): ItemCalculado[] {
  // perdido_danificado não tem data própria; usamos a data em que o status mudou.
  return itens.filter(
    (i) => i.status === 'perdido_danificado' && dentroDoPeriodo(i.updated_at.slice(0, 10), periodo),
  )
}

export function despesasNoPeriodo(despesas: DespesaGeral[], periodo?: PeriodoFiltro): DespesaGeral[] {
  return despesas.filter((d) => dentroDoPeriodo(d.data, periodo))
}

export function lotesNoPeriodo(lotes: LoteCalculado[], periodo?: PeriodoFiltro): LoteCalculado[] {
  return lotes.filter((l) => dentroDoPeriodo(l.data_compra, periodo))
}

/** KPI 1 — lucro líquido do negócio no período. */
export function kpiLucroNegocio(itens: ItemCalculado[], despesas: DespesaGeral[], periodo?: PeriodoFiltro): number {
  return lucroLiquidoNegocio({
    itensVendidos: itensVendidosNoPeriodo(itens, periodo),
    despesas: despesasNoPeriodo(despesas, periodo),
    itensPerdidos: itensPerdidosNoPeriodo(itens, periodo),
  })
}

/** KPI 1 (série) — lucro líquido do negócio, mês a mês. */
export interface LucroPorMes {
  mes: string
  lucro: number
}

export function kpiLucroPorMes(itens: ItemCalculado[], despesas: DespesaGeral[]): LucroPorMes[] {
  const meses = new Set<string>()
  for (const item of itens) {
    if (item.status === 'vendido' && item.data_venda) meses.add(item.data_venda.slice(0, 7))
    if (item.status === 'perdido_danificado') meses.add(item.updated_at.slice(0, 7))
  }
  for (const despesa of despesas) meses.add(despesa.data.slice(0, 7))

  return [...meses].sort().map((mes) => ({
    mes,
    lucro: kpiLucroNegocio(itens, despesas, { inicio: `${mes}-01`, fim: `${mes}-31` }),
  }))
}

/** KPI 2 — margem média por categoria (itens vendidos). */
export interface MargemPorCategoria {
  categoria_id: string | null
  categoria_nome: string
  margem_media: number
  quantidade_vendida: number
}

export function kpiMargemPorCategoria(itens: ItemCalculado[], categorias: Categoria[]): MargemPorCategoria[] {
  const vendidos = itens.filter((i) => i.status === 'vendido' && i.margem_pct !== null)
  const grupos = new Map<string | null, ItemCalculado[]>()
  for (const item of vendidos) {
    const catId = item.lote.categoria_id
    grupos.set(catId, [...(grupos.get(catId) ?? []), item])
  }
  return [...grupos.entries()]
    .map(([catId, doGrupo]) => ({
      categoria_id: catId,
      categoria_nome: categorias.find((c) => c.id === catId)?.nome ?? 'Sem categoria',
      margem_media: media(doGrupo.map((i) => i.margem_pct ?? 0)),
      quantidade_vendida: doGrupo.length,
    }))
    .sort((a, b) => b.margem_media - a.margem_media)
}

/** KPI 3 — giro de estoque médio: média de dias até vender. */
export function kpiGiroEstoqueMedio(itens: ItemCalculado[]): number {
  const vendidos = itens.filter((i) => i.status === 'vendido' && i.dias_em_estoque !== null)
  return media(vendidos.map((i) => i.dias_em_estoque ?? 0))
}

/** KPI 4 — capital investido (total histórico) vs. capital preso em estoque não vendido. */
export interface CapitalKpi {
  investido_total: number
  preso_em_estoque: number
}

export function kpiCapital(lotes: LoteCalculado[], itens: ItemCalculado[]): CapitalKpi {
  const investido_total = soma(lotes.map((l) => l.custo_total_lote))
  const emEstoque = itens.filter((i) => i.status === 'em_estoque' || i.status === 'reservado')
  const preso_em_estoque = soma(emEstoque.map((i) => i.custo_unitario))
  return { investido_total, preso_em_estoque }
}

/** KPI 5 — ROI médio geral. */
export function kpiRoiMedioGeral(itens: ItemCalculado[]): number {
  const vendidos = itens.filter((i) => i.status === 'vendido' && i.roi_pct !== null)
  return media(vendidos.map((i) => i.roi_pct ?? 0))
}

/** KPI 6 — top 5 itens mais lucrativos / mais parados. */
export function kpiTop5MaisLucrativos(itens: ItemCalculado[]): ItemCalculado[] {
  return [...itens]
    .filter((i) => i.status === 'vendido')
    .sort((a, b) => (b.lucro_liquido ?? 0) - (a.lucro_liquido ?? 0))
    .slice(0, 5)
}

export function kpiTop5MaisParados(itens: ItemCalculado[]): ItemCalculado[] {
  return [...itens]
    .filter((i) => i.status === 'em_estoque' || i.status === 'reservado')
    .sort((a, b) => (b.dias_em_estoque ?? 0) - (a.dias_em_estoque ?? 0))
    .slice(0, 5)
}

/** KPI 7 — itens parados há mais de X dias (configurável). */
export function kpiAlertaEstoqueParado(itens: ItemCalculado[], diasLimite: number): ItemCalculado[] {
  return itens.filter(
    (i) => (i.status === 'em_estoque' || i.status === 'reservado') && (i.dias_em_estoque ?? 0) > diasLimite,
  )
}

/** KPI 8 — fluxo de caixa do período: quanto entrou (líquido) vs. quanto saiu. */
export interface FluxoCaixa {
  entrou: number
  saiu: number
  saldo: number
}

export function kpiFluxoCaixa(
  itens: ItemCalculado[],
  despesas: DespesaGeral[],
  lotes: LoteCalculado[],
  periodo?: PeriodoFiltro,
): FluxoCaixa {
  const vendidosPeriodo = itensVendidosNoPeriodo(itens, periodo)
  const entrou = soma(vendidosPeriodo.map((i) => (i.preco_venda ?? 0) - (i.taxa_plataforma_valor ?? 0)))

  const despesasPeriodo = despesasNoPeriodo(despesas, periodo)
  const lotesPeriodo = lotesNoPeriodo(lotes, periodo)
  const saiu = soma(despesasPeriodo.map((d) => d.valor)) + soma(lotesPeriodo.map((l) => l.custo_total_lote))

  return { entrou, saiu, saldo: entrou - saiu }
}
