import { supabase } from '../lib/supabase'
import type { Acessorio, Categoria, Fornecedor } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

type AcessorioRow = Acessorio & { categoria: Categoria | null; fornecedor: Fornecedor | null }

export interface AcessorioInput {
  sku: string
  nome: string
  categoria_id: string | null
  fornecedor_id: string | null
  custo_unitario: number
  preco_venda: number
  quantidade_estoque: number
  estoque_minimo: number
  observacoes: string | null
}

export function useAcessorios() {
  const { data, loading, error, refetch } = useSupabaseList<AcessorioRow>(async () =>
    supabase.from('acessorios').select('*, categoria:categorias(*), fornecedor:fornecedores(*)').order('nome'),
  )

  async function criar(input: AcessorioInput) {
    const { data, error } = await supabase.from('acessorios').insert(input).select().single()
    if (!error) await refetch()
    return { error: error?.message ?? null, acessorio: (data as Acessorio | null) ?? undefined }
  }

  async function editar(id: string, input: AcessorioInput) {
    const { error } = await supabase.from('acessorios').update(input).eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function remover(id: string) {
    const { error } = await supabase.from('acessorios').delete().eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  return { acessorios: data, loading, error, criar, editar, remover, refetch }
}
