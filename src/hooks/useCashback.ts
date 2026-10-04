import type Decimal from 'decimal.js'
import { supabase } from '../lib/supabase'
import { toMoney } from '../lib/money'
import type { CashbackLancamento } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

export interface SaldoCashbackCliente {
  cliente_contato: string
  saldo: Decimal
}

/**
 * Ledger append-only (ver migration 0024) — saldo nunca é lido de uma coluna
 * cacheada, sempre recalculado aqui a partir dos lançamentos. Resgate passa
 * pelo RPC phoneitz_resgatar_cashback, que valida saldo disponível de forma
 * atômica no banco (nunca confiar só na validação client-side).
 */
export function useCashback() {
  const { data, loading, error, refetch } = useSupabaseList<CashbackLancamento>(async () =>
    supabase.from('cashback_lancamentos').select('*').order('created_at', { ascending: false }),
  )

  function saldoDoCliente(clienteContato: string): Decimal {
    return data
      .filter((l) => l.cliente_contato === clienteContato)
      .reduce((acc, l) => (l.tipo === 'credito' ? acc.plus(l.valor) : acc.minus(l.valor)), toMoney(0))
  }

  const saldosPorCliente: SaldoCashbackCliente[] = [...new Set(data.map((l) => l.cliente_contato))]
    .map((cliente_contato) => ({ cliente_contato, saldo: saldoDoCliente(cliente_contato) }))
    .filter((s) => !s.saldo.isZero())
    .sort((a, b) => b.saldo.comparedTo(a.saldo))

  async function creditar(clienteContato: string, valor: number, observacoes: string | null = null) {
    const { error } = await supabase
      .from('cashback_lancamentos')
      .insert({ cliente_contato: clienteContato, tipo: 'credito', valor, observacoes })
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function resgatar(clienteContato: string, valor: number, observacoes: string | null = null) {
    const { error } = await supabase.rpc('phoneitz_resgatar_cashback', {
      p_cliente_contato: clienteContato,
      p_valor: valor,
      p_observacoes: observacoes ?? undefined,
    })
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  return { lancamentos: data, loading, error, saldosPorCliente, saldoDoCliente, creditar, resgatar, refetch }
}
