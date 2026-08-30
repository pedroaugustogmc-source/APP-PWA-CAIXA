import { supabase } from '../lib/supabase'
import type { Categoria } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

export function useCategorias() {
  const { data, loading, error, refetch } = useSupabaseList<Categoria>(async () =>
    supabase.from('categorias').select('*').order('nome'),
  )

  async function criar(nome: string) {
    const { data, error } = await supabase.from('categorias').insert({ nome }).select().single()
    if (!error) await refetch()
    return { error: error?.message ?? null, categoria: (data as Categoria | null) ?? undefined }
  }

  async function editar(id: string, nome: string) {
    const { error } = await supabase.from('categorias').update({ nome }).eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function remover(id: string) {
    const { error } = await supabase.from('categorias').delete().eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  return { categorias: data, loading, error, criar, editar, remover, refetch }
}
