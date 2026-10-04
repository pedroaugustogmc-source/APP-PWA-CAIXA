import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { Field, inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { Button } from './Button'
import { todayISO } from '../lib/calculations'
import type { ContaPagar, Fornecedor } from '../types/domain'
import type { ContaPagarInput } from '../hooks/useContasPagar'

interface Props {
  fornecedores: Fornecedor[]
  contaInicial?: ContaPagar | null
  onClose: () => void
  onSubmit: (input: ContaPagarInput) => Promise<{ error: string | null }>
}

export function ContaPagarFormModal({ fornecedores, contaInicial, onClose, onSubmit }: Props) {
  const [descricao, setDescricao] = useState(contaInicial?.descricao ?? '')
  const [categoria, setCategoria] = useState(contaInicial?.categoria ?? '')
  const [fornecedorId, setFornecedorId] = useState(contaInicial?.fornecedor_id ?? '')
  const [valor, setValor] = useState(contaInicial?.valor ?? 0)
  const [dataVencimento, setDataVencimento] = useState(contaInicial?.data_vencimento ?? todayISO())
  const [recorrente, setRecorrente] = useState(contaInicial?.recorrente ?? false)
  const [observacoes, setObservacoes] = useState(contaInicial?.observacoes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!descricao.trim()) {
      setError('Descreva a conta.')
      return
    }
    if (valor <= 0) {
      setError('Informe um valor maior que zero.')
      return
    }
    setSubmitting(true)
    setError(null)

    const input: ContaPagarInput = {
      fornecedor_id: fornecedorId || null,
      descricao: descricao.trim(),
      categoria: categoria.trim() || null,
      valor,
      data_vencimento: dataVencimento,
      recorrente,
      observacoes: observacoes.trim() || null,
    }

    const { error } = await onSubmit(input)
    setSubmitting(false)
    if (error) setError(error)
    else onClose()
  }

  return (
    <Modal title={contaInicial ? 'Editar conta a pagar' : 'Nova conta a pagar'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Descrição">
          <input
            type="text"
            required
            autoFocus
            placeholder="Ex.: Aluguel, internet, fornecedor..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Categoria">
            <input
              type="text"
              placeholder="Opcional"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Fornecedor">
            <select value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)} className={inputClass}>
              <option value="">Nenhum</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Valor (R$)">
            <input
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={valor || ''}
              onChange={(e) => setValor(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Vencimento">
            <input type="date" required value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={recorrente} onChange={(e) => setRecorrente(e.target.checked)} className="h-4 w-4 accent-slate-900" />
          Despesa recorrente (repete todo mês)
        </label>

        <Field label="Observações">
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className={inputClass} rows={2} />
        </Field>

        {error && <ErrorMessage message={error} />}

        <Button type="submit" variant="primary" fullWidth disabled={submitting}>
          {submitting ? 'Salvando…' : contaInicial ? 'Salvar alterações' : 'Salvar conta'}
        </Button>
      </form>
    </Modal>
  )
}
