import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { Field, inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { Button } from './Button'
import { IconPlus } from './icons'
import { todayISO } from '../lib/calculations'
import { formatBRL } from '../lib/format'
import type { Categoria, CondicaoItem, CustoExtra, Fornecedor, Item } from '../types/domain'
import type { ItemInput } from '../hooks/useItens'

interface Props {
  categorias: Categoria[]
  fornecedores: Fornecedor[]
  itemInicial?: Item | null
  onClose: () => void
  onSubmit: (input: ItemInput, categoria: Categoria | null, fornecedor: Fornecedor | null) => Promise<{ error: string | null }>
}

export function ItemFormModal({ categorias, fornecedores, itemInicial, onClose, onSubmit }: Props) {
  const [nome, setNome] = useState(itemInicial?.nome ?? '')
  const [categoriaId, setCategoriaId] = useState(itemInicial?.categoria_id ?? '')
  const [fornecedorId, setFornecedorId] = useState(itemInicial?.fornecedor_id ?? '')
  const [condicao, setCondicao] = useState<CondicaoItem>(itemInicial?.condicao ?? 'novo')
  const [dataCompra, setDataCompra] = useState(itemInicial?.data_compra ?? todayISO())
  const [custoCompra, setCustoCompra] = useState(itemInicial?.custo_compra ?? 0)
  const [custosExtras, setCustosExtras] = useState<CustoExtra[]>(itemInicial?.custos_extras ?? [])
  const [diasPlanejados, setDiasPlanejados] = useState(itemInicial?.dias_planejados ? String(itemInicial.dias_planejados) : '')
  const [observacoes, setObservacoes] = useState(itemInicial?.observacoes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const custoTotal = custoCompra + custosExtras.reduce((acc, c) => acc + c.valor, 0)

  function adicionarCustoExtra() {
    setCustosExtras([...custosExtras, { label: '', valor: 0 }])
  }

  function atualizarCustoExtra(index: number, campo: 'label' | 'valor', valor: string) {
    setCustosExtras(
      custosExtras.map((c, i) => (i === index ? { ...c, [campo]: campo === 'valor' ? Number(valor) : valor } : c)),
    )
  }

  function removerCustoExtra(index: number) {
    setCustosExtras(custosExtras.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setError('Dê um nome pro produto.')
      return
    }
    setSubmitting(true)
    setError(null)

    const input: ItemInput = {
      nome: nome.trim(),
      categoria_id: categoriaId || null,
      fornecedor_id: fornecedorId || null,
      data_compra: dataCompra,
      custo_compra: custoCompra,
      custos_extras: custosExtras.filter((c) => c.label.trim() !== ''),
      dias_planejados: diasPlanejados ? Number(diasPlanejados) : null,
      condicao,
      observacoes: observacoes || null,
    }

    const categoria = categorias.find((c) => c.id === categoriaId) ?? null
    const fornecedor = fornecedores.find((f) => f.id === fornecedorId) ?? null

    const { error } = await onSubmit(input, categoria, fornecedor)
    setSubmitting(false)
    if (error) setError(error)
    else onClose()
  }

  return (
    <Modal title={itemInicial ? 'Editar item' : 'Novo item'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Produto">
          <input
            type="text"
            required
            autoFocus
            placeholder="Ex.: Capa transparente iPhone 13"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Categoria">
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={inputClass}>
              <option value="">— nenhuma —</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Condição">
            <select value={condicao} onChange={(e) => setCondicao(e.target.value as CondicaoItem)} className={inputClass}>
              <option value="novo">Novo</option>
              <option value="usado">Usado</option>
            </select>
          </Field>
        </div>

        <Field label="Fornecedor">
          <select value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)} className={inputClass}>
            <option value="">— nenhum —</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Data da compra">
            <input
              type="date"
              required
              value={dataCompra}
              onChange={(e) => setDataCompra(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Custo de compra (R$)">
            <input
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={custoCompra}
              onChange={(e) => setCustoCompra(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Despesas com este item</span>
            <button
              type="button"
              onClick={adicionarCustoExtra}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
            >
              <IconPlus className="h-3.5 w-3.5" /> adicionar
            </button>
          </div>
          {custosExtras.length === 0 && (
            <p className="text-xs text-slate-400">Frete, embalagem, taxas — o que mais custou pra ter esse item.</p>
          )}
          <div className="space-y-2">
            {custosExtras.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex.: Frete"
                  value={c.label}
                  onChange={(e) => atualizarCustoExtra(i, 'label', e.target.value)}
                  className={inputClass}
                />
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  inputMode="decimal"
                  placeholder="R$"
                  value={c.valor}
                  onChange={(e) => atualizarCustoExtra(i, 'valor', e.target.value)}
                  className={`${inputClass} w-24! shrink-0`}
                />
                <button
                  type="button"
                  onClick={() => removerCustoExtra(i)}
                  className="shrink-0 self-center rounded-md p-1.5 text-lg leading-none text-slate-400 transition-colors hover:bg-slate-100 hover:text-loss"
                  aria-label="Remover despesa"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <Field label="Quantos dias você quer ficar com ele até vender">
          <input
            type="number"
            min={1}
            step={1}
            placeholder="Opcional"
            value={diasPlanejados}
            onChange={(e) => setDiasPlanejados(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Observações">
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className={inputClass} rows={2} />
        </Field>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
          <span>Custo total do item</span>
          <strong className="tabular-nums text-slate-900">{formatBRL(custoTotal)}</strong>
        </div>

        {error && <ErrorMessage message={error} />}

        <Button type="submit" variant="primary" fullWidth disabled={submitting}>
          {submitting ? 'Salvando…' : itemInicial ? 'Salvar alterações' : 'Salvar item'}
        </Button>
      </form>
    </Modal>
  )
}
