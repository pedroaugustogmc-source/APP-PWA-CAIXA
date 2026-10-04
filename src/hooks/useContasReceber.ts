import { supabase } from '../lib/supabase'
import type { ContaReceber } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

export interface ContaReceberInput {
  venda_id: string | null
  cliente_nome: string | null
  cliente_contato: string | null
  descricao: string
  valor: number
  data_vencimento: string
  observacoes: string | null
}

export function useContasReceber() {
  const { data, loading, error, refetch } = useSupabaseList<ContaReceber>(async () =>
    supabase.from('contas_receber').select('*').order('data_vencimento'),
  )

  async function criar(input: ContaReceberInput) {
    const { error } = await supabase.from('contas_receber').insert(input)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function editar(id: string, input: ContaReceberInput) {
    const { error } = await supabase.from('contas_receber').update(input).eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  /** data_recebimento sempre acompanha a mudança de status — o CHECK no banco exige: quitada <-> tem data, senão null. */
  async function marcarRecebida(id: string, dataRecebimentoISO: string) {
    const { error } = await supabase
      .from('contas_receber')
      .update({ status: 'quitada', data_recebimento: dataRecebimentoISO })
      .eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function reabrir(id: string) {
    const { error } = await supabase.from('contas_receber').update({ status: 'pendente', data_recebimento: null }).eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function cancelar(id: string) {
    const { error } = await supabase.from('contas_receber').update({ status: 'cancelada', data_recebimento: null }).eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function remover(id: string) {
    const { error } = await supabase.from('contas_receber').delete().eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  return { contas: data, loading, error, criar, editar, marcarRecebida, reabrir, cancelar, remover, refetch }
}
