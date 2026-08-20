import { supabase } from '../lib/supabase'
import type { CategoriaDespesaTipo, DespesaGeral } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

export interface DespesaInput {
  data: string
  categoria_despesa: CategoriaDespesaTipo
  descricao: string | null
  valor: number
}

export function useDespesas() {
  const { data, loading, error, refetch } = useSupabaseList<DespesaGeral>(async () =>
    supabase.from('despesas_gerais').select('*').order('data', { ascending: false }),
  )

  async function criar(input: DespesaInput) {
    const { error } = await supabase.from('despesas_gerais').insert(input)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function remover(id: string) {
    const { error } = await supabase.from('despesas_gerais').delete().eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  return { despesas: data, loading, error, criar, remover, refetch }
}
