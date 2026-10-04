import { useState } from 'react'
import { useClientes } from '../hooks/useClientes'
import { useVendas } from '../hooks/useVendas'
import { somar, toMoney } from '../lib/money'
import { formatBRL } from '../lib/format'
import { FinanceiroSubNav } from '../components/FinanceiroSubNav'
import { ClienteFormModal } from '../components/ClienteFormModal'
import { ImportarCsvModal } from '../components/ImportarCsvModal'
import { Button } from '../components/Button'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { IconPlus, IconTrash } from '../components/icons'
import { TEMPLATE_CSV_CLIENTES, validarClientes } from '../lib/csvImport'

export function ClientesPage() {
  const { clientes, loading, error, criar, editar, remover, importarVarios } = useClientes()
  const { vendas } = useVendas()
  const [showForm, setShowForm] = useState(false)
  const [showImportar, setShowImportar] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)

  const editando = clientes.find((c) => c.id === editandoId) ?? null

  function fechar() {
    setShowForm(false)
    setEditandoId(null)
  }

  function historicoDoCliente(clienteId: string, contato: string | null) {
    return vendas.filter((v) => v.cliente_id === clienteId || (contato && v.cliente_contato === contato))
  }

  return (
    <div>
      <FinanceiroSubNav />

      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">Clientes</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowImportar(true)}>
            Importar CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <IconPlus className="h-3.5 w-3.5" /> Novo
          </Button>
        </div>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && clientes.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Nenhum cliente cadastrado ainda.</p>}

      <ul className="space-y-3">
        {clientes.map((cliente) => {
          const compras = historicoDoCliente(cliente.id, cliente.contato)
          const totalGasto = somar(compras.flatMap((v) => v.itens.map((i) => toMoney(i.preco_unitario).times(i.quantidade))))
          return (
            <li key={cliente.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{cliente.nome}</p>
                  <p className="text-xs text-slate-500">
                    {cliente.contato ?? 'Sem contato'}
                    {cliente.email ? ` · ${cliente.email}` : ''}
                  </p>
                  <p className="text-xs text-slate-400">
                    {compras.length} {compras.length === 1 ? 'compra' : 'compras'}
                    {compras.length > 0 ? ` · ${formatBRL(totalGasto)} no total` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditandoId(cliente.id)}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Excluir "${cliente.nome}" definitivamente?`)) remover(cliente.id)
                    }}
                    aria-label="Excluir cliente"
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-loss/10 hover:text-loss"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {(showForm || editando) && (
        <ClienteFormModal clienteInicial={editando} onClose={fechar} onSubmit={(input) => (editando ? editar(editando.id, input) : criar(input))} />
      )}

      {showImportar && (
        <ImportarCsvModal
          titulo="Importar clientes via CSV"
          templateCsv={TEMPLATE_CSV_CLIENTES}
          templateNomeArquivo="clientes-modelo.csv"
          colunasAjuda="nome, contato, cpf, email, observacoes. Só nome é obrigatório."
          validar={validarClientes}
          onImportar={importarVarios}
          onClose={() => setShowImportar(false)}
        />
      )}
    </div>
  )
}
