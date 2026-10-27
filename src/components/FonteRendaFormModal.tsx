import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { Field, inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { Button } from './Button'
import { todayISO } from '../lib/calculations'
import type { FonteRenda, FrequenciaRenda, TipoFonteRenda } from '../types/domain'
import type { FonteRendaInput } from '../hooks/useFontesRenda'

const TIPO_LABELS: Record<TipoFonteRenda, string> = {
  salario: 'Salário',
  freelance: 'Freelance',
  aluguel: 'Aluguel',
  pro_labore: 'Pró-labore',
  comissao: 'Comissão',
  beneficio: 'Benefício',
  rendimento_extra: 'Rendimento extra',
  outro: 'Outro',
}

const FREQUENCIA_LABELS: Record<FrequenciaRenda, string> = {
  semanal: 'Semanal',
  quinzenal: 'Quinzenal',
  mensal: 'Mensal',
  anual: 'Anual',
  eventual: 'Eventual',
}

interface Props {
  fonteInicial?: FonteRenda | null
  onClose: () => void
  onSubmit: (input: FonteRendaInput, valorInicial: number) => Promise<{ error: string | null }>
}

export function FonteRendaFormModal({ fonteInicial, onClose, onSubmit }: Props) {
  const [nome, setNome] = useState(fonteInicial?.nome ?? '')
  const [tipo, setTipo] = useState<TipoFonteRenda>(fonteInicial?.tipo ?? 'outro')
  const [frequencia, setFrequencia] = useState<FrequenciaRenda>(fonteInicial?.frequencia ?? 'mensal')
  const [diaRecebimento, setDiaRecebimento] = useState(fonteInicial?.dia_recebimento ?? '')
  const [dataInicio, setDataInicio] = useState(fonteInicial?.data_inicio ?? todayISO())
  const [dataFim, setDataFim] = useState(fonteInicial?.data_fim ?? '')
  const [observacoes, setObservacoes] = useState(fonteInicial?.observacoes ?? '')
  const [valor, setValor] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setError('Dê um nome pra fonte de renda.')
      return
    }
    if (!fonteInicial && valor <= 0) {
      setError('Informe o valor esperado.')
      return
    }
    setSubmitting(true)
    setError(null)

    const input: FonteRendaInput = {
      nome: nome.trim(),
      tipo,
      frequencia,
      dia_recebimento: diaRecebimento === '' ? null : Number(diaRecebimento),
      data_inicio: dataInicio,
      data_fim: dataFim || null,
      observacoes: observacoes.trim() || null,
    }

    const { error } = await onSubmit(input, valor)
    setSubmitting(false)
    if (error) setError(error)
    else onClose()
  }

  return (
    <Modal title={fonteInicial ? 'Editar fonte de renda' : 'Nova fonte de renda'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Nome">
          <input type="text" required autoFocus value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Tipo">
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoFonteRenda)} className={inputClass}>
              {Object.entries(TIPO_LABELS).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Frequência">
            <select value={frequencia} onChange={(e) => setFrequencia(e.target.value as FrequenciaRenda)} className={inputClass}>
              {Object.entries(FREQUENCIA_LABELS).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {!fonteInicial && (
          <Field label="Valor esperado (R$)">
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
        )}

        <div className="grid grid-cols-2 gap-2">
          <Field label="Dia de recebimento">
            <input
              type="number"
              min={1}
              max={31}
              placeholder="Opcional"
              value={diaRecebimento}
              onChange={(e) => setDiaRecebimento(e.target.value === '' ? '' : Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Início">
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <Field label="Fim (se tiver prazo)">
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className={inputClass} />
        </Field>

        <Field label="Observações">
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className={inputClass} rows={2} />
        </Field>

        {error && <ErrorMessage message={error} />}

        <Button type="submit" variant="primary" fullWidth disabled={submitting}>
          {submitting ? 'Salvando…' : fonteInicial ? 'Salvar alterações' : 'Salvar fonte de renda'}
        </Button>
      </form>
    </Modal>
  )
}
