import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { Field, inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { Button } from './Button'
import { todayISO } from '../lib/calculations'
import type { ContaReceber } from '../types/domain'
import type { ContaReceberInput } from '../hooks/useContasReceber'

interface Props {
  contaInicial?: ContaReceber | null
  onClose: () => void
  onSubmit: (input: ContaReceberInput) => Promise<{ error: string | null }>
}

export function ContaReceberFormModal({ contaInicial, onClose, onSubmit }: Props) {
  const [clienteNome, setClienteNome] = useState(contaInicial?.cliente_nome ?? '')
  const [clienteContato, setClienteContato] = useState(contaInicial?.cliente_contato ?? '')
  const [descricao, setDescricao] = useState(contaInicial?.descricao ?? '')
  const [valor, setValor] = useState(contaInicial?.valor ?? 0)
  const [dataVencimento, setDataVencimento] = useState(contaInicial?.data_vencimento ?? todayISO())
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

    const input: ContaReceberInput = {
      venda_id: contaInicial?.venda_id ?? null,
      cliente_nome: clienteNome.trim() || null,
      cliente_contato: clienteContato.trim() || null,
      descricao: descricao.trim(),
      valor,
      data_vencimento: dataVencimento,
      observacoes: observacoes.trim() || null,
    }

    const { error } = await onSubmit(input)
    setSubmitting(false)
    if (error) setError(error)
    else onClose()
  }

  return (
    <Modal title={contaInicial ? 'Editar conta a receber' : 'Nova conta a receber'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Descrição">
          <input
            type="text"
            required
            autoFocus
            placeholder="Ex.: Parcela do financiamento direto..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Nome do cliente">
            <input type="text" placeholder="Opcional" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Contato">
            <input
              type="text"
              placeholder="Opcional"
              value={clienteContato}
              onChange={(e) => setClienteContato(e.target.value)}
              className={inputClass}
            />
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
