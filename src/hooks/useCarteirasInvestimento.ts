import { supabase } from '../lib/supabase'
import { mensagemErroAmigavel, mensagemErroExclusao } from '../lib/erros'
import type { CarteiraInvestimento, TipoCarteira } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

export function useCarteirasInvestimento() {
  const { data, loading, error, refetch } = useSupabaseList<CarteiraInvestimento>(async () =>
    supabase.from('carteiras_investimento').select('*').order('nome'),
  )

  async function criar(nome: string, tipo: TipoCarteira) {
    const { data, error } = await supabase.from('carteiras_investimento').insert({ nome, tipo }).select().single()
    if (!error) await refetch()
    return { error: mensagemErroAmigavel(error), carteira: (data as CarteiraInvestimento | null) ?? undefined }
  }

  async function remover(id: string) {
    const { error } = await supabase.from('carteiras_investimento').delete().eq('id', id)
    if (!error) await refetch()
    return { error: mensagemErroExclusao(error) }
  }

  return { carteiras: data, loading, error, criar, remover, refetch }
}
