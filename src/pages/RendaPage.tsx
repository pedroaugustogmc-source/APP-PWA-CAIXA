import { useState } from 'react'
import { useFontesRenda, valorVigente } from '../hooks/useFontesRenda'
import { FonteRendaFormModal } from '../components/FonteRendaFormModal'
import { PessoalSubNav } from '../components/PessoalSubNav'
import { Button } from '../components/Button'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { formatBRL, formatDate } from '../lib/format'
import { IconPlus, IconTrash } from '../components/icons'

const FREQUENCIA_LABELS: Record<string, string> = {
  semanal: 'Semanal',
  quinzenal: 'Quinzenal',
  mensal: 'Mensal',
  anual: 'Anual',
  eventual: 'Eventual',
}

export function RendaPage() {
  const { fontes, loading, error, criar, editar, remover } = useFontesRenda()
  const [showForm, setShowForm] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [erroExclusao, setErroExclusao] = useState<string | null>(null)

  const editando = fontes.find((f) => f.id === editandoId) ?? null

  function fechar() {
    setShowForm(false)
    setEditandoId(null)
  }

  async function handleExcluir(id: string, nome: string) {
    if (!confirm(`Excluir "${nome}" definitivamente?`)) return
    setErroExclusao(null)
    const { error } = await remover(id)
    if (error) setErroExclusao(error)
  }

  const totalMensal = fontes
    .filter((f) => f.frequencia === 'mensal' && !f.data_fim)
    .reduce((acc, f) => acc + (valorVigente(f.valores)?.valor_liquido_esperado ?? 0), 0)

  return (
    <div>
      <PessoalSubNav />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Renda</h2>
          <p className="text-xs text-slate-500">Total mensal ativo: {formatBRL(totalMensal)}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <IconPlus className="h-3.5 w-3.5" /> Nova
        </Button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {erroExclusao && <ErrorMessage message={erroExclusao} />}
      {!loading && fontes.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Nenhuma fonte de renda cadastrada ainda.</p>}

      <ul className="space-y-3">
        {fontes.map((fonte) => {
          const valor = valorVigente(fonte.valores)
          const encerrada = !!fonte.data_fim && fonte.data_fim < new Date().toISOString().slice(0, 10)
          return (
            <li key={fonte.id} className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_16px_-12px_rgba(15,23,42,0.12)]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{fonte.nome}</p>
                  <p className="text-xs text-slate-500">
                    {FREQUENCIA_LABELS[fonte.frequencia]}
                    {fonte.dia_recebimento ? ` · dia ${fonte.dia_recebimento}` : ''}
                    {encerrada ? ' · encerrada' : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums text-slate-900">{valor ? formatBRL(valor.valor_liquido_esperado) : '—'}</p>
                  <p className="text-xs text-slate-400">desde {formatDate(fonte.data_inicio)}</p>
                </div>
              </div>
              {fonte.observacoes && <p className="mt-2 text-xs text-slate-500">{fonte.observacoes}</p>}
              <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                <Button variant="secondary" size="sm" onClick={() => setEditandoId(fonte.id)}>
                  Editar
                </Button>
                <button
                  type="button"
                  onClick={() => handleExcluir(fonte.id, fonte.nome)}
                  aria-label="Excluir fonte de renda"
                  className="ml-auto rounded-md p-1.5 text-slate-400 transition-colors hover:bg-loss/10 hover:text-loss"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {(showForm || editando) && (
        <FonteRendaFormModal
          fonteInicial={editando}
          onClose={fechar}
          onSubmit={(input, valorInicial) => (editando ? editar(editando.id, input) : criar(input, valorInicial))}
        />
      )}
    </div>
  )
}
