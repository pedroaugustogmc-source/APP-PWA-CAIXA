import { supabase } from '../lib/supabase'
import type { Categoria } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

export function useCategorias() {
  const { data, loading, error, refetch } = useSupabaseList<Categoria>(async () =>
    supabase.from('categorias').select('*').order('nome'),
  )

  async function criar(nome: string) {
    const { error } = await supabase.from('categorias').insert({ nome })
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function remover(id: string) {
    const { error } = await supabase.from('categorias').delete().eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  return { categorias: data, loading, error, criar, remover, refetch }
}
