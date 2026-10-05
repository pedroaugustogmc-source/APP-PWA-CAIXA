import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Field, inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { Button } from './Button'

type Modo = 'escolhendo' | 'convite'

/**
 * Tela de primeiro acesso — some usuário ainda não tem loja própria nem
 * vínculo aceito com nenhuma. Decide aqui, antes de qualquer rota
 * protegida renderizar: criar a própria loja (dono) ou entrar com um
 * código de convite (vendedor). Nunca cria loja sozinha — ver useAuth.tsx.
 */
export function EscolherLojaScreen() {
  const { criarMinhaLoja, vincularComConvite, signOut } = useAuth()
  const [modo, setModo] = useState<Modo>('escolhendo')
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleCriarLoja() {
    setSubmitting(true)
    setError(null)
    const { error } = await criarMinhaLoja()
    setSubmitting(false)
    if (error) setError(error)
  }

  async function handleVincular(e: FormEvent) {
    e.preventDefault()
    if (!codigo.trim()) return
    setSubmitting(true)
    setError(null)
    const { error } = await vincularComConvite(codigo.trim())
    setSubmitting(false)
    if (error) setError(error)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
            Pz
          </div>
          <h1 className="text-center text-2xl font-bold text-slate-900">Bem-vindo ao PHONEITZ</h1>
          <p className="mt-1 text-center text-sm text-slate-500">Antes de começar, precisamos saber uma coisa</p>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {modo === 'escolhendo' ? (
            <>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">Você está abrindo sua própria loja?</p>
                <Button variant="primary" fullWidth disabled={submitting} onClick={handleCriarLoja}>
                  {submitting ? 'Criando…' : 'Criar minha loja'}
                </Button>
              </div>

              <div className="relative py-1 text-center text-xs text-slate-400">
                <span className="relative bg-white px-2">ou</span>
                <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-slate-200" />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">Recebeu um código de convite de uma loja?</p>
                <Button variant="secondary" fullWidth onClick={() => setModo('convite')}>
                  Tenho um código de convite
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleVincular} className="space-y-3">
              <Field label="Código de convite">
                <input
                  type="text"
                  autoFocus
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className={inputClass}
                />
              </Field>
              <Button type="submit" variant="primary" fullWidth disabled={submitting}>
                {submitting ? 'Entrando…' : 'Entrar na loja'}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setModo('escolhendo')
                  setError(null)
                }}
                className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Voltar
              </button>
            </form>
          )}

          {error && <ErrorMessage message={error} />}
        </div>

        <button type="button" onClick={signOut} className="mt-4 w-full text-center text-xs text-slate-400 hover:text-slate-600">
          Sair
        </button>
      </div>
    </div>
  )
}
