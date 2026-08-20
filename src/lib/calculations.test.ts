import { describe, expect, it } from 'vitest'
import {
  custoTotalLote,
  custoUnitario,
  lucroLiquidoItem,
  lucroLiquidoNegocio,
  margemPct,
  precoMinimo,
  roiPct,
  taxaPlataformaValor,
} from './calculations'

// "Exemplo completo" da especificação — os números têm que bater exatamente.
describe('Exemplo completo da especificação', () => {
  const lote = { custo_produto: 150, custo_frete: 20, custo_extra: 10, quantidade_comprada: 10 }

  it('custo_total_lote = R$180', () => {
    expect(custoTotalLote(lote)).toBe(180)
  })

  it('custo_unitario = R$18,00', () => {
    expect(custoUnitario(lote)).toBe(18)
  })

  const precoVenda = 45
  const taxaPct = 0.12
  const custoUnit = custoUnitario(lote)

  it('taxa_plataforma_valor = R$5,40', () => {
    expect(taxaPlataformaValor(precoVenda, taxaPct)).toBeCloseTo(5.4, 10)
  })

  const lucro = lucroLiquidoItem(precoVenda, taxaPct, custoUnit)

  it('lucro_liquido = R$21,60', () => {
    expect(lucro).toBeCloseTo(21.6, 10)
  })

  it('margem = 48%', () => {
    expect(margemPct(lucro, precoVenda)).toBeCloseTo(0.48, 10)
  })

  it('roi = 120%', () => {
    expect(roiPct(lucro, custoUnit)).toBeCloseTo(1.2, 10)
  })

  it('preco_minimo = R$20,45', () => {
    expect(precoMinimo(custoUnit, taxaPct)).toBeCloseTo(20.45, 2)
  })
})

describe('Regras de negócio', () => {
  it('lucro pode ser negativo', () => {
    const lucro = lucroLiquidoItem(15, 0.12, 18) // preco_venda abaixo do custo
    expect(lucro).toBeLessThan(0)
  })

  it('despesas gerais e perdas reduzem o lucro do negócio', () => {
    const resultado = lucroLiquidoNegocio({
      itensVendidos: [{ lucro_liquido: 21.6 }, { lucro_liquido: 21.6 }],
      despesas: [{ valor: 10 }],
      itensPerdidos: [{ custo_unitario: 18 }],
    })
    // 21.6 + 21.6 - 10 - 18 = 15.2
    expect(resultado).toBeCloseTo(15.2, 10)
  })
})
