import type Decimal from 'decimal.js'
import { dentroDoPeriodo, vendasNoPeriodo, type PeriodoFiltro } from './dashboard'
import { somar } from './money'
import { todayISO } from './calculations'
import type { ContaPagar, ContaReceber, StatusConta, VendaCompleta } from '../types/domain'

/**
 * Fase 3 (financeiro). "Atrasada" NUNCA é lido de uma coluna — é sempre
 * derivado aqui (pendente + vencimento no passado), espelhando a decisão já
 * tomada no schema (migrations 0022/0023): evita um status que precisa de
 * job pra ficar em dia e pode dessincronizar.
 */
export function isContaAtrasada(
  conta: { status: StatusConta; data_vencimento: string },
  hojeISO = todayISO(),
): boolean {
  return conta.status === 'pendente' && conta.data_vencimento < hojeISO
}

export interface ResumoContas {
  totalPendente: Decimal
  totalAtrasado: Decimal
  quantidadeAtrasada: number
}

export function resumoContas<T extends { status: StatusConta; valor: number; data_vencimento: string }>(
  contas: T[],
  hojeISO = todayISO(),
): ResumoContas {
  const pendentes = contas.filter((c) => c.status === 'pendente')
  const atrasadas = pendentes.filter((c) => isContaAtrasada(c, hojeISO))
  return {
    totalPendente: somar(pendentes.map((c) => c.valor)),
    totalAtrasado: somar(atrasadas.map((c) => c.valor)),
    quantidadeAtrasada: atrasadas.length,
  }
}

export interface FluxoCaixa {
  entrou: Decimal
  saiu: Decimal
  saldo: Decimal
}

/**
 * Fluxo de caixa real: dinheiro que de fato entrou/saiu do caixa no
 * período — pagamentos de vendas (venda_pagamentos, não a receita bruta dos
 * itens) + contas a receber quitadas, menos contas a pagar quitadas.
 * Trade-in não entra (é troca de mercadoria, não dinheiro).
 */
export function kpiFluxoCaixa(
  vendas: VendaCompleta[],
  contasReceber: ContaReceber[],
  contasPagar: ContaPagar[],
  periodo?: PeriodoFiltro,
): FluxoCaixa {
  const entradaPagamentos = somar(vendasNoPeriodo(vendas, periodo).flatMap((v) => v.pagamentos.map((p) => p.valor)))
  const entradaContasReceber = somar(
    contasReceber
      .filter((c) => c.status === 'quitada' && c.data_recebimento && dentroDoPeriodo(c.data_recebimento, periodo))
      .map((c) => c.valor),
  )
  const saidaContasPagar = somar(
    contasPagar
      .filter((c) => c.status === 'quitada' && c.data_pagamento && dentroDoPeriodo(c.data_pagamento, periodo))
      .map((c) => c.valor),
  )
  const entrou = entradaPagamentos.plus(entradaContasReceber)
  const saiu = saidaContasPagar
  return { entrou, saiu, saldo: entrou.minus(saiu) }
}
