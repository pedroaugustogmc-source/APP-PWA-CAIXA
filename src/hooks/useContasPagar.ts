import { supabase } from '../lib/supabase'
import type { ContaPagar, Fornecedor } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

type ContaPagarRow = ContaPagar & { fornecedor: Fornecedor | null }

export interface ContaPagarInput {
  fornecedor_id: string | null
  descricao: string
  categoria: string | null
  valor: number
  data_vencimento: string
  recorrente: boolean
  observacoes: string | null
}

export function useContasPagar() {
  const { data, loading, error, refetch } = useSupabaseList<ContaPagarRow>(async () =>
    supabase.from('contas_pagar').select('*, fornecedor:fornecedores(*)').order('data_vencimento'),
  )

  async function criar(input: ContaPagarInput) {
    const { error } = await supabase.from('contas_pagar').insert(input)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function editar(id: string, input: ContaPagarInput) {
    const { error } = await supabase.from('contas_pagar').update(input).eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  /** data_pagamento sempre acompanha a mudança de status — o CHECK no banco exige: quitada <-> tem data, senão null. */
  async function marcarQuitada(id: string, dataPagamentoISO: string) {
    const { error } = await supabase
      .from('contas_pagar')
      .update({ status: 'quitada', data_pagamento: dataPagamentoISO })
      .eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function reabrir(id: string) {
    const { error } = await supabase.from('contas_pagar').update({ status: 'pendente', data_pagamento: null }).eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function cancelar(id: string) {
    const { error } = await supabase.from('contas_pagar').update({ status: 'cancelada', data_pagamento: null }).eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function remover(id: string) {
    const { error } = await supabase.from('contas_pagar').delete().eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  return { contas: data, loading, error, criar, editar, marcarQuitada, reabrir, cancelar, remover, refetch }
}
