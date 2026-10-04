import { supabase } from '../lib/supabase'
import type { LojaMembro } from '../types/domain'
import { useSupabaseList } from './useSupabaseList'

/**
 * Convite é por código, não por e-mail — criar usuário em auth.users
 * exigiria service_role key, que o client não tem (ver migration 0027). O
 * vendedor cria sua própria conta normal e usa o código pra se vincular.
 * Não há como resolver nome/e-mail de um membro aqui (auth.users não é
 * legível via REST por segurança) — a UI mostra só papel + status.
 */
export function useLojaMembros() {
  const { data, loading, error, refetch } = useSupabaseList<LojaMembro>(async () =>
    supabase.from('loja_membros').select('*').order('created_at'),
  )

  async function criarConvite() {
    const { data, error } = await supabase.rpc('phoneitz_criar_convite_loja')
    if (!error) await refetch()
    return { error: error?.message ?? null, codigo: (data as string | null) ?? undefined }
  }

  async function aceitarConvite(codigo: string) {
    const { data, error } = await supabase.rpc('phoneitz_aceitar_convite_loja', { p_codigo: codigo })
    if (!error) await refetch()
    return { error: error?.message ?? null, lojaId: (data as string | null) ?? undefined }
  }

  async function revogarMembro(id: string) {
    const { error } = await supabase.from('loja_membros').delete().eq('id', id)
    if (!error) await refetch()
    return { error: error?.message ?? null }
  }

  return { membros: data, loading, error, criarConvite, aceitarConvite, revogarMembro, refetch }
}
