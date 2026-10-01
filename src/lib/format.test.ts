import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { formatBRL } from './format'

describe('formatBRL', () => {
  it('formata number', () => {
    expect(formatBRL(1234.5)).toBe('R$ 1.234,50')
  })

  it('formata string decimal exata (sem erro de ponto flutuante)', () => {
    expect(formatBRL('0.1')).toBe('R$ 0,10')
  })

  it('formata Decimal diretamente, sem o chamador precisar converter', () => {
    expect(formatBRL(new Decimal('2500.00').minus('1235.00'))).toBe('R$ 1.265,00')
  })
})
