import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { Field, inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { Button } from './Button'
import { IconPlus } from './icons'
import type { Acessorio, Categoria, Fornecedor } from '../types/domain'
import type { AcessorioInput } from '../hooks/useAcessorios'
import type { FornecedorInput } from '../hooks/useFornecedores'

interface Props {
  categorias: Categoria[]
  fornecedores: Fornecedor[]
  acessorioInicial?: Acessorio | null
  onClose: () => void
  onSubmit: (input: AcessorioInput) => Promise<{ error: string | null }>
  onCriarCategoria: (nome: string) => Promise<{ error: string | null; categoria?: Categoria }>
  onCriarFornecedor: (input: FornecedorInput) => Promise<{ error: string | null; fornecedor?: Fornecedor }>
}

export function AcessorioFormModal({
  categorias,
  fornecedores,
  acessorioInicial,
  onClose,
  onSubmit,
  onCriarCategoria,
  onCriarFornecedor,
}: Props) {
  const [sku, setSku] = useState(acessorioInicial?.sku ?? '')
  const [nome, setNome] = useState(acessorioInicial?.nome ?? '')
  const [categoriaId, setCategoriaId] = useState(acessorioInicial?.categoria_id ?? '')
  const [fornecedorId, setFornecedorId] = useState(acessorioInicial?.fornecedor_id ?? '')
  const [custoUnitario, setCustoUnitario] = useState(acessorioInicial?.custo_unitario ?? 0)
  const [precoVenda, setPrecoVenda] = useState(acessorioInicial?.preco_venda ?? 0)
  const [quantidadeEstoque, setQuantidadeEstoque] = useState(acessorioInicial?.quantidade_estoque ?? 0)
  const [estoqueMinimo, setEstoqueMinimo] = useState(acessorioInicial?.estoque_minimo ?? 0)
  const [observacoes, setObservacoes] = useState(acessorioInicial?.observacoes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [criandoCategoria, setCriandoCategoria] = useState(false)
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('')
  const [criandoCategoriaSubmitting, setCriandoCategoriaSubmitting] = useState(false)

  const [criandoFornecedor, setCriandoFornecedor] = useState(false)
  const [novoFornecedorNome, setNovoFornecedorNome] = useState('')
  const [criandoFornecedorSubmitting, setCriandoFornecedorSubmitting] = useState(false)

  async function handleCriarCategoria() {
    if (!novaCategoriaNome.trim()) return
    setCriandoCategoriaSubmitting(true)
    setError(null)
    const { error, categoria } = await onCriarCategoria(novaCategoriaNome.trim())
    setCriandoCategoriaSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    if (categoria) setCategoriaId(categoria.id)
    setNovaCategoriaNome('')
    setCriandoCategoria(false)
  }

  async function handleCriarFornecedor() {
    if (!novoFornecedorNome.trim()) return
    setCriandoFornecedorSubmitting(true)
    setError(null)
    const { error, fornecedor } = await onCriarFornecedor({ nome: novoFornecedorNome.trim() })
    setCriandoFornecedorSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    if (fornecedor) setFornecedorId(fornecedor.id)
    setNovoFornecedorNome('')
    setCriandoFornecedor(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!sku.trim()) {
      setError('Informe o SKU.')
      return
    }
    if (!nome.trim()) {
      setError('Dê um nome pro acessório.')
      return
    }
    setSubmitting(true)
    setError(null)

    const input: AcessorioInput = {
      sku: sku.trim(),
      nome: nome.trim(),
      categoria_id: categoriaId || null,
      fornecedor_id: fornecedorId || null,
      custo_unitario: custoUnitario,
      preco_venda: precoVenda,
      quantidade_estoque: quantidadeEstoque,
      estoque_minimo: estoqueMinimo,
      observacoes: observacoes || null,
    }

    const { error } = await onSubmit(input)
    setSubmitting(false)
    if (error) setError(error)
    else onClose()
  }

  return (
    <Modal title={acessorioInicial ? 'Editar acessório' : 'Novo acessório'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="SKU">
            <input type="text" required autoFocus value={sku} onChange={(e) => setSku(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Nome">
            <input
              type="text"
              required
              placeholder="Ex.: Capa transparente"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Categoria</span>
            {categorias.length > 0 && (
              <button
                type="button"
                onClick={() => setCriandoCategoria((v) => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
              >
                {criandoCategoria ? (
                  'cancelar'
                ) : (
                  <>
                    <IconPlus className="h-3.5 w-3.5" /> nova
                  </>
                )}
              </button>
            )}
          </div>

          {criandoCategoria || categorias.length === 0 ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex.: Acessórios"
                value={novaCategoriaNome}
                onChange={(e) => setNovaCategoriaNome(e.target.value)}
                className={inputClass}
              />
              <Button type="button" variant="primary" size="sm" onClick={handleCriarCategoria} disabled={criandoCategoriaSubmitting}>
                Salvar
              </Button>
            </div>
          ) : (
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={inputClass}>
              <option value="">Nenhuma</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Fornecedor</span>
            {fornecedores.length > 0 && (
              <button
                type="button"
                onClick={() => setCriandoFornecedor((v) => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
              >
                {criandoFornecedor ? (
                  'cancelar'
                ) : (
                  <>
                    <IconPlus className="h-3.5 w-3.5" /> novo
                  </>
                )}
              </button>
            )}
          </div>

          {criandoFornecedor || fornecedores.length === 0 ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex.: Distribuidora ABC"
                value={novoFornecedorNome}
                onChange={(e) => setNovoFornecedorNome(e.target.value)}
                className={inputClass}
              />
              <Button type="button" variant="primary" size="sm" onClick={handleCriarFornecedor} disabled={criandoFornecedorSubmitting}>
                Salvar
              </Button>
            </div>
          ) : (
            <select value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)} className={inputClass}>
              <option value="">Nenhum</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Custo unitário (R$)">
            <input
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={custoUnitario}
              onChange={(e) => setCustoUnitario(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Preço de venda (R$)">
            <input
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={precoVenda}
              onChange={(e) => setPrecoVenda(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Quantidade em estoque">
            <input
              type="number"
              min={0}
              step={1}
              value={quantidadeEstoque}
              onChange={(e) => setQuantidadeEstoque(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Estoque mínimo (alerta)">
            <input
              type="number"
              min={0}
              step={1}
              value={estoqueMinimo}
              onChange={(e) => setEstoqueMinimo(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Observações">
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className={inputClass} rows={2} />
        </Field>

        {error && <ErrorMessage message={error} />}

        <Button type="submit" variant="primary" fullWidth disabled={submitting}>
          {submitting ? 'Salvando…' : acessorioInicial ? 'Salvar alterações' : 'Salvar acessório'}
        </Button>
      </form>
    </Modal>
  )
}
