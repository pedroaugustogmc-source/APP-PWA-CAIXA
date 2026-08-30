import { useState } from 'react'
import { useItens } from '../hooks/useItens'
import { useCategorias } from '../hooks/useCategorias'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import { ItemCard } from '../components/ItemCard'
import { ItemFormModal } from '../components/ItemFormModal'
import { VendaModal } from '../components/VendaModal'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { Button } from '../components/Button'
import { IconPlus } from '../components/icons'
import { inputClass } from '../components/Field'
import { todayISO } from '../lib/calculations'
import type { StatusItem } from '../types/domain'

const STATUS_OPTIONS: { value: StatusItem | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'em_estoque', label: 'Em estoque' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'perdido_danificado', label: 'Perdido/Danificado' },
]

export function ItensPage() {
  const { itens, loading, error, criar, editar, registrarVenda, cancelarVenda, marcarPerdido, alterarStatus, remover } =
    useItens()
  const { categorias, criar: criarCategoria } = useCategorias()
  const { config } = useConfiguracoes()

  const [statusFiltro, setStatusFiltro] = useState<StatusItem | 'todos'>('todos')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [itemEditandoId, setItemEditandoId] = useState<string | null>(null)
  const [itemVendendoId, setItemVendendoId] = useState<string | null>(null)

  const itensFiltrados = itens.filter((item) => {
    if (statusFiltro !== 'todos' && item.status !== statusFiltro) return false
    if (categoriaFiltro && item.categoria_id !== categoriaFiltro) return false
    return true
  })

  const itemVendendo = itens.find((i) => i.id === itemVendendoId) ?? null
  const itemEditando = itens.find((i) => i.id === itemEditandoId) ?? null
  const editandoVenda = itemEditando?.status === 'vendido'
  const itemParaVenda = itemVendendo ?? (editandoVenda ? itemEditando : null)

  function fecharFormulario() {
    setShowForm(false)
    setItemEditandoId(null)
  }

  function fecharVenda() {
    setItemVendendoId(null)
    if (editandoVenda) setItemEditandoId(null)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Itens</h2>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <IconPlus className="h-3.5 w-3.5" /> Novo
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value as StatusItem | 'todos')} className={inputClass}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} className={inputClass}>
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && itensFiltrados.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">Nenhum item encontrado com esse filtro.</p>
      )}

      <ul className="space-y-3">
        {itensFiltrados.map((it) => (
          <ItemCard
            key={it.id}
            item={it}
            diasAlerta={config.dias_estoque_parado_alerta}
            onVender={() => setItemVendendoId(it.id)}
            onCancelarVenda={() => cancelarVenda(it.id)}
            onMarcarPerdido={() => {
              if (confirm('Marcar este item como perdido/danificado? Ele sai do estoque e entra como prejuízo.')) {
                marcarPerdido(it.id)
              }
            }}
            onAlterarStatus={(status) => alterarStatus(it.id, status)}
            onEditar={() => setItemEditandoId(it.id)}
            onExcluir={() => {
              if (confirm(`Excluir "${it.nome}" definitivamente? Essa ação não pode ser desfeita.`)) {
                remover(it.id)
              }
            }}
          />
        ))}
      </ul>

      {(showForm || (itemEditando && !editandoVenda)) && (
        <ItemFormModal
          categorias={categorias}
          itemInicial={editandoVenda ? null : itemEditando}
          onClose={fecharFormulario}
          onSubmit={(input, categoria) => (itemEditando ? editar(itemEditando.id, input) : criar(input, categoria))}
          onCriarCategoria={criarCategoria}
        />
      )}

      {itemParaVenda && (
        <VendaModal
          custoTotal={itemParaVenda.custo_total}
          vendaInicial={
            editandoVenda && itemEditando
              ? {
                  preco_venda: itemEditando.preco_venda ?? 0,
                  plataforma_id: itemEditando.plataforma_id,
                  taxa_plataforma_pct: itemEditando.taxa_plataforma_pct ?? 0,
                  data_venda: itemEditando.data_venda ?? todayISO(),
                }
              : null
          }
          onClose={fecharVenda}
          onSubmit={(input) => registrarVenda(itemParaVenda.id, input)}
        />
      )}
    </div>
  )
}
