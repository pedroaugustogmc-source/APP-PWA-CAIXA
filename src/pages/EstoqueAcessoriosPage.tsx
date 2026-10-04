import { useState } from 'react'
import { useAcessorios } from '../hooks/useAcessorios'
import { useCategorias } from '../hooks/useCategorias'
import { useFornecedores } from '../hooks/useFornecedores'
import { AcessorioCard } from '../components/AcessorioCard'
import { AcessorioFormModal } from '../components/AcessorioFormModal'
import { EstoqueSubNav } from '../components/EstoqueSubNav'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { Button } from '../components/Button'
import { IconPlus } from '../components/icons'

export function EstoqueAcessoriosPage() {
  const { acessorios, loading, error, criar, editar, remover } = useAcessorios()
  const { categorias, criar: criarCategoria } = useCategorias()
  const { fornecedores, criar: criarFornecedor } = useFornecedores()

  const [showForm, setShowForm] = useState(false)
  const [acessorioEditandoId, setAcessorioEditandoId] = useState<string | null>(null)

  const acessorioEditando = acessorios.find((a) => a.id === acessorioEditandoId) ?? null

  function fecharFormulario() {
    setShowForm(false)
    setAcessorioEditandoId(null)
  }

  return (
    <div>
      <EstoqueSubNav />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Acessórios</h2>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <IconPlus className="h-3.5 w-3.5" /> Novo
        </Button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && acessorios.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">Nenhum acessório cadastrado ainda.</p>
      )}

      <ul className="space-y-3">
        {acessorios.map((acessorio) => (
          <AcessorioCard
            key={acessorio.id}
            acessorio={acessorio}
            onEditar={() => setAcessorioEditandoId(acessorio.id)}
            onExcluir={() => {
              if (confirm(`Excluir "${acessorio.nome}" definitivamente? Essa ação não pode ser desfeita.`)) {
                remover(acessorio.id)
              }
            }}
          />
        ))}
      </ul>

      {(showForm || acessorioEditando) && (
        <AcessorioFormModal
          categorias={categorias}
          fornecedores={fornecedores}
          acessorioInicial={acessorioEditando}
          onClose={fecharFormulario}
          onSubmit={(input) => (acessorioEditando ? editar(acessorioEditando.id, input) : criar(input))}
          onCriarCategoria={criarCategoria}
          onCriarFornecedor={criarFornecedor}
        />
      )}
    </div>
  )
}
