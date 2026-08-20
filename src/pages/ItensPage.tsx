import { useMemo, useState } from 'react'
import { useItens } from '../hooks/useItens'
import { useCategorias } from '../hooks/useCategorias'
import { usePlataformas } from '../hooks/usePlataformas'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import { ItemCard } from '../components/ItemCard'
import { VendaModal } from '../components/VendaModal'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { inputClass } from '../components/Field'
import type { StatusItem } from '../types/domain'

const STATUS_OPTIONS: { value: StatusItem | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'em_estoque', label: 'Em estoque' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'perdido_danificado', label: 'Perdido/Danificado' },
]

export function ItensPage() {
  const { itens, loading, error, registrarVenda, cancelarVenda, marcarPerdido } = useItens()
  const { categorias } = useCategorias()
  const { plataformas } = usePlataformas()
  const { config } = useConfiguracoes()

  const [statusFiltro, setStatusFiltro] = useState<StatusItem | 'todos'>('todos')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [itemVendendo, setItemVendendo] = useState<string | null>(null)

  const categoriaPorId = useMemo(() => new Map(categorias.map((c) => [c.id, c.nome])), [categorias])

  const itensFiltrados = itens.filter((item) => {
    if (statusFiltro !== 'todos' && item.status !== statusFiltro) return false
    if (categoriaFiltro && item.lote.categoria_id !== categoriaFiltro) return false
    return true
  })

  const item = itens.find((i) => i.id === itemVendendo) ?? null

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-slate-900">Itens</h2>

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

      <ul className="space-y-2">
        {itensFiltrados.map((it) => (
          <ItemCard
            key={it.id}
            item={it}
            categoriaNome={categoriaPorId.get(it.lote.categoria_id ?? '')}
            diasAlerta={config.dias_estoque_parado_alerta}
            onVender={() => setItemVendendo(it.id)}
            onCancelarVenda={() => cancelarVenda(it.id)}
            onMarcarPerdido={() => {
              if (confirm('Marcar este item como perdido/danificado? Ele sai do estoque e entra como prejuízo.')) {
                marcarPerdido(it.id)
              }
            }}
          />
        ))}
      </ul>

      {item && (
        <VendaModal
          custoUnitario={item.custo_unitario}
          plataformas={plataformas}
          onClose={() => setItemVendendo(null)}
          onSubmit={(input) => registrarVenda(item.id, input)}
        />
      )}
    </div>
  )
}
