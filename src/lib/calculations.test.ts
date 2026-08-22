import { describe, expect, it } from 'vitest'
import {
  custoTotalItem,
  lucroLiquidoItem,
  lucroLiquidoNegocio,
  margemPct,
  precoMinimo,
  roiPct,
  taxaPlataformaValor,
} from './calculations'

// Mesmo exemplo da especificação original, adaptado pro modelo de custo por
// item: custo de compra R$15 + despesa extra (frete) R$3 = custo total R$18.
// Os números finais têm que bater exatamente com o que a especificação pedia.
describe('Exemplo completo (custo por item)', () => {
  const item = { custo_compra: 15, custos_extras: [{ label: 'Frete', valor: 3 }] }

  it('custo_total = R$18,00', () => {
    expect(custoTotalItem(item)).toBe(18)
  })

  const precoVenda = 45
  const taxaPct = 0.12
  const custoTotal = custoTotalItem(item)

  it('taxa_plataforma_valor = R$5,40', () => {
    expect(taxaPlataformaValor(precoVenda, taxaPct)).toBeCloseTo(5.4, 10)
  })

  const lucro = lucroLiquidoItem(precoVenda, taxaPct, custoTotal)

  it('lucro_liquido = R$21,60', () => {
    expect(lucro).toBeCloseTo(21.6, 10)
  })

  it('margem = 48%', () => {
    expect(margemPct(lucro, precoVenda)).toBeCloseTo(0.48, 10)
  })

  it('roi = 120%', () => {
    expect(roiPct(lucro, custoTotal)).toBeCloseTo(1.2, 10)
  })

  it('preco_minimo = R$20,45', () => {
    expect(precoMinimo(custoTotal, taxaPct)).toBeCloseTo(20.45, 2)
  })
})

describe('Regras de negócio', () => {
  it('lucro pode ser negativo', () => {
    const lucro = lucroLiquidoItem(15, 0.12, 18) // preco_venda abaixo do custo
    expect(lucro).toBeLessThan(0)
  })

  it('custo total soma custo de compra com todos os custos extras', () => {
    const total = custoTotalItem({
      custo_compra: 100,
      custos_extras: [
        { label: 'Frete', valor: 15 },
        { label: 'Embalagem', valor: 5 },
      ],
    })
    expect(total).toBe(120)
  })

  it('perdas reduzem o lucro do negócio pelo custo total do item', () => {
    const resultado = lucroLiquidoNegocio({
      itensVendidos: [{ lucro_liquido: 21.6 }, { lucro_liquido: 21.6 }],
      itensPerdidos: [{ custo_total: 18 }],
    })
    // 21.6 + 21.6 - 18 = 25.2
    expect(resultado).toBeCloseTo(25.2, 10)
  })
})
