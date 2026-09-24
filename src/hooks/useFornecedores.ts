import { supabase } from '../lib/supabase'
import type { Fornecedor } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

export interface FornecedorInput {
  nome: string
  contato?: string | null
  observacoes?: string | null
}

export function useFornecedores() {
  const { data, loading, error, refetch } = useSupabaseList<Fornecedor>(async () =>
    supabase.from('fornecedores').select('*').order('nome'),
  )

  async function criar(input: FornecedorInput) {
    const { data, error } = await supabase.from('fornecedores').insert(input).select().single()
    if (!error) await refetch()
    return { error: error?.message ?? null, fornecedor: (data as Fornecedor | null) ?? undefined }
  }

  async function remover(id: string) {
    const { error } = await supabase.from('fornecedores').delete().eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  return { fornecedores: data, loading, error, criar, remover, refetch }
}
