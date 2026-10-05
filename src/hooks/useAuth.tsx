import type { Session } from '@supabase/supabase-js'
import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { senhaVazada } from '../lib/senhaVazada'

export type LojaStatus = 'ociosa' | 'preparando' | 'pronta' | 'erro' | 'escolher'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  lojaStatus: LojaStatus
  tentarNovamenteLoja: () => void
  criarMinhaLoja: () => Promise<{ error: string | null }>
  vincularComConvite: (codigo: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null; precisaConfirmarEmail: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Toda tabela de dado novo (aparelhos, acessorios, vendas...) tem loja_id not
// null default phoneitz_current_loja_id() — sem uma linha em `lojas` (dono)
// ou um vínculo aceito em `loja_membros` (vendedor), todo INSERT falha.
// phoneitz_garantir_loja()/phoneitz_aceitar_convite_loja() são idempotentes,
// então retry simples resolve blip de rede sem risco de duplicar.
const TENTATIVAS = 3
const ATRASOS_MS = [500, 1500, 4000]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [lojaStatus, setLojaStatus] = useState<LojaStatus>('ociosa')
  const userIdPreparado = useRef<string | null>(null)

  /**
   * Só verifica se o usuário já tem vínculo (dono de uma loja, ou vendedor
   * com convite aceito) — NUNCA cria loja sozinho. Criar automaticamente
   * aqui quebrava o fluxo de convite: todo usuário novo ganhava uma loja
   * própria já no primeiro login, antes de ter qualquer chance de inserir
   * um código, e phoneitz_aceitar_convite_loja() rejeita quem já é dono de
   * uma loja — ou seja, convite de vendedor nunca funcionava.
   */
  async function verificarVinculo(userId: string) {
    setLojaStatus('preparando')
    for (let tentativa = 0; tentativa < TENTATIVAS; tentativa++) {
      const [{ data: lojaPropria, error: erroLoja }, { data: vinculo, error: erroVinculo }] = await Promise.all([
        supabase.from('lojas').select('id').eq('user_id', userId).maybeSingle(),
        supabase.from('loja_membros').select('id').eq('user_id', userId).not('aceito_em', 'is', null).maybeSingle(),
      ])
      if (!erroLoja && !erroVinculo) {
        userIdPreparado.current = userId
        setLojaStatus(lojaPropria || vinculo ? 'pronta' : 'escolher')
        return
      }
      if (tentativa < TENTATIVAS - 1) {
        await new Promise((resolve) => setTimeout(resolve, ATRASOS_MS[tentativa]))
      }
    }
    setLojaStatus('erro')
  }

  async function criarMinhaLoja() {
    for (let tentativa = 0; tentativa < TENTATIVAS; tentativa++) {
      const { error } = await supabase.rpc('phoneitz_garantir_loja')
      if (!error) {
        if (session) userIdPreparado.current = session.user.id
        setLojaStatus('pronta')
        return { error: null }
      }
      if (tentativa < TENTATIVAS - 1) {
        await new Promise((resolve) => setTimeout(resolve, ATRASOS_MS[tentativa]))
      }
    }
    return { error: 'Não foi possível criar sua loja agora. Verifique sua conexão e tente de novo.' }
  }

  async function vincularComConvite(codigo: string) {
    const { error } = await supabase.rpc('phoneitz_aceitar_convite_loja', { p_codigo: codigo })
    if (error) return { error: error.message }
    if (session) userIdPreparado.current = session.user.id
    setLojaStatus('pronta')
    return { error: null }
  }

  function onSessionChange(newSession: Session | null) {
    setSession(newSession)
    if (newSession && userIdPreparado.current !== newSession.user.id) {
      void verificarVinculo(newSession.user.id)
    } else if (!newSession) {
      userIdPreparado.current = null
      setLojaStatus('ociosa')
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoading(false)
      onSessionChange(data.session)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      onSessionChange(newSession)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  function tentarNovamenteLoja() {
    if (session) void verificarVinculo(session.user.id)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signUp(email: string, password: string) {
    if (await senhaVazada(password)) {
      return {
        error: 'Essa senha já apareceu em vazamentos conhecidos. Escolha outra senha.',
        precisaConfirmarEmail: false,
      }
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null, precisaConfirmarEmail: !error && !data.session }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext
      value={{
        session,
        loading,
        lojaStatus,
        tentarNovamenteLoja,
        criarMinhaLoja,
        vincularComConvite,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext>
  )
}

export function useAuth() {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
