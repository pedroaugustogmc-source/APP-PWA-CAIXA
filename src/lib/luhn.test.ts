import { describe, expect, it } from 'vitest'
import { imeiValido, luhnValido } from './luhn'

describe('luhnValido', () => {
  it('aceita um número com dígito verificador Luhn correto', () => {
    expect(luhnValido('352562041506190')).toBe(true)
  })

  it('rejeita o mesmo número com o último dígito alterado', () => {
    expect(luhnValido('352562041506191')).toBe(false)
  })

  it('aceita o exemplo clássico de cartão de teste (Luhn)', () => {
    expect(luhnValido('4532015112830366')).toBe(true)
  })

  it('rejeita string vazia', () => {
    expect(luhnValido('')).toBe(false)
  })

  it('rejeita string com caractere não numérico', () => {
    expect(luhnValido('35256204150619a')).toBe(false)
  })
})

describe('imeiValido', () => {
  it('aceita 15 dígitos com Luhn correto', () => {
    expect(imeiValido('352562041506190')).toBe(true)
  })

  it('rejeita menos de 15 dígitos mesmo com Luhn correto', () => {
    expect(imeiValido('79927398713')).toBe(false)
  })

  it('rejeita mais de 15 dígitos', () => {
    expect(imeiValido('3525620415061900')).toBe(false)
  })

  it('rejeita 15 dígitos com Luhn incorreto', () => {
    expect(imeiValido('352562041506191')).toBe(false)
  })
})
