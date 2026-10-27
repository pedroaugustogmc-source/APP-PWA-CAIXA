import { useState, type FormEvent } from 'react'
import { useCarteirasInvestimento } from '../hooks/useCarteirasInvestimento'
import { PessoalSubNav } from '../components/PessoalSubNav'
import { Button } from '../components/Button'
import { Field, inputClass } from '../components/Field'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { IconPlus, IconTrash } from '../components/icons'
import type { TipoCarteira } from '../types/domain'

const TIPO_LABELS: Record<TipoCarteira, string> = {
  pessoal: 'Pessoal',
  previdencia: 'Previdência',
  outro: 'Outro',
}

export function InvestimentosPage() {
  const { carteiras, loading, error, criar, remover } = useCarteirasInvestimento()
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoCarteira>('pessoal')
  const [erroAcao, setErroAcao] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleCriar(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setSubmitting(true)
    setErroAcao(null)
    const { error } = await criar(nome.trim(), tipo)
    setSubmitting(false)
    if (error) setErroAcao(error)
    else setNome('')
  }

  async function handleExcluir(id: string, nome: string) {
    if (!confirm(`Excluir a carteira "${nome}" definitivamente?`)) return
    setErroAcao(null)
    const { error } = await remover(id)
    if (error) setErroAcao(error)
  }

  return (
    <div>
      <PessoalSubNav />

      <h2 className="mb-4 text-lg font-bold text-slate-900">Investimentos</h2>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {erroAcao && <ErrorMessage message={erroAcao} />}

      <p className="mb-4 text-xs text-slate-500">
        Carteiras pra organizar seus investimentos. Lançamento de ativos e transações ainda não tem tela própria aqui — por enquanto é só o
        cadastro das carteiras.
      </p>

      {!loading && carteiras.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Nenhuma carteira cadastrada ainda.</p>}

      <ul className="mb-4 space-y-2">
        {carteiras.map((carteira) => (
          <li key={carteira.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
            <div>
              <p className="font-medium text-slate-900">{carteira.nome}</p>
              <p className="text-xs text-slate-500">{TIPO_LABELS[carteira.tipo]}</p>
            </div>
            <button
              type="button"
              onClick={() => handleExcluir(carteira.id, carteira.nome)}
              aria-label={`Remover ${carteira.nome}`}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-loss/10 hover:text-loss"
            >
              <IconTrash className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleCriar} className="space-y-2">
        <div className="flex gap-2">
          <Field label="Nova carteira">
            <input type="text" placeholder="Ex.: Reserva de emergência" value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
          </Field>
          <div className="w-32 shrink-0">
            <Field label="Tipo">
              <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoCarteira)} className={inputClass}>
                {Object.entries(TIPO_LABELS).map(([valor, label]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
        <Button type="submit" variant="primary" fullWidth disabled={submitting}>
          <IconPlus className="h-3.5 w-3.5" /> Adicionar carteira
        </Button>
      </form>
    </div>
  )
}
