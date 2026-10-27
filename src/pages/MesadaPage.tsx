import { useState, type FormEvent } from 'react'
import { useChecklistsMesada } from '../hooks/useChecklistsMesada'
import { PessoalSubNav } from '../components/PessoalSubNav'
import { Button } from '../components/Button'
import { Field, inputClass } from '../components/Field'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { formatBRL, formatMes } from '../lib/format'
import { IconPlus, IconTrash } from '../components/icons'

export function MesadaPage() {
  const { checklists, loading, error, criar, alternarItem, remover } = useChecklistsMesada()
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [valorMensal, setValorMensal] = useState(0)
  const [erroForm, setErroForm] = useState<string | null>(null)
  const [erroAcao, setErroAcao] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleCriar(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setErroForm('Dê um nome pro checklist.')
      return
    }
    setSubmitting(true)
    setErroForm(null)
    const { error } = await criar(nome.trim(), valorMensal)
    setSubmitting(false)
    if (error) {
      setErroForm(error)
    } else {
      setNome('')
      setValorMensal(0)
      setShowForm(false)
    }
  }

  async function handleToggle(itemId: string, recebidoAtual: boolean) {
    setErroAcao(null)
    const { error } = await alternarItem(itemId, !recebidoAtual)
    if (error) setErroAcao(error)
  }

  async function handleExcluir(id: string, nome: string) {
    if (!confirm(`Excluir o checklist "${nome}" e todo o progresso dele?`)) return
    setErroAcao(null)
    const { error } = await remover(id)
    if (error) setErroAcao(error)
  }

  return (
    <div>
      <PessoalSubNav />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Mesada</h2>
        <Button variant="primary" size="sm" onClick={() => setShowForm((v) => !v)}>
          <IconPlus className="h-3.5 w-3.5" /> Novo
        </Button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {erroAcao && <ErrorMessage message={erroAcao} />}

      {showForm && (
        <form onSubmit={handleCriar} className="mb-4 space-y-3 rounded-xl border border-slate-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_16px_-12px_rgba(15,23,42,0.12)]">
          <Field label="Nome do checklist">
            <input type="text" autoFocus value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Valor mensal (R$)">
            <input
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={valorMensal || ''}
              onChange={(e) => setValorMensal(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          {erroForm && <ErrorMessage message={erroForm} />}
          <Button type="submit" variant="primary" fullWidth disabled={submitting}>
            {submitting ? 'Criando…' : 'Criar checklist (120 dias)'}
          </Button>
        </form>
      )}

      {!loading && checklists.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Nenhum checklist de mesada ainda.</p>}

      <ul className="space-y-4">
        {checklists.map((checklist) => {
          const itensOrdenados = [...checklist.itens].sort((a, b) => a.indice - b.indice)
          const recebidos = itensOrdenados.filter((i) => i.recebido).length
          return (
            <li key={checklist.id} className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_16px_-12px_rgba(15,23,42,0.12)]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{checklist.nome}</p>
                  <p className="text-xs text-slate-500">
                    {formatMes(checklist.mes_inicio.slice(0, 7))} · {formatBRL(checklist.valor_mensal)}/mês
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <p className="text-xs font-semibold text-slate-600">{recebidos}/{itensOrdenados.length}</p>
                  <button
                    type="button"
                    onClick={() => handleExcluir(checklist.id, checklist.nome)}
                    aria-label="Excluir checklist"
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-loss/10 hover:text-loss"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-10 gap-1">
                {itensOrdenados.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggle(item.id, item.recebido)}
                    title={`Dia ${item.indice + 1}`}
                    className={`flex h-7 items-center justify-center rounded text-[10px] font-semibold tabular-nums transition-colors ${
                      item.recebido ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {item.indice + 1}
                  </button>
                ))}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
