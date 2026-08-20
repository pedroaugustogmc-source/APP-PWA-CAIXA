import type { DespesaGeral, Item, ItemCalculado, LoteCompra, Plataforma } from '../types/domain'

/**
 * Fonte única da verdade para todos os cálculos financeiros do app.
 * Nenhum componente deve reimplementar estas fórmulas — sempre importar daqui.
 */

export function custoTotalLote(
  lote: Pick<LoteCompra, 'custo_produto' | 'custo_frete' | 'custo_extra'>,
): number {
  return lote.custo_produto + lote.custo_frete + lote.custo_extra
}

export function custoUnitario(
  lote: Pick<LoteCompra, 'custo_produto' | 'custo_frete' | 'custo_extra' | 'quantidade_comprada'>,
): number {
  return custoTotalLote(lote) / lote.quantidade_comprada
}

export function taxaPlataformaValor(precoVenda: number, taxaPlataformaPct: number): number {
  return precoVenda * taxaPlataformaPct
}

export function lucroLiquidoItem(
  precoVenda: number,
  taxaPlataformaPct: number,
  custoUnitarioValor: number,
): number {
  return precoVenda - taxaPlataformaValor(precoVenda, taxaPlataformaPct) - custoUnitarioValor
}

export function margemPct(lucroLiquido: number, precoVenda: number): number {
  if (precoVenda === 0) return 0
  return lucroLiquido / precoVenda
}

export function roiPct(lucroLiquido: number, custoUnitarioValor: number): number {
  if (custoUnitarioValor === 0) return 0
  return lucroLiquido / custoUnitarioValor
}

/** Preço de venda que zera o lucro (break-even). Abaixo dele, a venda dá prejuízo. */
export function precoMinimo(custoUnitarioValor: number, taxaPlataformaPct: number): number {
  return custoUnitarioValor / (1 - taxaPlataformaPct)
}

/** Preço de venda que bate a margem alvo, já descontada a taxa da plataforma. */
export function precoSugerido(
  custoUnitarioValor: number,
  taxaPlataformaPct: number,
  margemAlvoPct: number,
): number {
  return custoUnitarioValor / (1 - taxaPlataformaPct - margemAlvoPct)
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function diasEntre(dataInicioISO: string, dataFimISO: string): number {
  const inicio = new Date(`${dataInicioISO}T00:00:00`).getTime()
  const fim = new Date(`${dataFimISO}T00:00:00`).getTime()
  return Math.max(0, Math.round((fim - inicio) / 86_400_000))
}

/**
 * Resolve todos os campos "(calc)" de um item a partir dos dados brutos dele
 * e do lote a que pertence. Único ponto do app que combina item + lote.
 */
export function calcularItem(
  item: Item,
  lote: LoteCompra,
  plataforma: Plataforma | null,
  margemAlvoPct: number,
): ItemCalculado {
  const custoUnit = custoUnitario(lote)
  const vendido = item.status === 'vendido'
  const perdido = item.status === 'perdido_danificado'

  const taxaValor =
    vendido && item.preco_venda !== null && item.taxa_plataforma_pct !== null
      ? taxaPlataformaValor(item.preco_venda, item.taxa_plataforma_pct)
      : null

  const lucro =
    vendido && item.preco_venda !== null && item.taxa_plataforma_pct !== null
      ? lucroLiquidoItem(item.preco_venda, item.taxa_plataforma_pct, custoUnit)
      : null

  const margem = vendido && lucro !== null && item.preco_venda !== null ? margemPct(lucro, item.preco_venda) : null
  const roi = vendido && lucro !== null ? roiPct(lucro, custoUnit) : null

  const dataFimReferencia = vendido && item.data_venda !== null ? item.data_venda : todayISO()
  const diasEmEstoque = perdido ? null : diasEntre(lote.data_compra, dataFimReferencia)

  const taxaParaPrecificacao = plataforma?.taxa_padrao_pct ?? item.taxa_plataforma_pct ?? 0
  const emEstoque = item.status === 'em_estoque' || item.status === 'reservado'
  const precoMin = emEstoque ? precoMinimo(custoUnit, taxaParaPrecificacao) : null
  const precoSug = emEstoque ? precoSugerido(custoUnit, taxaParaPrecificacao, margemAlvoPct) : null

  return {
    ...item,
    custo_unitario: custoUnit,
    taxa_plataforma_valor: taxaValor,
    lucro_liquido: lucro,
    margem_pct: margem,
    roi_pct: roi,
    dias_em_estoque: diasEmEstoque,
    preco_minimo: precoMin,
    preco_sugerido: precoSug,
    lote,
    plataforma,
  }
}

export interface LucroNegocioInput {
  itensVendidos: Pick<ItemCalculado, 'lucro_liquido'>[]
  despesas: Pick<DespesaGeral, 'valor'>[]
  itensPerdidos: Pick<ItemCalculado, 'custo_unitario'>[]
}

/**
 * lucro_liquido_negocio(periodo) = soma(lucro dos itens vendidos)
 *   − soma(despesas gerais) − soma(custo_unitario dos itens perdido_danificado)
 */
export function lucroLiquidoNegocio({ itensVendidos, despesas, itensPerdidos }: LucroNegocioInput): number {
  const somaLucroItens = itensVendidos.reduce((acc, item) => acc + (item.lucro_liquido ?? 0), 0)
  const somaDespesas = despesas.reduce((acc, despesa) => acc + despesa.valor, 0)
  const somaPerdas = itensPerdidos.reduce((acc, item) => acc + item.custo_unitario, 0)
  return somaLucroItens - somaDespesas - somaPerdas
}

export function media(valores: number[]): number {
  if (valores.length === 0) return 0
  return valores.reduce((acc, v) => acc + v, 0) / valores.length
}

export function soma(valores: number[]): number {
  return valores.reduce((acc, v) => acc + v, 0)
}
