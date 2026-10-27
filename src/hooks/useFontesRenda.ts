import { supabase } from '../lib/supabase'
import { mensagemErroAmigavel, mensagemErroExclusao } from '../lib/erros'
import { todayISO } from '../lib/calculations'
import type { FonteRenda, FonteRendaValor, FrequenciaRenda, TipoFonteRenda } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

export interface FonteRendaInput {
  nome: string
  tipo: TipoFonteRenda
  frequencia: FrequenciaRenda
  dia_recebimento: number | null
  data_inicio: string
  data_fim: string | null
  observacoes: string | null
}

type FonteRendaRow = FonteRenda & { valores: FonteRendaValor[] }

/** Valor vigente é sempre o de vigente_desde mais recente (mesmo padrão de depreciacao_modelos). */
export function valorVigente(valores: FonteRendaValor[]): FonteRendaValor | undefined {
  return [...valores].sort((a, b) => b.vigente_desde.localeCompare(a.vigente_desde))[0]
}

export function useFontesRenda() {
  const { data, loading, error, refetch } = useSupabaseList<FonteRendaRow>(async () =>
    supabase.from('fontes_renda').select('*, valores:fontes_renda_valores(*)').order('nome'),
  )

  async function criar(input: FonteRendaInput, valorInicial: number) {
    const { data: fonte, error } = await supabase.from('fontes_renda').insert(input).select().single()
    if (error) return { error: mensagemErroAmigavel(error) }
    const { error: erroValor } = await supabase
      .from('fontes_renda_valores')
      .insert({ fonte_renda_id: fonte.id, valor_bruto_esperado: valorInicial, valor_liquido_esperado: valorInicial, vigente_desde: todayISO(), motivo: 'Valor inicial' })
    await refetch()
    return { error: mensagemErroAmigavel(erroValor) }
  }

  async function editar(id: string, input: FonteRendaInput) {
    const { error } = await supabase.from('fontes_renda').update(input).eq('id', id)
    if (!error) await refetch()
    return { error: mensagemErroAmigavel(error) }
  }

  async function registrarNovoValor(fonteRendaId: string, valor: number, motivo: string | null) {
    const { error } = await supabase
      .from('fontes_renda_valores')
      .insert({ fonte_renda_id: fonteRendaId, valor_bruto_esperado: valor, valor_liquido_esperado: valor, vigente_desde: todayISO(), motivo })
    if (!error) await refetch()
    return { error: mensagemErroAmigavel(error) }
  }

  async function remover(id: string) {
    const { error } = await supabase.from('fontes_renda').delete().eq('id', id)
    if (!error) await refetch()
    return { error: mensagemErroExclusao(error) }
  }

  return { fontes: data, loading, error, criar, editar, registrarNovoValor, remover, refetch }
}
