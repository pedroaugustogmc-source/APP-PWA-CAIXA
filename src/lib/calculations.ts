import type { Categoria, CustoExtra, Fornecedor, Item, ItemCalculado, Plataforma } from '../types/domain'

/**
 * Fonte única da verdade para todos os cálculos financeiros do app.
 * Nenhum componente deve reimplementar estas fórmulas — sempre importar daqui.
 */

export function somaCustosExtras(extras: CustoExtra[]): number {
  return extras.reduce((acc, extra) => acc + extra.valor, 0)
}

export function custoTotalItem(item: Pick<Item, 'custo_compra' | 'custos_extras'>): number {
  return item.custo_compra + somaCustosExtras(item.custos_extras)
}

export function taxaPlataformaValor(precoVenda: number, taxaPlataformaPct: number): number {
  return precoVenda * taxaPlataformaPct
}

export function lucroLiquidoItem(precoVenda: number, taxaPlataformaPct: number, custoTotal: number): number {
  return precoVenda - taxaPlataformaValor(precoVenda, taxaPlataformaPct) - custoTotal
}

export function margemPct(lucroLiquido: number, precoVenda: number): number {
  if (precoVenda === 0) return 0
  return lucroLiquido / precoVenda
}

export function roiPct(lucroLiquido: number, custoTotal: number): number {
  if (custoTotal === 0) return 0
  return lucroLiquido / custoTotal
}

/** Preço de venda que zera o lucro (break-even). Abaixo dele, a venda dá prejuízo. */
export function precoMinimo(custoTotal: number, taxaPlataformaPct: number): number {
  return custoTotal / (1 - taxaPlataformaPct)
}

/** Preço de venda que bate a margem alvo, já descontada a taxa da plataforma. */
export function precoSugerido(custoTotal: number, taxaPlataformaPct: number, margemAlvoPct: number): number {
  return custoTotal / (1 - taxaPlataformaPct - margemAlvoPct)
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function diasEntre(dataInicioISO: string, dataFimISO: string): number {
  const inicio = new Date(`${dataInicioISO}T00:00:00`).getTime()
  const fim = new Date(`${dataFimISO}T00:00:00`).getTime()
  return Math.max(0, Math.round((fim - inicio) / 86_400_000))
}

/** Resolve todos os campos calculados de um item a partir dos dados brutos dele. */
export function calcularItem(
  item: Item,
  categoria: Categoria | null,
  fornecedor: Fornecedor | null,
  plataforma: Plataforma | null,
  margemAlvoPct: number,
): ItemCalculado {
  const custoTotal = custoTotalItem(item)
  const vendido = item.status === 'vendido'
  const perdido = item.status === 'perdido_danificado'

  const taxaValor =
    vendido && item.preco_venda !== null && item.taxa_plataforma_pct !== null
      ? taxaPlataformaValor(item.preco_venda, item.taxa_plataforma_pct)
      : null

  const lucro =
    vendido && item.preco_venda !== null && item.taxa_plataforma_pct !== null
      ? lucroLiquidoItem(item.preco_venda, item.taxa_plataforma_pct, custoTotal)
      : null

  const margem = vendido && lucro !== null && item.preco_venda !== null ? margemPct(lucro, item.preco_venda) : null
  const roi = vendido && lucro !== null ? roiPct(lucro, custoTotal) : null

  const dataFimReferencia = vendido && item.data_venda !== null ? item.data_venda : todayISO()
  const diasEmEstoque = perdido ? null : diasEntre(item.data_compra, dataFimReferencia)

  const taxaParaPrecificacao = plataforma?.taxa_padrao_pct ?? item.taxa_plataforma_pct ?? 0
  const emEstoque = item.status === 'em_estoque' || item.status === 'reservado'
  const precoMin = emEstoque ? precoMinimo(custoTotal, taxaParaPrecificacao) : null
  const precoSug = emEstoque ? precoSugerido(custoTotal, taxaParaPrecificacao, margemAlvoPct) : null

  return {
    ...item,
    custo_total: custoTotal,
    taxa_plataforma_valor: taxaValor,
    lucro_liquido: lucro,
    margem_pct: margem,
    roi_pct: roi,
    dias_em_estoque: diasEmEstoque,
    preco_minimo: precoMin,
    preco_sugerido: precoSug,
    categoria,
    fornecedor,
    plataforma,
  }
}

export interface LucroNegocioInput {
  itensVendidos: Pick<ItemCalculado, 'lucro_liquido'>[]
  itensPerdidos: Pick<ItemCalculado, 'custo_total'>[]
}

/** lucro_liquido_negocio(periodo) = soma(lucro dos itens vendidos) − soma(custo_total dos itens perdidos) */
export function lucroLiquidoNegocio({ itensVendidos, itensPerdidos }: LucroNegocioInput): number {
  const somaLucroItens = itensVendidos.reduce((acc, item) => acc + (item.lucro_liquido ?? 0), 0)
  const somaPerdas = itensPerdidos.reduce((acc, item) => acc + item.custo_total, 0)
  return somaLucroItens - somaPerdas
}

export function media(valores: number[]): number {
  if (valores.length === 0) return 0
  return valores.reduce((acc, v) => acc + v, 0) / valores.length
}

export function soma(valores: number[]): number {
  return valores.reduce((acc, v) => acc + v, 0)
}
