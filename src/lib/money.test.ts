import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { somar, toMoney } from './money'

describe('toMoney', () => {
  it('aceita number, string e Decimal, sempre devolvendo Decimal', () => {
    expect(toMoney(10.5)).toBeInstanceOf(Decimal)
    expect(toMoney('10.50').toFixed(2)).toBe('10.50')
    expect(toMoney(new Decimal('3.33')).toFixed(2)).toBe('3.33')
  })

  it('não sofre o erro clássico de ponto flutuante (0.1 + 0.2)', () => {
    // 0.1 + 0.2 em float puro dá 0.30000000000000004 — aqui tem que dar exato.
    const resultado = toMoney('0.1').plus(toMoney('0.2'))
    expect(resultado.toFixed(2)).toBe('0.30')
    expect(resultado.equals(new Decimal('0.3'))).toBe(true)
  })
})

describe('somar', () => {
  it('soma uma lista de valores monetários sem perda de precisão', () => {
    const total = somar(['10.10', '20.20', '30.30'])
    expect(total.toFixed(2)).toBe('60.60')
  })

  it('devolve zero para lista vazia', () => {
    expect(somar([]).toFixed(2)).toBe('0.00')
  })

  it('aceita mistura de number, string e Decimal', () => {
    const total = somar([10, '20.5', new Decimal('5.25')])
    expect(total.toFixed(2)).toBe('35.75')
  })
})
