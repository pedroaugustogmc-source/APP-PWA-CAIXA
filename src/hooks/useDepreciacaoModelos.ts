import { supabase } from '../lib/supabase'
import type { CondicaoAparelho, DepreciacaoModelo } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

export interface DepreciacaoModeloInput {
  modelo: string
  condicao: CondicaoAparelho
  valor_base: number
  depreciacao_mensal_pct: number
  vigente_desde: string
  observacoes: string | null
}

export function useDepreciacaoModelos() {
  const { data, loading, error, refetch } = useSupabaseList<DepreciacaoModelo>(async () =>
    supabase
      .from('depreciacao_modelos')
      .select('*')
      .order('modelo')
      .order('vigente_desde', { ascending: false }),
  )

  async function criar(input: DepreciacaoModeloInput) {
    const { data, error } = await supabase.from('depreciacao_modelos').insert(input).select().single()
    if (!error) await refetch()
    return { error: error?.message ?? null, depreciacao: (data as DepreciacaoModelo | null) ?? undefined }
  }

  async function editar(id: string, input: DepreciacaoModeloInput) {
    const { error } = await supabase.from('depreciacao_modelos').update(input).eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  async function remover(id: string) {
    const { error } = await supabase.from('depreciacao_modelos').delete().eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  /** Regra vigente mais recente pra modelo+condição, na data de referência (hoje por padrão). */
  function vigente(modelo: string, condicao: CondicaoAparelho, dataReferenciaISO = new Date().toISOString().slice(0, 10)) {
    return data
      .filter((d) => d.modelo === modelo && d.condicao === condicao && d.vigente_desde <= dataReferenciaISO)
      .sort((a, b) => b.vigente_desde.localeCompare(a.vigente_desde))[0]
  }

  return { depreciacoes: data, loading, error, criar, editar, remover, vigente, refetch }
}
