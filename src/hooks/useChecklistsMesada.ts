import { supabase } from '../lib/supabase'
import { mensagemErroAmigavel, mensagemErroExclusao } from '../lib/erros'
import { todayISO } from '../lib/calculations'
import type { ChecklistMesada, ChecklistMesadaItem } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

export const DIAS_CHECKLIST_MESADA = 120

type ChecklistRow = ChecklistMesada & { itens: ChecklistMesadaItem[] }

export function useChecklistsMesada() {
  const { data, loading, error, refetch } = useSupabaseList<ChecklistRow>(async () =>
    supabase
      .from('checklists_mesada')
      .select('*, itens:checklist_mesada_itens(*)')
      .order('mes_inicio', { ascending: false }),
  )

  async function criar(nome: string, valorMensal: number) {
    const { data: checklist, error } = await supabase
      .from('checklists_mesada')
      .insert({ nome, mes_inicio: todayISO(), valor_mensal: valorMensal })
      .select()
      .single()
    if (error) return { error: mensagemErroAmigavel(error) }

    const itens = Array.from({ length: DIAS_CHECKLIST_MESADA }, (_, indice) => ({ checklist_id: checklist.id, indice }))
    const { error: erroItens } = await supabase.from('checklist_mesada_itens').insert(itens)
    await refetch()
    return { error: mensagemErroAmigavel(erroItens) }
  }

  async function alternarItem(itemId: string, recebido: boolean) {
    const { error } = await supabase.from('checklist_mesada_itens').update({ recebido }).eq('id', itemId)
    if (!error) await refetch()
    return { error: mensagemErroAmigavel(error) }
  }

  async function remover(id: string) {
    const { error } = await supabase.from('checklists_mesada').delete().eq('id', id)
    if (!error) await refetch()
    return { error: mensagemErroExclusao(error) }
  }

  return { checklists: data, loading, error, criar, alternarItem, remover, refetch }
}
