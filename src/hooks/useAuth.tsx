import type { Session } from '@supabase/supabase-js'
import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { senhaVazada } from '../lib/senhaVazada'

export type LojaStatus = 'ociosa' | 'preparando' | 'pronta' | 'erro'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  lojaStatus: LojaStatus
  tentarNovamenteLoja: () => void
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null; precisaConfirmarEmail: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Toda tabela de dado novo (aparelhos, acessorios, vendas...) tem loja_id not
// null default phoneitz_current_loja_id() — sem a linha em `lojas`, todo
// INSERT falha. RPC é idempotente (ON CONFLICT DO NOTHING), então retry
// simples resolve blip de rede sem risco de duplicar.
const TENTATIVAS_GARANTIR_LOJA = 3
const ATRASOS_MS = [500, 1500, 4000]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [lojaStatus, setLojaStatus] = useState<LojaStatus>('ociosa')
  const userIdPreparado = useRef<string | null>(null)

  async function garantirLoja(userId: string) {
    setLojaStatus('preparando')
    for (let tentativa = 0; tentativa < TENTATIVAS_GARANTIR_LOJA; tentativa++) {
      const { error } = await supabase.rpc('phoneitz_garantir_loja')
      if (!error) {
        userIdPreparado.current = userId
        setLojaStatus('pronta')
        return
      }
      if (tentativa < TENTATIVAS_GARANTIR_LOJA - 1) {
        await new Promise((resolve) => setTimeout(resolve, ATRASOS_MS[tentativa]))
      }
    }
    setLojaStatus('erro')
  }

  function onSessionChange(newSession: Session | null) {
    setSession(newSession)
    if (newSession && userIdPreparado.current !== newSession.user.id) {
      void garantirLoja(newSession.user.id)
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
    if (session) void garantirLoja(session.user.id)
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
    <AuthContext value={{ session, loading, lojaStatus, tentarNovamenteLoja, signIn, signUp, signOut }}>
      {children}
    </AuthContext>
  )
}

export function useAuth() {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
