import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react'
import { definirManterConectado, supabase } from '../lib/supabase'
import { senhaVazada } from '../lib/senhaVazada'

export type LojaStatus = 'ociosa' | 'preparando' | 'pronta' | 'erro' | 'escolher'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  lojaStatus: LojaStatus
  tentarNovamenteLoja: () => void
  criarMinhaLoja: () => Promise<{ error: string | null }>
  vincularComConvite: (codigo: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string, manterConectado?: boolean) => Promise<{ error: string | null }>
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
  // Sempre o user_id da sessão mais recente conhecida, atualizado de forma
  // SÍNCRONA em onSessionChange — ao contrário de `session` (state, só
  // reflete o valor de quando o closure assíncrono foi criado) e de
  // `userIdPreparado` (só muda quando uma verificação TERMINA). Existe só
  // pra verificarVinculo/criarMinhaLoja/vincularComConvite conferirem, DEPOIS
  // de um await, se a sessão ainda é a mesma de quando a chamada começou.
  const sessionUserId = useRef<string | null>(null)

  /**
   * Só verifica se o usuário já tem vínculo (dono de uma loja, ou vendedor
   * com convite aceito) — NUNCA cria loja sozinho. Criar automaticamente
   * aqui quebrava o fluxo de convite: todo usuário novo ganhava uma loja
   * própria já no primeiro login, antes de ter qualquer chance de inserir
   * um código, e phoneitz_aceitar_convite_loja() rejeita quem já é dono de
   * uma loja — ou seja, convite de vendedor nunca funcionava.
   *
   * Bug de corrida encontrado em auditoria: `onSessionChange` pode disparar
   * mais de uma verificação concorrente pro mesmo usuário (ex.: a chamada
   * inicial de `getSession()` e o evento `onAuthStateChange` de
   * INITIAL_SESSION chegam quase juntos), e também pode trocar de usuário
   * (logout seguido de login de outra conta na mesma aba) enquanto uma
   * verificação antiga, mais lenta, ainda está em voo. Sem a checagem de
   * `sessionUserId.current !== userId` abaixo, a resposta tardia de uma
   * verificação para o usuário ANTERIOR sobrescrevia o lojaStatus correto
   * do usuário atual (ex.: deixava 'pronta' um usuário sem loja nenhuma).
   */
  async function verificarVinculo(userId: string) {
    setLojaStatus('preparando')
    for (let tentativa = 0; tentativa < TENTATIVAS; tentativa++) {
      const [{ data: lojaPropria, error: erroLoja }, { data: vinculo, error: erroVinculo }] = await Promise.all([
        supabase.from('lojas').select('id').eq('user_id', userId).maybeSingle(),
        supabase.from('loja_membros').select('id').eq('user_id', userId).not('aceito_em', 'is', null).maybeSingle(),
      ])
      if (sessionUserId.current !== userId) return // sessão trocou enquanto isto estava em voo — descarta o resultado
      if (!erroLoja && !erroVinculo) {
        userIdPreparado.current = userId
        setLojaStatus(lojaPropria || vinculo ? 'pronta' : 'escolher')
        return
      }
      if (tentativa < TENTATIVAS - 1) {
        await new Promise((resolve) => setTimeout(resolve, ATRASOS_MS[tentativa]))
      }
    }
    if (sessionUserId.current === userId) setLojaStatus('erro')
  }

  /**
   * Revalida o vínculo em segundo plano, sem passar por 'preparando' (que
   * derrubaria a tela atual pra um spinner de tela cheia a cada refresh
   * silencioso de token — ver onSessionChange). Só age quando o vínculo
   * FOI REVOGADO: dono removeu o vendedor (MembrosLojaManager/revogarMembro)
   * enquanto a aba dele continuava aberta e autenticada. Sem isto,
   * lojaStatus ficava 'pronta' pra sempre depois da primeira verificação —
   * nenhum evento reavaliava o vínculo de novo pro MESMO usuário — e o
   * vendedor continuava navegando num app que só mostrava telas vazias,
   * porque a RLS (loja_id-based) já bloqueava os dados silenciosamente,
   * sem indicar que o acesso tinha sido revogado.
   */
  async function revalidarVinculoSilenciosamente(userId: string) {
    const [{ data: lojaPropria, error: erroLoja }, { data: vinculo, error: erroVinculo }] = await Promise.all([
      supabase.from('lojas').select('id').eq('user_id', userId).maybeSingle(),
      supabase.from('loja_membros').select('id').eq('user_id', userId).not('aceito_em', 'is', null).maybeSingle(),
    ])
    if (erroLoja || erroVinculo) return // falha pontual de rede — não derruba uma sessão que já estava funcionando
    if (sessionUserId.current !== userId) return
    if (!lojaPropria && !vinculo) {
      userIdPreparado.current = null
      setLojaStatus('escolher')
    }
  }

  async function criarMinhaLoja() {
    const userIdDaChamada = sessionUserId.current
    for (let tentativa = 0; tentativa < TENTATIVAS; tentativa++) {
      const { error } = await supabase.rpc('phoneitz_garantir_loja')
      if (!error) {
        // Só aplica se a sessão ainda for a mesma de quando a chamada
        // começou — ver comentário de verificarVinculo sobre a mesma corrida
        // (aqui: logout, ou troca de usuário, no meio da criação da loja).
        if (sessionUserId.current === userIdDaChamada) {
          userIdPreparado.current = userIdDaChamada
          setLojaStatus('pronta')
        }
        return { error: null }
      }
      if (tentativa < TENTATIVAS - 1) {
        await new Promise((resolve) => setTimeout(resolve, ATRASOS_MS[tentativa]))
      }
    }
    return { error: 'Não foi possível criar sua loja agora. Verifique sua conexão e tente de novo.' }
  }

  async function vincularComConvite(codigo: string) {
    const userIdDaChamada = sessionUserId.current
    const { error } = await supabase.rpc('phoneitz_aceitar_convite_loja', { p_codigo: codigo })
    if (error) return { error: error.message }
    if (sessionUserId.current === userIdDaChamada) {
      userIdPreparado.current = userIdDaChamada
      setLojaStatus('pronta')
    }
    return { error: null }
  }

  function onSessionChange(newSession: Session | null, event?: AuthChangeEvent) {
    sessionUserId.current = newSession?.user.id ?? null
    setSession(newSession)
    if (!newSession) {
      userIdPreparado.current = null
      setLojaStatus('ociosa')
      return
    }
    if (userIdPreparado.current !== newSession.user.id) {
      void verificarVinculo(newSession.user.id)
    } else if (event === 'TOKEN_REFRESHED') {
      void revalidarVinculoSilenciosamente(newSession.user.id)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoading(false)
      onSessionChange(data.session)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      onSessionChange(newSession, event)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  function tentarNovamenteLoja() {
    if (session) void verificarVinculo(session.user.id)
  }

  async function signIn(email: string, password: string, manterConectado = true) {
    // Precisa ser setado ANTES do signIn — é o próprio signInWithPassword que
    // dispara a escrita da sessão no storage, via onAuthStateChange interno
    // do supabase-js.
    definirManterConectado(manterConectado)
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
