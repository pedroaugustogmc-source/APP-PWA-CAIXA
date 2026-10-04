import { describe, expect, it } from 'vitest'
import {
  kpiAparelhosParados,
  kpiCapitalPresoEmEstoque,
  kpiGiroEstoqueMedio,
  kpiLucro,
  kpiMargemPorModelo,
  kpiReceitaTotal,
  kpiTicketMedio,
  kpiVariacaoLucroMesAnterior,
  periodoMesAnterior,
  periodoMesAtual,
  periodoSemanaAtual,
} from './dashboard'
import type { Acessorio, Aparelho, VendaCompleta } from '../types/domain'

function aparelho(overrides: Partial<Aparelho> = {}): Aparelho {
  return {
    id: 'ap-1',
    user_id: 'u1',
    loja_id: 'l1',
    nome: 'iPhone 13',
    categoria_id: null,
    fornecedor_id: null,
    identificador: null,
    modelo: 'iPhone 13',
    cor: null,
    capacidade_gb: null,
    bateria_saude: null,
    imei: '352562041506190',
    imei2: null,
    condicao: 'seminovo',
    status: 'em_estoque',
    data_compra: '2026-01-01',
    custo_compra: 1000,
    custos_extras: [],
    dias_planejados: null,
    observacoes: null,
    preco_sugerido: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function venda(overrides: Partial<VendaCompleta> = {}): VendaCompleta {
  return {
    id: 'v1',
    user_id: 'u1',
    loja_id: 'l1',
    vendedor_user_id: 'u1',
    cliente_id: null,
    cliente_nome: null,
    cliente_contato: null,
    status: 'concluida',
    comissao_vendedor_pct: null,
    comissao_vendedor_valor: 0,
    observacoes: null,
    data_venda: '2026-01-15',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
    itens: [],
    pagamentos: [],
    tradeIn: null,
    ...overrides,
  }
}

const itemAparelhoVendido = {
  id: 'vi-1',
  venda_id: 'v1',
  user_id: 'u1',
  loja_id: 'l1',
  aparelho_id: 'ap-1',
  acessorio_id: null,
  quantidade: 1,
  preco_unitario: 2500,
  custo_unitario_snapshot: 1200,
  created_at: '2026-01-15T00:00:00Z',
  aparelho: aparelho({ data_compra: '2026-01-01' }),
  acessorio: null,
}

describe('periodoMesAtual / periodoMesAnterior / periodoSemanaAtual', () => {
  it('mês atual cobre do dia 1 ao último dia do mês', () => {
    expect(periodoMesAtual('2026-02-15')).toEqual({ inicio: '2026-02-01', fim: '2026-02-28' })
  })

  it('mês anterior cruza a virada de ano corretamente', () => {
    expect(periodoMesAnterior('2026-01-15')).toEqual({ inicio: '2025-12-01', fim: '2025-12-31' })
  })

  it('semana atual cobre domingo a sábado', () => {
    // 2026-01-15 é uma quinta-feira
    const { inicio, fim } = periodoSemanaAtual('2026-01-15')
    expect(inicio).toBe('2026-01-11')
    expect(fim).toBe('2026-01-17')
  })
})

describe('kpiLucro / kpiReceitaTotal / kpiTicketMedio', () => {
  const vendas = [venda({ itens: [itemAparelhoVendido], pagamentos: [{ id: 'p1', venda_id: 'v1', user_id: 'u1', loja_id: 'l1', forma: 'pix', valor: 2500, parcelas: 1, taxa_pct: 0, taxa_valor: 0, created_at: '' }] })]

  it('lucro = margem somada das vendas concluídas no período', () => {
    expect(kpiLucro(vendas, periodoMesAtual('2026-01-20')).toFixed(2)).toBe('1300.00')
  })

  it('vendas canceladas não entram no lucro', () => {
    const comCancelada = [...vendas, venda({ id: 'v2', status: 'cancelada', itens: [itemAparelhoVendido] })]
    expect(kpiLucro(comCancelada, periodoMesAtual('2026-01-20')).toFixed(2)).toBe('1300.00')
  })

  it('receita total soma preço x quantidade dos itens', () => {
    expect(kpiReceitaTotal(vendas).toFixed(2)).toBe('2500.00')
  })

  it('ticket médio = receita total / número de vendas', () => {
    expect(kpiTicketMedio(vendas).toFixed(2)).toBe('2500.00')
  })

  it('ticket médio é zero sem vendas no período', () => {
    expect(kpiTicketMedio(vendas, { inicio: '2099-01-01', fim: '2099-01-31' }).toFixed(2)).toBe('0.00')
  })
})

describe('kpiVariacaoLucroMesAnterior', () => {
  it('null quando o mês anterior não teve lucro', () => {
    const vendas = [venda({ data_venda: '2026-02-10', itens: [itemAparelhoVendido] })]
    expect(kpiVariacaoLucroMesAnterior(vendas, '2026-02-20')).toBe(null)
  })

  it('calcula a variação percentual entre os dois meses', () => {
    const vendas = [
      venda({ id: 'v1', data_venda: '2026-02-10', itens: [{ ...itemAparelhoVendido, preco_unitario: 3000 }] }),
      venda({ id: 'v2', data_venda: '2026-01-10', itens: [itemAparelhoVendido] }),
    ]
    // fev: margem 1800 (3000-1200); jan: margem 1300 (2500-1200) -> variação = 500/1300
    const variacao = kpiVariacaoLucroMesAnterior(vendas, '2026-02-20')
    expect(variacao).not.toBeNull()
    expect(variacao!.toFixed(4)).toBe((500 / 1300).toFixed(4))
  })
})

describe('kpiGiroEstoqueMedio', () => {
  it('média de dias entre compra e venda, só itens com aparelho', () => {
    const vendas = [venda({ itens: [itemAparelhoVendido] })]
    // compra 2026-01-01, venda 2026-01-15 -> 14 dias
    expect(kpiGiroEstoqueMedio(vendas)).toBe(14)
  })

  it('zero sem vendas de aparelho', () => {
    expect(kpiGiroEstoqueMedio([])).toBe(0)
  })
})

describe('kpiCapitalPresoEmEstoque', () => {
  it('soma custo dos aparelhos em estoque/reservado + acessórios, ignorando vendidos', () => {
    const aparelhos = [
      aparelho({ id: 'a1', status: 'em_estoque', custo_compra: 1000 }),
      aparelho({ id: 'a2', status: 'reservado', custo_compra: 500 }),
      aparelho({ id: 'a3', status: 'vendido', custo_compra: 9999 }),
    ]
    const acessorios: Acessorio[] = [
      {
        id: 'ac1',
        user_id: 'u1',
        loja_id: 'l1',
        sku: 'CAP-1',
        nome: 'Capinha',
        categoria_id: null,
        fornecedor_id: null,
        custo_unitario: 10,
        preco_venda: 25,
        quantidade_estoque: 4,
        estoque_minimo: 0,
        observacoes: null,
        created_at: '',
        updated_at: '',
      },
    ]
    const resultado = kpiCapitalPresoEmEstoque(aparelhos, acessorios)
    expect(resultado.aparelhos.toFixed(2)).toBe('1500.00')
    expect(resultado.acessorios.toFixed(2)).toBe('40.00')
    expect(resultado.total.toFixed(2)).toBe('1540.00')
  })
})

describe('kpiMargemPorModelo', () => {
  it('agrupa por modelo e ordena do maior pro menor margem média', () => {
    const vendas = [
      venda({ itens: [{ ...itemAparelhoVendido, preco_unitario: 2000, custo_unitario_snapshot: 1000 }] }), // 50%
      venda({
        id: 'v2',
        itens: [{ ...itemAparelhoVendido, aparelho: aparelho({ modelo: 'iPhone 11' }), preco_unitario: 1000, custo_unitario_snapshot: 900 }],
      }), // 10%
    ]
    const ranking = kpiMargemPorModelo(vendas)
    expect(ranking[0]!.nome).toBe('iPhone 13')
    expect(ranking[0]!.margem_media).toBeCloseTo(0.5)
    expect(ranking[1]!.nome).toBe('iPhone 11')
    expect(ranking[1]!.margem_media).toBeCloseTo(0.1)
  })
})

describe('kpiAparelhosParados', () => {
  it('usa o prazo planejado do próprio aparelho quando definido', () => {
    const parado = aparelho({ id: 'a1', data_compra: '2026-01-01', dias_planejados: 5 })
    const dentroDoPrazo = aparelho({ id: 'a2', data_compra: '2026-01-01', dias_planejados: 60 })
    const resultado = kpiAparelhosParados([parado, dentroDoPrazo], 30, '2026-01-20')
    expect(resultado.map((a) => a.id)).toEqual(['a1'])
  })

  it('cai no limite padrão quando o aparelho não tem prazo próprio', () => {
    const semPrazo = aparelho({ id: 'a1', data_compra: '2026-01-01', dias_planejados: null })
    expect(kpiAparelhosParados([semPrazo], 10, '2026-01-20')).toHaveLength(1)
    expect(kpiAparelhosParados([semPrazo], 60, '2026-01-20')).toHaveLength(0)
  })

  it('ignora aparelhos já vendidos/baixados', () => {
    const vendido = aparelho({ id: 'a1', status: 'vendido', data_compra: '2026-01-01', dias_planejados: 1 })
    expect(kpiAparelhosParados([vendido], 1, '2026-01-20')).toHaveLength(0)
  })
})
