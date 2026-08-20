import { useState } from 'react'
import { useLotes } from '../hooks/useLotes'
import { useCategorias } from '../hooks/useCategorias'
import { useFornecedores } from '../hooks/useFornecedores'
import { LoteFormModal } from '../components/LoteFormModal'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { formatBRL, formatDate } from '../lib/format'

export function LotesPage() {
  const { lotes, loading, error, criar } = useLotes()
  const { categorias } = useCategorias()
  const { fornecedores } = useFornecedores()
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Lotes de compra</h2>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
        >
          + Novo lote
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && lotes.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">Nenhum lote cadastrado ainda.</p>
      )}

      <ul className="space-y-2">
        {lotes.map((lote) => (
          <li key={lote.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">{lote.categoria?.nome ?? 'Sem categoria'}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(lote.data_compra)} · {lote.fornecedor?.nome ?? 'Sem fornecedor'}
                </p>
              </div>
              <p className="text-xs text-slate-500">
                {lote.quantidade_em_estoque}/{lote.quantidade_comprada} em estoque
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-slate-400">Custo total</p>
                <p className="font-medium">{formatBRL(lote.custo_total_lote)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Custo unitário</p>
                <p className="font-medium">{formatBRL(lote.custo_unitario)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {showForm && (
        <LoteFormModal
          categorias={categorias}
          fornecedores={fornecedores}
          onClose={() => setShowForm(false)}
          onSubmit={criar}
        />
      )}
    </div>
  )
}
