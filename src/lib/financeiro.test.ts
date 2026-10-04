import { describe, expect, it } from 'vitest'
import { isContaAtrasada, kpiFluxoCaixa, resumoContas } from './financeiro'
import type { ContaPagar, ContaReceber, VendaCompleta } from '../types/domain'

function contaPagar(overrides: Partial<ContaPagar> = {}): ContaPagar {
  return {
    id: 'cp-1',
    user_id: 'u1',
    loja_id: 'l1',
    fornecedor_id: null,
    descricao: 'Aluguel',
    categoria: null,
    valor: 1000,
    data_vencimento: '2026-01-10',
    data_pagamento: null,
    status: 'pendente',
    recorrente: false,
    observacoes: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

function contaReceber(overrides: Partial<ContaReceber> = {}): ContaReceber {
  return {
    id: 'cr-1',
    user_id: 'u1',
    loja_id: 'l1',
    venda_id: null,
    cliente_nome: null,
    cliente_contato: null,
    descricao: 'Parcela',
    valor: 500,
    data_vencimento: '2026-01-10',
    data_recebimento: null,
    status: 'pendente',
    observacoes: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

function venda(overrides: Partial<VendaCompleta> = {}): VendaCompleta {
  return {
    id: 'v1',
    user_id: 'u1',
    loja_id: 'l1',
    vendedor_user_id: 'u1',
    cliente_nome: null,
    cliente_contato: null,
    status: 'concluida',
    comissao_vendedor_pct: null,
    comissao_vendedor_valor: 0,
    observacoes: null,
    data_venda: '2026-01-15',
    created_at: '',
    updated_at: '',
    itens: [],
    pagamentos: [],
    tradeIn: null,
    ...overrides,
  }
}

describe('isContaAtrasada', () => {
  it('pendente com vencimento no passado está atrasada', () => {
    expect(isContaAtrasada({ status: 'pendente', data_vencimento: '2026-01-01' }, '2026-01-10')).toBe(true)
  })

  it('pendente com vencimento no futuro não está atrasada', () => {
    expect(isContaAtrasada({ status: 'pendente', data_vencimento: '2026-02-01' }, '2026-01-10')).toBe(false)
  })

  it('quitada nunca está atrasada, mesmo vencida', () => {
    expect(isContaAtrasada({ status: 'quitada', data_vencimento: '2026-01-01' }, '2026-01-10')).toBe(false)
  })

  it('cancelada nunca está atrasada', () => {
    expect(isContaAtrasada({ status: 'cancelada', data_vencimento: '2026-01-01' }, '2026-01-10')).toBe(false)
  })
})

describe('resumoContas', () => {
  it('soma pendentes e atrasadas separadamente', () => {
    const contas = [
      contaPagar({ id: '1', valor: 100, status: 'pendente', data_vencimento: '2026-01-01' }), // atrasada
      contaPagar({ id: '2', valor: 200, status: 'pendente', data_vencimento: '2026-02-01' }), // não atrasada
      contaPagar({ id: '3', valor: 300, status: 'quitada', data_pagamento: '2026-01-05', data_vencimento: '2026-01-01' }),
      contaPagar({ id: '4', valor: 999, status: 'cancelada', data_vencimento: '2026-01-01' }),
    ]
    const resumo = resumoContas(contas, '2026-01-10')
    expect(resumo.totalPendente.toFixed(2)).toBe('300.00')
    expect(resumo.totalAtrasado.toFixed(2)).toBe('100.00')
    expect(resumo.quantidadeAtrasada).toBe(1)
  })

  it('funciona igual pra contas a receber (mesma forma estrutural)', () => {
    const contas = [contaReceber({ valor: 50, status: 'pendente', data_vencimento: '2025-01-01' })]
    const resumo = resumoContas(contas, '2026-01-10')
    expect(resumo.totalAtrasado.toFixed(2)).toBe('50.00')
  })
})

describe('kpiFluxoCaixa', () => {
  it('entrou = pagamentos de vendas + contas a receber quitadas; saiu = contas a pagar quitadas', () => {
    const vendas = [
      venda({
        data_venda: '2026-01-10',
        pagamentos: [
          { id: 'p1', venda_id: 'v1', user_id: 'u1', loja_id: 'l1', forma: 'pix', valor: 1000, parcelas: 1, taxa_pct: 0, taxa_valor: 0, created_at: '' },
        ],
      }),
    ]
    const contasReceber = [
      contaReceber({ valor: 300, status: 'quitada', data_recebimento: '2026-01-12' }),
      contaReceber({ id: 'cr-2', valor: 9999, status: 'pendente', data_recebimento: null }), // não conta
    ]
    const contasPagar = [
      contaPagar({ valor: 400, status: 'quitada', data_pagamento: '2026-01-11' }),
      contaPagar({ id: 'cp-2', valor: 9999, status: 'pendente', data_pagamento: null }), // não conta
    ]
    const resultado = kpiFluxoCaixa(vendas, contasReceber, contasPagar, { inicio: '2026-01-01', fim: '2026-01-31' })
    expect(resultado.entrou.toFixed(2)).toBe('1300.00')
    expect(resultado.saiu.toFixed(2)).toBe('400.00')
    expect(resultado.saldo.toFixed(2)).toBe('900.00')
  })

  it('trade-in não entra no fluxo de caixa (não é dinheiro)', () => {
    const vendas = [
      venda({
        data_venda: '2026-01-10',
        pagamentos: [
          { id: 'p1', venda_id: 'v1', user_id: 'u1', loja_id: 'l1', forma: 'pix', valor: 500, parcelas: 1, taxa_pct: 0, taxa_valor: 0, created_at: '' },
        ],
        tradeIn: {
          id: 't1', venda_id: 'v1', user_id: 'u1', loja_id: 'l1', aparelho_recebido_id: 'a1', valor_avaliacao: 300, created_at: '',
        },
      }),
    ]
    const resultado = kpiFluxoCaixa(vendas, [], [], { inicio: '2026-01-01', fim: '2026-01-31' })
    expect(resultado.entrou.toFixed(2)).toBe('500.00')
  })

  it('respeita o período informado', () => {
    const vendas = [venda({ data_venda: '2025-12-01', pagamentos: [{ id: 'p1', venda_id: 'v1', user_id: 'u1', loja_id: 'l1', forma: 'pix', valor: 100, parcelas: 1, taxa_pct: 0, taxa_valor: 0, created_at: '' }] })]
    const resultado = kpiFluxoCaixa(vendas, [], [], { inicio: '2026-01-01', fim: '2026-01-31' })
    expect(resultado.entrou.toFixed(2)).toBe('0.00')
  })
})
