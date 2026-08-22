import type { Categoria, Fornecedor, ItemCalculado, Plataforma } from '../types/domain'
import { lucroLiquidoNegocio, media, soma, todayISO } from './calculations'

/** KPIs do dashboard, todos derivados aqui — nenhuma fórmula duplicada em página/componente. */

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

export function itensCompradosNoPeriodo(itens: ItemCalculado[], periodo?: PeriodoFiltro): ItemCalculado[] {
  return itens.filter((i) => dentroDoPeriodo(i.data_compra, periodo))
}

/** KPI — lucro líquido do negócio no período. */
export function kpiLucroNegocio(itens: ItemCalculado[], periodo?: PeriodoFiltro): number {
  return lucroLiquidoNegocio({
    itensVendidos: itensVendidosNoPeriodo(itens, periodo),
    itensPerdidos: itensPerdidosNoPeriodo(itens, periodo),
  })
}

/** KPI (série) — lucro líquido do negócio, mês a mês. */
export interface LucroPorMes {
  mes: string
  lucro: number
}

export function kpiLucroPorMes(itens: ItemCalculado[]): LucroPorMes[] {
  const meses = new Set<string>()
  for (const item of itens) {
    if (item.status === 'vendido' && item.data_venda) meses.add(item.data_venda.slice(0, 7))
    if (item.status === 'perdido_danificado') meses.add(item.updated_at.slice(0, 7))
  }

  return [...meses].sort().map((mes) => ({
    mes,
    lucro: kpiLucroNegocio(itens, { inicio: `${mes}-01`, fim: `${mes}-31` }),
  }))
}

/** KPI — margem média por categoria (itens vendidos). */
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
    grupos.set(item.categoria_id, [...(grupos.get(item.categoria_id) ?? []), item])
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

/** Lucro total (R$) por categoria — usado no gráfico "lucro por categoria". */
export interface LucroPorCategoria {
  categoria_id: string | null
  categoria_nome: string
  lucro_total: number
}

export function kpiLucroPorCategoria(itens: ItemCalculado[], categorias: Categoria[]): LucroPorCategoria[] {
  const vendidos = itens.filter((i) => i.status === 'vendido' && i.lucro_liquido !== null)
  const grupos = new Map<string | null, ItemCalculado[]>()
  for (const item of vendidos) {
    grupos.set(item.categoria_id, [...(grupos.get(item.categoria_id) ?? []), item])
  }
  return [...grupos.entries()]
    .map(([catId, doGrupo]) => ({
      categoria_id: catId,
      categoria_nome: categorias.find((c) => c.id === catId)?.nome ?? 'Sem categoria',
      lucro_total: soma(doGrupo.map((i) => i.lucro_liquido ?? 0)),
    }))
    .sort((a, b) => b.lucro_total - a.lucro_total)
}

/** KPI — giro de estoque médio: média de dias até vender. */
export function kpiGiroEstoqueMedio(itens: ItemCalculado[]): number {
  const vendidos = itens.filter((i) => i.status === 'vendido' && i.dias_em_estoque !== null)
  return media(vendidos.map((i) => i.dias_em_estoque ?? 0))
}

/**
 * KPI — capital investido (total histórico) vs. capital preso em estoque não
 * vendido, decomposto também em realizado (vendido) e perdido.
 * investido_total = realizado + preso_em_estoque + perdido
 */
export interface CapitalKpi {
  investido_total: number
  preso_em_estoque: number
  realizado: number
  perdido: number
}

export function kpiCapital(itens: ItemCalculado[]): CapitalKpi {
  const emEstoque = itens.filter((i) => i.status === 'em_estoque' || i.status === 'reservado')
  const vendidos = itens.filter((i) => i.status === 'vendido')
  const perdidos = itens.filter((i) => i.status === 'perdido_danificado')
  return {
    investido_total: soma(itens.map((i) => i.custo_total)),
    preso_em_estoque: soma(emEstoque.map((i) => i.custo_total)),
    realizado: soma(vendidos.map((i) => i.custo_total)),
    perdido: soma(perdidos.map((i) => i.custo_total)),
  }
}

/** KPI — ROI médio geral. */
export function kpiRoiMedioGeral(itens: ItemCalculado[]): number {
  const vendidos = itens.filter((i) => i.status === 'vendido' && i.roi_pct !== null)
  return media(vendidos.map((i) => i.roi_pct ?? 0))
}

/** KPI — top 5 itens mais lucrativos / mais parados. */
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

/**
 * Critério de "parado": usa o prazo planejado do próprio item quando definido
 * (dias_planejados), senão cai no limite global configurável.
 */
