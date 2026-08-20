import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { Field, inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { todayISO } from '../lib/calculations'
import type { CategoriaDespesaTipo } from '../types/domain'
import type { DespesaInput } from '../hooks/useDespesas'

const CATEGORIAS: { value: CategoriaDespesaTipo; label: string }[] = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'embalagem_geral', label: 'Embalagem geral' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'taxas', label: 'Taxas' },
  { value: 'outros', label: 'Outros' },
]

interface Props {
  onClose: () => void
  onSubmit: (input: DespesaInput) => Promise<{ error: string | null }>
}

export function DespesaFormModal({ onClose, onSubmit }: Props) {
  const [data, setData] = useState(todayISO())
  const [categoria, setCategoria] = useState<CategoriaDespesaTipo>('outros')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await onSubmit({ data, categoria_despesa: categoria, descricao: descricao || null, valor })
    setSubmitting(false)
    if (error) setError(error)
    else onClose()
  }

  return (
    <Modal title="Nova despesa geral" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Data">
          <input type="date" required value={data} onChange={(e) => setData(e.target.value)} className={inputClass} />
        </Field>

        <Field label="Categoria">
          <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaDespesaTipo)} className={inputClass}>
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Descrição">
          <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} className={inputClass} />
        </Field>

        <Field label="Valor (R$)">
          <input
            type="number"
            min={0}
            step={0.01}
            inputMode="decimal"
            required
            value={valor}
            onChange={(e) => setValor(Number(e.target.value))}
            className={inputClass}
          />
        </Field>

        {error && <ErrorMessage message={error} />}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? 'Salvando…' : 'Salvar despesa'}
        </button>
      </form>
    </Modal>
  )
}
