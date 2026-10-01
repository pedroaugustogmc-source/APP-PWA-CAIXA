import Decimal from 'decimal.js'

/**
 * Fronteira decimal-safe pra todo valor monetário do PHONEITZ. Regra: todo
 * valor que vem do Supabase vira Decimal aqui, antes de qualquer operação
 * aritmética. Só volta a number/string formatada no limite de exibição
 * (src/lib/format.ts) — nunca no meio de um cálculo. Ver calculations.ts.
 */
Decimal.set({ rounding: Decimal.ROUND_HALF_UP })

export type MoneyInput = number | string | Decimal

export function toMoney(valor: MoneyInput): Decimal {
  return new Decimal(valor)
}

export function somar(valores: MoneyInput[]): Decimal {
  return valores.reduce((acc: Decimal, v) => acc.plus(toMoney(v)), new Decimal(0))
}
