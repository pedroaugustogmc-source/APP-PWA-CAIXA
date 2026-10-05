import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLojaMembros } from '../hooks/useLojaMembros'
import { Card } from './Card'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { formatDate } from '../lib/format'

/**
 * Convite é por código (ver migration 0027) — não há como resolver
 * nome/e-mail de um membro aqui (auth.users não é legível via REST por
 * segurança), então a lista mostra só papel + status, não identidade.
 *
 * Quem chega aqui já passou pela tela de onboarding (EscolherLojaScreen) —
 * é sempre dono de uma loja ou vendedor com convite já aceito. Não há mais
 * UI de "inserir código" neste componente, isso agora só acontece no
 * primeiro acesso (ver useAuth.tsx / ProtectedRoute.tsx).
 */
export function MembrosLojaManager() {
  const { session } = useAuth()
  const { membros, loading, criarConvite, revogarMembro } = useLojaMembros()
  const [codigoGerado, setCodigoGerado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return null

  const souDono = membros.some((m) => m.user_id === session?.user.id && m.papel === 'dono')
  const meuVinculo = membros.find((m) => m.user_id === session?.user.id)

  async function handleCriarConvite() {
    setSubmitting(true)
    setError(null)
    const { error, codigo } = await criarConvite()
    setSubmitting(false)
    if (error) setError(error)
    else setCodigoGerado(codigo ?? null)
  }

  if (souDono) {
    const pendentes = membros.filter((m) => m.papel === 'vendedor' && !m.aceito_em)
    const ativos = membros.filter((m) => m.papel === 'vendedor' && m.aceito_em)

    return (
      <Card as="section" className="space-y-3">
        <h3 className="font-semibold text-slate-900">Membros da loja</h3>
        <p className="text-xs text-slate-400">
          Vendedores convidados cadastram aparelhos/acessórios e registram vendas, mas não veem configurações, fornecedores nem financeiro.
        </p>

        {ativos.length === 0 && pendentes.length === 0 && (
          <p className="text-sm text-slate-400">Nenhum vendedor convidado ainda.</p>
        )}

        {ativos.length > 0 && (
          <ul className="space-y-1.5">
            {ativos.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">Vendedor desde {formatDate(m.aceito_em!.slice(0, 10))}</span>
                <button
                  type="button"
                  onClick={() => confirm('Remover o acesso deste vendedor?') && revogarMembro(m.id)}
                  className="text-xs font-semibold text-loss hover:underline"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}

        {pendentes.length > 0 && (
          <ul className="space-y-1.5">
            {pendentes.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Convite pendente: {m.codigo_convite}</span>
                <button type="button" onClick={() => revogarMembro(m.id)} className="text-xs font-semibold text-loss hover:underline">
                  Cancelar
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && <ErrorMessage message={error} />}

        {codigoGerado && (
          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">Compartilhe este código com o vendedor:</p>
            <p className="mt-1 text-xl font-bold tracking-widest text-slate-900">{codigoGerado}</p>
          </div>
        )}

        <Button variant="secondary" fullWidth disabled={submitting} onClick={handleCriarConvite}>
          Gerar código de convite
        </Button>
      </Card>
    )
  }

  return (
    <Card as="section" className="space-y-3">
      <h3 className="font-semibold text-slate-900">Acesso à loja</h3>
      <p className="text-sm text-slate-600">
        Você tem acesso como vendedor
        {meuVinculo?.aceito_em ? ` desde ${formatDate(meuVinculo.aceito_em.slice(0, 10))}` : ''}.
      </p>
    </Card>
  )
}
