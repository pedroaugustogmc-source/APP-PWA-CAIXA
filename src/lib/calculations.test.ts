import { describe, expect, it } from 'vitest'
import {
  custoTotalAparelho,
  diasEmEstoque,
  diasEntre,
  precoMinimo,
  taxaPagamentoValor,
  valorAvaliacaoDepreciacaoLinear,
  type CalcularMargemVendaInput,
} from './calculations'
import { calcularMargemVenda } from './calculations'

describe('custoTotalAparelho', () => {
  it('soma custo de compra com todos os custos extras', () => {
    const total = custoTotalAparelho({
      custo_compra: '15',
      custos_extras: [{ label: 'Frete', valor: 3 }],
    })
    expect(total.toFixed(2)).toBe('18.00')
  })

  it('soma múltiplos custos extras', () => {
    const total = custoTotalAparelho({
      custo_compra: 100,
      custos_extras: [
        { label: 'Frete', valor: 15 },
        { label: 'Embalagem', valor: 5 },
      ],
    })
    expect(total.toFixed(2)).toBe('120.00')
  })

  it('funciona sem custos extras', () => {
    const total = custoTotalAparelho({ custo_compra: 50, custos_extras: [] })
    expect(total.toFixed(2)).toBe('50.00')
  })
})

describe('precoMinimo (break-even)', () => {
  it('preco_minimo = custo_total / (1 - taxa_pct)', () => {
    // Mesmo exemplo da especificação original: custo 18, taxa 12% -> 20.45
    expect(precoMinimo('18', '0.12').toFixed(2)).toBe('20.45')
  })

  it('com taxa zero, preco_minimo = custo_total', () => {
    expect(precoMinimo('100', 0).toFixed(2)).toBe('100.00')
  })
})

describe('taxaPagamentoValor', () => {
  it('calcula a taxa da forma de pagamento, arredondada a 2 casas', () => {
    // R$1.000,00 a 3.5% = R$35,00
    expect(taxaPagamentoValor('1000', '0.035').toFixed(2)).toBe('35.00')
  })

  it('taxa zero dá valor zero', () => {
    expect(taxaPagamentoValor('1200', 0).toFixed(2)).toBe('0.00')
  })
})

describe('diasEntre / diasEmEstoque', () => {
  it('diasEntre conta dias corridos entre duas datas ISO', () => {
    expect(diasEntre('2026-01-01', '2026-01-10')).toBe(9)
  })

  it('diasEmEstoque usa a data de referência explícita quando fornecida (aparelho vendido)', () => {
    expect(diasEmEstoque('2026-01-01', '2026-01-15')).toBe(14)
  })

  it('diasEmEstoque nunca é negativo', () => {
    expect(diasEmEstoque('2026-01-15', '2026-01-01')).toBe(0)
  })
})

describe('valorAvaliacaoDepreciacaoLinear (trade-in de vendas)', () => {
  it('aplica depreciação linear sobre o valor base', () => {
    // R$5.000 base, 2% ao mês, 10 meses de uso -> 5000 * (1 - 0.02*10) = 4000
    expect(valorAvaliacaoDepreciacaoLinear('5000', '0.02', 10).toFixed(2)).toBe('4000.00')
  })

  it('nunca fica negativo mesmo com muitos meses de uso', () => {
    expect(valorAvaliacaoDepreciacaoLinear('1000', '0.05', 100).toFixed(2)).toBe('0.00')
  })

  it('zero meses de uso devolve o valor base inteiro', () => {
    expect(valorAvaliacaoDepreciacaoLinear('3000', '0.03', 0).toFixed(2)).toBe('3000.00')
  })
})

describe('calcularMargemVenda — critério de aceite da Fase 1 (trade-in + 2 pagamentos)', () => {
  // Aparelho custo R$1.200,00, vendido por R$2.500,00; trade-in avaliado em
  // R$300,00; pagamento 1 = R$1.200,00 dinheiro (taxa 0%); pagamento 2 =
  // R$1.000,00 cartão (taxa 3,5% -> taxa_valor R$35,00).
  const input: CalcularMargemVendaInput = {
    itens: [{ precoUnitario: '2500', custoUnitario: '1200', quantidade: 1 }],
    pagamentos: [
      { valor: '1200', taxaPct: '0' },
      { valor: '1000', taxaPct: '0.035' },
    ],
    tradeIns: [{ valorAvaliacao: '300' }],
    comissaoVendedorValor: '0',
  }
  const resultado = calcularMargemVenda(input)

  it('receita total = R$2.500,00', () => {
    expect(resultado.receitaTotal.toFixed(2)).toBe('2500.00')
  })

  it('custo total = R$1.200,00', () => {
    expect(resultado.custoTotal.toFixed(2)).toBe('1200.00')
  })

  it('taxas total = R$35,00', () => {
    expect(resultado.taxasTotal.toFixed(2)).toBe('35.00')
  })

  it('pagamentos (R$2.200,00) + trade-in (R$300,00) batem exatamente com a receita (R$2.500,00)', () => {
    expect(resultado.bateComReceita).toBe(true)
  })

  it('margem = receita - custo - taxas - comissão = R$1.265,00', () => {
    expect(resultado.margemVenda.toFixed(2)).toBe('1265.00')
  })

  it('com comissão do vendedor, a margem reduz exatamente pelo valor da comissão', () => {
    const comComissao = calcularMargemVenda({ ...input, comissaoVendedorValor: '100' })
    expect(comComissao.margemVenda.toFixed(2)).toBe('1165.00')
  })

  it('detecta quando pagamentos + trade-in NÃO batem com a receita', () => {
    const quebrado = calcularMargemVenda({
      ...input,
      pagamentos: [{ valor: '1200', taxaPct: '0' }], // falta o segundo pagamento
    })
    expect(quebrado.bateComReceita).toBe(false)
  })

  it('suporta múltiplos itens (aparelho + acessório com quantidade)', () => {
    const multiItem = calcularMargemVenda({
      itens: [
        { precoUnitario: '2000', custoUnitario: '1000', quantidade: 1 },
        { precoUnitario: '50', custoUnitario: '20', quantidade: 2 },
      ],
      pagamentos: [{ valor: '2100', taxaPct: '0' }],
      tradeIns: [],
      comissaoVendedorValor: '0',
    })
    // receita: 2000 + 50*2 = 2100; custo: 1000 + 20*2 = 1040
    expect(multiItem.receitaTotal.toFixed(2)).toBe('2100.00')
    expect(multiItem.custoTotal.toFixed(2)).toBe('1040.00')
    expect(multiItem.margemVenda.toFixed(2)).toBe('1060.00')
  })

  it('nenhum float no caminho monetário: soma repetida de 0.1 não gera erro de arredondamento', () => {
    const resultado = calcularMargemVenda({
      itens: [{ precoUnitario: '0.3', custoUnitario: '0', quantidade: 1 }],
      pagamentos: [
        { valor: '0.1', taxaPct: '0' },
        { valor: '0.1', taxaPct: '0' },
        { valor: '0.1', taxaPct: '0' },
      ],
      tradeIns: [],
      comissaoVendedorValor: '0',
    })
    expect(resultado.bateComReceita).toBe(true)
    expect(resultado.margemVenda.toFixed(2)).toBe('0.30')
  })
})
