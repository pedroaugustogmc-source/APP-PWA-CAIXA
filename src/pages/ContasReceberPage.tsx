import { useState } from 'react'
import { useContasReceber } from '../hooks/useContasReceber'
import { resumoContas } from '../lib/financeiro'
import { todayISO } from '../lib/calculations'
import { formatBRL, formatDate } from '../lib/format'
import { FinanceiroSubNav } from '../components/FinanceiroSubNav'
import { StatusContaBadge } from '../components/StatusContaBadge'
import { ContaReceberFormModal } from '../components/ContaReceberFormModal'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { IconPlus, IconTrash } from '../components/icons'

export function ContasReceberPage() {
  const { contas, loading, error, criar, editar, marcarRecebida, reabrir, cancelar, remover } = useContasReceber()
  const [mostrarCanceladas, setMostrarCanceladas] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)

  const resumo = resumoContas(contas)
  const visiveis = contas.filter((c) => (mostrarCanceladas ? true : c.status !== 'cancelada'))
  const editando = contas.find((c) => c.id === editandoId) ?? null

  function fechar() {
    setShowForm(false)
    setEditandoId(null)
  }

  return (
    <div>
      <FinanceiroSubNav />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs font-medium text-slate-500">Total pendente</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{formatBRL(resumo.totalPendente)}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-500">Atrasado ({resumo.quantidadeAtrasada})</p>
          <p className={`mt-1 text-xl font-bold tabular-nums ${resumo.quantidadeAtrasada > 0 ? 'text-loss' : 'text-slate-900'}`}>
            {formatBRL(resumo.totalAtrasado)}
          </p>
        </Card>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={mostrarCanceladas}
            onChange={(e) => setMostrarCanceladas(e.target.checked)}
            className="h-4 w-4 accent-slate-900"
          />
          Mostrar canceladas
        </label>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <IconPlus className="h-3.5 w-3.5" /> Nova
        </Button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && visiveis.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Nenhuma conta a receber cadastrada.</p>}

      <ul className="space-y-3">
        {visiveis.map((conta) => (
          <li key={conta.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{conta.descricao}</p>
                <p className="text-xs text-slate-500">
                  {conta.cliente_nome ? `${conta.cliente_nome} · ` : ''}
                  Vence {formatDate(conta.data_vencimento)}
                  {conta.data_recebimento ? ` · recebido em ${formatDate(conta.data_recebimento)}` : ''}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold tabular-nums text-slate-900">{formatBRL(conta.valor)}</p>
                <StatusContaBadge status={conta.status} dataVencimento={conta.data_vencimento} />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {conta.status === 'pendente' && (
                <>
                  <Button variant="primary" size="sm" onClick={() => marcarRecebida(conta.id, todayISO())}>
                    Marcar recebida
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setEditandoId(conta.id)}>
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => cancelar(conta.id)}>
                    Cancelar
                  </Button>
                </>
              )}
              {conta.status === 'quitada' && (
                <Button variant="secondary" size="sm" onClick={() => reabrir(conta.id)}>
                  Reabrir
                </Button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Excluir "${conta.descricao}" definitivamente?`)) remover(conta.id)
                }}
                aria-label="Excluir"
                className="ml-auto rounded-md p-1.5 text-slate-400 transition-colors hover:bg-loss/10 hover:text-loss"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {(showForm || editando) && <ContaReceberFormModal contaInicial={editando} onClose={fechar} onSubmit={(input) => (editando ? editar(editando.id, input) : criar(input))} />}
    </div>
  )
}