export function isItemParado(
  item: Pick<ItemCalculado, 'status' | 'dias_em_estoque' | 'dias_planejados'>,
  diasLimitePadrao: number,
): boolean {
  const limite = item.dias_planejados ?? diasLimitePadrao
  return (item.status === 'em_estoque' || item.status === 'reservado') && (item.dias_em_estoque ?? 0) > limite
}

/** KPI — itens parados (acima do prazo planejado ou do limite padrão). */
export function kpiAlertaEstoqueParado(itens: ItemCalculado[], diasLimitePadrao: number): ItemCalculado[] {
  return itens.filter((i) => isItemParado(i, diasLimitePadrao))
}

/** KPI — fluxo de caixa do período: quanto entrou (líquido) vs. quanto saiu (compras). */
export interface FluxoCaixa {
  entrou: number
  saiu: number
  saldo: number
}

export function kpiFluxoCaixa(itens: ItemCalculado[], periodo?: PeriodoFiltro): FluxoCaixa {
  const vendidosPeriodo = itensVendidosNoPeriodo(itens, periodo)
  const entrou = soma(vendidosPeriodo.map((i) => (i.preco_venda ?? 0) - (i.taxa_plataforma_valor ?? 0)))

  const compradosPeriodo = itensCompradosNoPeriodo(itens, periodo)
  const saiu = soma(compradosPeriodo.map((i) => i.custo_total))

  return { entrou, saiu, saldo: entrou - saiu }
}

/** KPI — canal de venda mais lucrativo: melhor margem líquida média por plataforma. */
export interface MargemPorPlataforma {
  plataforma_id: string | null
  plataforma_nome: string
  margem_media: number
  quantidade_vendida: number
}

export function kpiMargemPorPlataforma(itens: ItemCalculado[], plataformas: Plataforma[]): MargemPorPlataforma[] {
  const vendidos = itens.filter((i) => i.status === 'vendido' && i.margem_pct !== null)
  const grupos = new Map<string | null, ItemCalculado[]>()
  for (const item of vendidos) {
    grupos.set(item.plataforma_id, [...(grupos.get(item.plataforma_id) ?? []), item])
  }
  return [...grupos.entries()]
    .map(([id, doGrupo]) => ({
      plataforma_id: id,
      plataforma_nome: plataformas.find((p) => p.id === id)?.nome ?? 'Sem plataforma',
      margem_media: media(doGrupo.map((i) => i.margem_pct ?? 0)),
      quantidade_vendida: doGrupo.length,
    }))
    .sort((a, b) => b.margem_media - a.margem_media)
}

/** KPI — fornecedor mais lucrativo: melhor margem líquida média. */
export interface MargemPorFornecedor {
  fornecedor_id: string | null
  fornecedor_nome: string
  margem_media: number
  quantidade_vendida: number
}

export function kpiMargemPorFornecedor(itens: ItemCalculado[], fornecedores: Fornecedor[]): MargemPorFornecedor[] {
  const vendidos = itens.filter((i) => i.status === 'vendido' && i.margem_pct !== null)
  const grupos = new Map<string | null, ItemCalculado[]>()
  for (const item of vendidos) {
    grupos.set(item.fornecedor_id, [...(grupos.get(item.fornecedor_id) ?? []), item])
  }
  return [...grupos.entries()]
    .map(([id, doGrupo]) => ({
      fornecedor_id: id,
      fornecedor_nome: fornecedores.find((f) => f.id === id)?.nome ?? 'Sem fornecedor',
      margem_media: media(doGrupo.map((i) => i.margem_pct ?? 0)),
      quantidade_vendida: doGrupo.length,
    }))
    .sort((a, b) => b.margem_media - a.margem_media)
}

/** KPI — perdas/danos do período e impacto real no lucro. */
export interface PerdasKpi {
  quantidade: number
  valor_total: number
}

export function kpiPerdas(itens: ItemCalculado[], periodo?: PeriodoFiltro): PerdasKpi {
  const perdidos = itensPerdidosNoPeriodo(itens, periodo)
  return { quantidade: perdidos.length, valor_total: soma(perdidos.map((i) => i.custo_total)) }
}

/** KPI — variação % do lucro do mês vs. mês anterior. */
export function kpiVariacaoLucroMesAnterior(itens: ItemCalculado[]): number | null {
  const mesAtual = kpiLucroNegocio(itens, periodoMesAtual())
  const mesAnterior = kpiLucroNegocio(itens, periodoMesAnterior())
  if (mesAnterior === 0) return null
  return (mesAtual - mesAnterior) / Math.abs(mesAnterior)
}
