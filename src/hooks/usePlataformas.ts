import { supabase } from '../lib/supabase'
import type { Plataforma } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

export interface PlataformaInput {
  nome: string
  taxa_padrao_pct: number
}

export function usePlataformas() {
  const { data, loading, error, refetch } = useSupabaseList<Plataforma>(async () =>
    supabase.from('plataformas').select('*').order('nome'),
  )

  async function criar(input: PlataformaInput) {
    const { error } = await supabase.from('plataformas').insert(input)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function remover(id: string) {
    const { error } = await supabase.from('plataformas').delete().eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  return { plataformas: data, loading, error, criar, remover, refetch }
}
