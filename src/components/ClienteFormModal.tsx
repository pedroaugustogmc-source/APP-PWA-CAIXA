import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { Field, inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { Button } from './Button'
import type { Cliente } from '../types/domain'
import type { ClienteInput } from '../hooks/useClientes'

interface Props {
  clienteInicial?: Cliente | null
  onClose: () => void
  onSubmit: (input: ClienteInput) => Promise<{ error: string | null }>
}

export function ClienteFormModal({ clienteInicial, onClose, onSubmit }: Props) {
  const [nome, setNome] = useState(clienteInicial?.nome ?? '')
  const [contato, setContato] = useState(clienteInicial?.contato ?? '')
  const [cpf, setCpf] = useState(clienteInicial?.cpf ?? '')
  const [email, setEmail] = useState(clienteInicial?.email ?? '')
  const [observacoes, setObservacoes] = useState(clienteInicial?.observacoes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setError('Dê um nome pro cliente.')
      return
    }
    setSubmitting(true)
    setError(null)

    const input: ClienteInput = {
      nome: nome.trim(),
      contato: contato.trim() || null,
      cpf: cpf.trim() || null,
      email: email.trim() || null,
      observacoes: observacoes.trim() || null,
    }

    const { error } = await onSubmit(input)
    setSubmitting(false)
    if (error) setError(error)
    else onClose()
  }

  return (
    <Modal title={clienteInicial ? 'Editar cliente' : 'Novo cliente'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Nome">
          <input type="text" required autoFocus value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Contato (telefone)">
            <input type="text" placeholder="Opcional" value={contato} onChange={(e) => setContato(e.target.value)} className={inputClass} />
          </Field>
          <Field label="E-mail">
            <input type="email" placeholder="Opcional" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <Field label="CPF">
          <input type="text" placeholder="Opcional" value={cpf} onChange={(e) => setCpf(e.target.value)} className={inputClass} />
        </Field>

        <Field label="Observações">
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className={inputClass} rows={2} />
        </Field>

        {error && <ErrorMessage message={error} />}

        <Button type="submit" variant="primary" fullWidth disabled={submitting}>
          {submitting ? 'Salvando…' : clienteInicial ? 'Salvar alterações' : 'Salvar cliente'}
        </Button>
      </form>
    </Modal>
  )
}
