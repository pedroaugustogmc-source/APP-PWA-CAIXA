import { useState } from 'react'
import { useDespesas } from '../hooks/useDespesas'
import { DespesaFormModal } from '../components/DespesaFormModal'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { formatBRL, formatDate } from '../lib/format'

const LABELS: Record<string, string> = {
  marketing: 'Marketing',
  embalagem_geral: 'Embalagem geral',
  transporte: 'Transporte',
  taxas: 'Taxas',
  outros: 'Outros',
}

export function DespesasPage() {
  const { despesas, loading, error, criar, remover } = useDespesas()
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Despesas gerais</h2>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
        >
          + Nova despesa
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && despesas.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">Nenhuma despesa cadastrada ainda.</p>
      )}

      <ul className="space-y-2">
        {despesas.map((d) => (
          <li key={d.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="font-semibold text-slate-900">{d.descricao || LABELS[d.categoria_despesa]}</p>
              <p className="text-xs text-slate-500">
                {formatDate(d.data)} · {LABELS[d.categoria_despesa]}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-semibold text-loss">-{formatBRL(d.valor)}</p>
              <button type="button" onClick={() => remover(d.id)} className="text-xs text-slate-400 hover:text-loss">
                Remover
              </button>
            </div>
          </li>
        ))}
      </ul>

      {showForm && <DespesaFormModal onClose={() => setShowForm(false)} onSubmit={criar} />}
    </div>
  )
}
