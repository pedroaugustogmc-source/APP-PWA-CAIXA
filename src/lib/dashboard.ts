import type Decimal from 'decimal.js'
import { calcularMargemVenda, custoTotalAparelho, diasEntre, todayISO } from './calculations'
import { somar, toMoney } from './money'
import type { Acessorio, Aparelho, VendaCompleta } from '../types/domain'

/**
 * KPIs do dashboard, todos derivados aqui a partir de vendas/aparelhos —
 * nenhuma fórmula duplicada em página/componente. Venda é a fonte da
 * verdade pra tudo que envolve dinheiro (ver 0018/0019); aparelho isolado só
 * entra pra capital parado em estoque e alerta de item parado.
 */

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

/** Semana corrente (domingo a sábado) contendo a data de referência. */
export function periodoSemanaAtual(referencia = todayISO()): PeriodoFiltro {
  const data = new Date(`${referencia}T00:00:00`)
  const domingo = new Date(data)
  domingo.setDate(data.getDate() - data.getDay())
  const sabado = new Date(domingo)
  sabado.setDate(domingo.getDate() + 6)
  return { inicio: domingo.toISOString().slice(0, 10), fim: sabado.toISOString().slice(0, 10) }
}

function dentroDoPeriodo(dataISO: string, periodo?: PeriodoFiltro): boolean {
  if (!periodo) return true
  return dataISO >= periodo.inicio && dataISO <= periodo.fim
}

export function vendasNoPeriodo(vendas: VendaCompleta[], periodo?: PeriodoFiltro): VendaCompleta[] {
  return vendas.filter((v) => v.status === 'concluida' && dentroDoPeriodo(v.data_venda, periodo))
}

function margemDaVenda(venda: VendaCompleta): Decimal {
  return calcularMargemVenda({
    itens: venda.itens.map((item) => ({
      precoUnitario: item.preco_unitario,
      custoUnitario: item.custo_unitario_snapshot,
      quantidade: item.quantidade,
    })),
    pagamentos: venda.pagamentos.map((p) => ({ valor: p.valor, taxaPct: p.taxa_pct })),
    tradeIns: venda.tradeIn ? [{ valorAvaliacao: venda.tradeIn.valor_avaliacao }] : [],
    comissaoVendedorValor: venda.comissao_vendedor_valor,
  }).margemVenda
}

/** KPI — lucro líquido (margem somada) das vendas concluídas no período. */
export function kpiLucro(vendas: VendaCompleta[], periodo?: PeriodoFiltro): Decimal {
  return somar(vendasNoPeriodo(vendas, periodo).map((v) => margemDaVenda(v)))
}

export function kpiReceitaTotal(vendas: VendaCompleta[], periodo?: PeriodoFiltro): Decimal {
  return somar(
    vendasNoPeriodo(vendas, periodo).flatMap((v) => v.itens.map((i) => toMoney(i.preco_unitario).times(i.quantidade))),
  )
}

export function kpiTicketMedio(vendas: VendaCompleta[], periodo?: PeriodoFiltro): Decimal {
  const doPeriodo = vendasNoPeriodo(vendas, periodo)
  if (doPeriodo.length === 0) return toMoney(0)
  return kpiReceitaTotal(vendas, periodo).dividedBy(doPeriodo.length)
}

/** KPI — variação % do lucro do mês vs. mês anterior (null se o mês anterior não teve lucro). */
export function kpiVariacaoLucroMesAnterior(vendas: VendaCompleta[], referencia = todayISO()): number | null {
  const mesAtual = kpiLucro(vendas, periodoMesAtual(referencia))
  const mesAnterior = kpiLucro(vendas, periodoMesAnterior(referencia))
  if (mesAnterior.isZero()) return null
  return mesAtual.minus(mesAnterior).dividedBy(mesAnterior.abs()).toNumber()
}

/** KPI — giro de estoque: média de dias entre compra e venda, só itens serializados (aparelhos). */
export function kpiGiroEstoqueMedio(vendas: VendaCompleta[]): number {
  const dias: number[] = []
  for (const venda of vendas) {
    if (venda.status !== 'concluida') continue
    for (const item of venda.itens) {
      if (item.aparelho) dias.push(diasEntre(item.aparelho.data_compra, venda.data_venda))
    }
  }
  if (dias.length === 0) return 0
  return dias.reduce((a, b) => a + b, 0) / dias.length
}

export interface CapitalParado {
  aparelhos: Decimal
  acessorios: Decimal
  total: Decimal
}

/** KPI — capital preso em estoque (aparelhos em_estoque/reservado + acessórios), não realizado ainda. */
export function kpiCapitalPresoEmEstoque(aparelhos: Aparelho[], acessorios: Acessorio[]): CapitalParado {
  const emEstoque = aparelhos.filter((a) => a.status === 'em_estoque' || a.status === 'reservado')
  const valorAparelhos = somar(emEstoque.map((a) => custoTotalAparelho(a)))
  const valorAcessorios = somar(acessorios.map((a) => toMoney(a.custo_unitario).times(a.quantidade_estoque)))
  return { aparelhos: valorAparelhos, acessorios: valorAcessorios, total: valorAparelhos.plus(valorAcessorios) }
}

export interface MargemPorModelo {
  key: string
  nome: string
  margem_media: number
  quantidade: number
}

/**
 * KPI — margem média (%) por modelo de aparelho / nome de acessório, dos
 * itens já vendidos. Margem por item ignora taxa de pagamento e comissão
 * (atributos da venda inteira, não do item) — é um ranking de produto, não
 * o cálculo de margem final da venda (esse é `calcularMargemVenda`).
 */
export function kpiMargemPorModelo(vendas: VendaCompleta[]): MargemPorModelo[] {
  const grupos = new Map<string, { nome: string; margens: number[] }>()
  for (const venda of vendas) {
    if (venda.status !== 'concluida') continue
    for (const item of venda.itens) {
      if (toMoney(item.preco_unitario).isZero()) continue
      const nome = item.aparelho?.modelo ?? item.acessorio?.nome ?? 'Item removido'
      const key = item.aparelho ? `aparelho:${nome}` : `acessorio:${nome}`
      const margemPct = toMoney(item.preco_unitario).minus(item.custo_unitario_snapshot).dividedBy(item.preco_unitario).toNumber()
      const grupo = grupos.get(key) ?? { nome, margens: [] }
      grupo.margens.push(margemPct)
      grupos.set(key, grupo)
    }
  }
  return [...grupos.entries()]
    .map(([key, { nome, margens }]) => ({
      key,
      nome,
      margem_media: margens.reduce((a, b) => a + b, 0) / margens.length,
      quantidade: margens.length,
    }))
    .sort((a, b) => b.margem_media - a.margem_media)
}

/** KPI — aparelhos em estoque/reservado além do prazo (próprio ou padrão da loja). */
export function kpiAparelhosParados(aparelhos: Aparelho[], diasLimitePadrao: number, hojeISO = todayISO()): Aparelho[] {
  return aparelhos.filter((a) => {
    if (a.status !== 'em_estoque' && a.status !== 'reservado') return false
    const limite = a.dias_planejados ?? diasLimitePadrao
    return diasEntre(a.data_compra, hojeISO) > limite
  })
}
