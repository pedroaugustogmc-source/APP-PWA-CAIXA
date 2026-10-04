import { useState } from 'react'
import { useAparelhos } from '../hooks/useAparelhos'
import { useCategorias } from '../hooks/useCategorias'
import { useFornecedores } from '../hooks/useFornecedores'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import { AparelhoCard } from '../components/AparelhoCard'
import { AparelhoFormModal } from '../components/AparelhoFormModal'
import { EstoqueSubNav } from '../components/EstoqueSubNav'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { Button } from '../components/Button'
import { IconPlus } from '../components/icons'
import { inputClass } from '../components/Field'
import type { StatusAparelho } from '../types/domain'

const STATUS_OPTIONS: { value: StatusAparelho | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'em_estoque', label: 'Em estoque' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'devolvido', label: 'Devolvido' },
  { value: 'baixado', label: 'Baixado' },
]

export function EstoqueAparelhosPage() {
  const { aparelhos, loading, error, criar, editar, alterarStatus, remover } = useAparelhos()
  const { categorias, criar: criarCategoria } = useCategorias()
  const { fornecedores, criar: criarFornecedor } = useFornecedores()
  const { config } = useConfiguracoes()

  const [statusFiltro, setStatusFiltro] = useState<StatusAparelho | 'todos'>('em_estoque')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [aparelhoEditandoId, setAparelhoEditandoId] = useState<string | null>(null)

  const aparelhosFiltrados = aparelhos.filter((aparelho) => {
    if (statusFiltro !== 'todos' && aparelho.status !== statusFiltro) return false
    if (categoriaFiltro && aparelho.categoria_id !== categoriaFiltro) return false
    return true
  })

  const aparelhoEditando = aparelhos.find((a) => a.id === aparelhoEditandoId) ?? null

  function fecharFormulario() {
    setShowForm(false)
    setAparelhoEditandoId(null)
  }

  return (
    <div>
      <EstoqueSubNav />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Aparelhos</h2>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <IconPlus className="h-3.5 w-3.5" /> Novo
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value as StatusAparelho | 'todos')}
          className={inputClass}
        >
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
      {!loading && aparelhosFiltrados.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">Nenhum aparelho encontrado com esse filtro.</p>
      )}

      <ul className="space-y-3">
        {aparelhosFiltrados.map((aparelho) => (
          <AparelhoCard
            key={aparelho.id}
            aparelho={aparelho}
            diasAlerta={config.dias_estoque_parado_alerta}
            onAlterarStatus={(status) => alterarStatus(aparelho.id, status)}
            onEditar={() => setAparelhoEditandoId(aparelho.id)}
            onExcluir={() => {
              if (confirm(`Excluir "${aparelho.nome}" definitivamente? Essa ação não pode ser desfeita.`)) {
                remover(aparelho.id)
              }
            }}
          />
        ))}
      </ul>

      {(showForm || aparelhoEditando) && (
        <AparelhoFormModal
          categorias={categorias}
          fornecedores={fornecedores}
          aparelhoInicial={aparelhoEditando}
          onClose={fecharFormulario}
          onSubmit={(input, categoria, fornecedor) =>
            aparelhoEditando ? editar(aparelhoEditando.id, input) : criar(input, categoria, fornecedor)
          }
          onCriarCategoria={criarCategoria}
          onCriarFornecedor={criarFornecedor}
        />
      )}
    </div>
  )
}
