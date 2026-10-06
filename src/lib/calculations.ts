import Decimal from 'decimal.js'
import type { CustoExtra } from '../types/domain'
import { somar, toMoney, type MoneyInput } from './money'

/**
 * Fonte única da verdade para todos os cálculos financeiros do PHONEITZ.
 * Nenhum componente deve reimplementar estas fórmulas — sempre importar
 * daqui. Todo valor monetário é Decimal (ver money.ts); número puro (JS
 * number) só aparece em contagem de dias/meses, nunca em dinheiro.
 */

export function somaCustosExtras(extras: CustoExtra[]): Decimal {
  return somar(extras.map((extra) => extra.valor))
}

export function custoTotalAparelho(aparelho: { custo_compra: MoneyInput; custos_extras: CustoExtra[] }): Decimal {
  return toMoney(aparelho.custo_compra).plus(somaCustosExtras(aparelho.custos_extras))
}

/** Preço de venda que zera o lucro (break-even). Abaixo dele, a venda dá prejuízo. */
export function precoMinimo(custoTotal: MoneyInput, taxaPct: MoneyInput): Decimal {
  return toMoney(custoTotal).dividedBy(toMoney(1).minus(taxaPct))
}

/** Taxa de uma forma de pagamento (ex.: taxa de maquininha), arredondada a 2 casas. */
export function taxaPagamentoValor(valor: MoneyInput, taxaPct: MoneyInput): Decimal {
  return toMoney(valor).times(taxaPct).toDecimalPlaces(2)
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
 * Dias que um aparelho ficou/está em estoque. `dataReferenciaISO` é a data
 * de venda (via join com `vendas.data_venda`) quando o aparelho já foi
 * vendido, ou `todayISO()` quando ainda está em estoque — a venda não vive
 * mais na linha do aparelho (ver supabase/migrations/0015), então o
 * chamador é responsável por resolver essa data.
 */
export function diasEmEstoque(dataCompraISO: string, dataReferenciaISO: string): number {
  return diasEntre(dataCompraISO, dataReferenciaISO)
}

/**
 * Valor de avaliação de trade-in — depreciação LINEAR (não exponencial):
 * decisão deliberada, menos superfície de erro de arredondamento que um
 * expoente fracionário, e cobre o requisito sem complexidade extra.
 */
export function valorAvaliacaoDepreciacaoLinear(
  valorBase: MoneyInput,
  depreciacaoMensalPct: MoneyInput,
  mesesDeUso: number,
): Decimal {
  const depreciado = toMoney(valorBase).times(toMoney(depreciacaoMensalPct).times(mesesDeUso))
  const valor = toMoney(valorBase).minus(depreciado)
  return valor.isNegative() ? new Decimal(0) : valor
}

export interface ItemVendaInput {
  precoUnitario: MoneyInput
  custoUnitario: MoneyInput
  quantidade: number
}

export interface PagamentoVendaInput {
  valor: MoneyInput
  taxaPct: MoneyInput
}

export interface TradeInInput {
  valorAvaliacao: MoneyInput
}

export interface CalcularMargemVendaInput {
  itens: ItemVendaInput[]
  pagamentos: PagamentoVendaInput[]
  tradeIns: TradeInInput[]
  comissaoVendedorValor: MoneyInput
}

export interface ResultadoMargemVenda {
  receitaTotal: Decimal
  custoTotal: Decimal
  taxasTotal: Decimal
  margemVenda: Decimal
  somaPagamentosETradeIns: Decimal
  /** true quando pagamentos + trade-ins cobrem exatamente a receita total. */
  bateComReceita: boolean
}

/**
 * Espelha no client a mesma regra de negócio que o RPC `concluir_venda`
 * aplica no banco (ver supabase/migrations/0019) — usado pra prévia da
 * venda na UI (NovaVendaWizard) antes de confirmar. O RPC é a fonte da
 * verdade final; esta função nunca decide sozinha se a venda é aceita.
 *
 * Trade-in é forma de QUITAÇÃO do preço (como um pagamento), não desconto
 * da margem: margem só depende do que foi vendido, nunca de como foi pago.
 */
export function calcularMargemVenda(input: CalcularMargemVendaInput): ResultadoMargemVenda {
  const receitaTotal = somar(input.itens.map((item) => toMoney(item.precoUnitario).times(item.quantidade)))
  const custoTotal = somar(input.itens.map((item) => toMoney(item.custoUnitario).times(item.quantidade)))
  const taxasTotal = somar(input.pagamentos.map((p) => taxaPagamentoValor(p.valor, p.taxaPct)))
  const somaPagamentos = somar(input.pagamentos.map((p) => p.valor))
  const somaTradeIns = somar(input.tradeIns.map((t) => t.valorAvaliacao))
  const somaPagamentosETradeIns = somaPagamentos.plus(somaTradeIns)

  const margemVenda = receitaTotal.minus(custoTotal).minus(taxasTotal).minus(toMoney(input.comissaoVendedorValor))

  return {
    receitaTotal,
    custoTotal,
    taxasTotal,
    margemVenda,
    somaPagamentosETradeIns,
    bateComReceita: somaPagamentosETradeIns.equals(receitaTotal),
  }
}
