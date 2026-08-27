import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ErrorMessage } from '../components/ErrorMessage'
import { Field, inputClass } from '../components/Field'
import { Button } from '../components/Button'

type Modo = 'entrar' | 'criar'

export function LoginPage() {
  const { session, signIn, signUp } = useAuth()
  const [modo, setModo] = useState<Modo>('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [contaCriada, setContaCriada] = useState(false)

  if (session) return <Navigate to="/" replace />

  function trocarModo(novoModo: Modo) {
    setModo(novoModo)
    setError(null)
    setContaCriada(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (modo === 'entrar') {
      const { error } = await signIn(email, password)
      if (error) setError(error)
    } else {
      const { error, precisaConfirmarEmail } = await signUp(email, password)
      if (error) setError(error)
      else if (precisaConfirmarEmail) setContaCriada(true)
    }

    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
            CC
          </div>
          <h1 className="text-center text-2xl font-bold text-slate-900">Catira Control</h1>
          <p className="mt-1 text-center text-sm text-slate-500">Gestão de compra e venda de acessórios</p>
        </div>

        <div className="mb-4 flex rounded-lg border border-slate-200 bg-white p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => trocarModo('entrar')}
            className={`flex-1 rounded-md py-1.5 transition-colors ${
              modo === 'entrar' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => trocarModo('criar')}
            className={`flex-1 rounded-md py-1.5 transition-colors ${
              modo === 'criar' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Field label="E-mail">
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Senha">
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </Field>

          {error && <ErrorMessage message={error} />}
          {contaCriada && (
            <p className="rounded-lg border border-profit/25 bg-profit/5 px-3 py-2 text-sm font-medium text-profit">
              Conta criada. Confira seu e-mail para confirmar antes de entrar.
            </p>
          )}

          <Button type="submit" variant="primary" fullWidth disabled={submitting}>
            {submitting ? 'Enviando…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>
      </div>
    </div>
  )
}
