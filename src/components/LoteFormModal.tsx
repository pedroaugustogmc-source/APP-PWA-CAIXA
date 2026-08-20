import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { Field, inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { todayISO } from '../lib/calculations'
import { formatBRL } from '../lib/format'
import type { Categoria, Fornecedor } from '../types/domain'
import type { LoteInput } from '../hooks/useLotes'

interface Props {
  categorias: Categoria[]
  fornecedores: Fornecedor[]
  onClose: () => void
  onSubmit: (input: LoteInput) => Promise<{ error: string | null }>
}

export function LoteFormModal({ categorias, fornecedores, onClose, onSubmit }: Props) {
  const [form, setForm] = useState({
    data_compra: todayISO(),
    fornecedor_id: '',
    categoria_id: '',
    quantidade_comprada: 1,
    custo_produto: 0,
    custo_frete: 0,
    custo_extra: 0,
    cotacao_dolar: '',
    observacoes: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const custoTotal = form.custo_produto + form.custo_frete + form.custo_extra
  const custoUnit = form.quantidade_comprada > 0 ? custoTotal / form.quantidade_comprada : 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await onSubmit({
      data_compra: form.data_compra,
      fornecedor_id: form.fornecedor_id || null,
      categoria_id: form.categoria_id || null,
      quantidade_comprada: form.quantidade_comprada,
      custo_produto: form.custo_produto,
      custo_frete: form.custo_frete,
      custo_extra: form.custo_extra,
      cotacao_dolar: form.cotacao_dolar ? Number(form.cotacao_dolar) : null,
      observacoes: form.observacoes || null,
    })
    setSubmitting(false)
    if (error) setError(error)
    else onClose()
  }

  return (
    <Modal title="Novo lote de compra" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Data da compra">
          <input
            type="date"
            required
            value={form.data_compra}
            onChange={(e) => setForm({ ...form, data_compra: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Categoria">
          <select
            value={form.categoria_id}
            onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
            className={inputClass}
          >
            <option value="">— selecione —</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Fornecedor">
          <select
            value={form.fornecedor_id}
            onChange={(e) => setForm({ ...form, fornecedor_id: e.target.value })}
            className={inputClass}
          >
            <option value="">— selecione —</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Quantidade comprada">
          <input
            type="number"
            min={1}
            step={1}
            required
            value={form.quantidade_comprada}
            onChange={(e) => setForm({ ...form, quantidade_comprada: Number(e.target.value) })}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-3 gap-2">
          <Field label="Produto (R$)">
            <input
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={form.custo_produto}
              onChange={(e) => setForm({ ...form, custo_produto: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Frete (R$)">
            <input
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={form.custo_frete}
              onChange={(e) => setForm({ ...form, custo_frete: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Extra (R$)">
            <input
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={form.custo_extra}
              onChange={(e) => setForm({ ...form, custo_extra: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Cotação do dólar (opcional, se importado)">
          <input
            type="number"
            min={0}
            step={0.0001}
            inputMode="decimal"
            value={form.cotacao_dolar}
            onChange={(e) => setForm({ ...form, cotacao_dolar: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Observações">
          <textarea
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            className={inputClass}
            rows={2}
          />
        </Field>

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Custo total: <strong>{formatBRL(custoTotal)}</strong> · Custo unitário:{' '}
          <strong>{formatBRL(custoUnit)}</strong>
        </div>

        {error && <ErrorMessage message={error} />}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? 'Salvando…' : 'Salvar lote'}
        </button>
      </form>
    </Modal>
  )
}
