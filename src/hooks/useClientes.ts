import { supabase } from '../lib/supabase'
import type { Cliente } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

export interface ClienteInput {
  nome: string
  contato: string | null
  cpf: string | null
  email: string | null
  observacoes: string | null
}

export function useClientes() {
  const { data, loading, error, refetch } = useSupabaseList<Cliente>(async () =>
    supabase.from('clientes').select('*').order('nome'),
  )

  async function criar(input: ClienteInput) {
    const { data, error } = await supabase.from('clientes').insert(input).select().single()
    if (!error) await refetch()
    return { error: error?.message ?? null, cliente: (data as Cliente | null) ?? undefined }
  }

  async function editar(id: string, input: ClienteInput) {
    const { error } = await supabase.from('clientes').update(input).eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function remover(id: string) {
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  /** Importação CSV: um insert por linha — uma linha problemática nunca derruba as demais. */
  async function importarVarios(inputs: ClienteInput[]) {
    const resultados: { index: number; error: string | null }[] = []
    for (const [i, input] of inputs.entries()) {
      const { error } = await supabase.from('clientes').insert(input)
      resultados.push({ index: i, error: error?.message ?? null })
    }
    await refetch()
    return resultados
  }

  return { clientes: data, loading, error, criar, editar, remover, importarVarios, refetch }
}
