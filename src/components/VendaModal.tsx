import { useMemo, useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { Field, inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { precoMinimo, todayISO } from '../lib/calculations'
import { formatBRL } from '../lib/format'
import type { Plataforma } from '../types/domain'
import type { VendaInput } from '../hooks/useItens'

interface Props {
  custoTotal: number
  plataformas: Plataforma[]
  onClose: () => void
  onSubmit: (input: VendaInput, plataforma: Plataforma) => Promise<{ error: string | null }>
}

export function VendaModal({ custoTotal, plataformas, onClose, onSubmit }: Props) {
  const [plataformaId, setPlataformaId] = useState(plataformas[0]?.id ?? '')
  const [precoVenda, setPrecoVenda] = useState(0)
  const [taxaPct, setTaxaPct] = useState(plataformas[0] ? plataformas[0].taxa_padrao_pct * 100 : 0)
  const [dataVenda, setDataVenda] = useState(todayISO())
  const [confirmaPrejuizo, setConfirmaPrejuizo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const precoMin = useMemo(() => precoMinimo(custoTotal, taxaPct / 100), [custoTotal, taxaPct])
  const abaixoDoMinimo = precoVenda > 0 && precoVenda < precoMin

  function handlePlataformaChange(id: string) {
    setPlataformaId(id)
    const p = plataformas.find((item) => item.id === id)
    if (p) setTaxaPct(p.taxa_padrao_pct * 100)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const plataforma = plataformas.find((p) => p.id === plataformaId)
    if (!plataforma) {
      setError('Selecione uma plataforma.')
      return
    }
    if (abaixoDoMinimo && !confirmaPrejuizo) {
      setError('Confirme que está ciente da venda abaixo do preço mínimo.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error } = await onSubmit(
      {
        preco_venda: precoVenda,
        plataforma_id: plataformaId,
        taxa_plataforma_pct: taxaPct / 100,
        data_venda: dataVenda,
      },
      plataforma,
    )
    setSubmitting(false)
    if (error) setError(error)
    else onClose()
  }

  return (
    <Modal title="Registrar venda" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Plataforma">
          <select value={plataformaId} onChange={(e) => handlePlataformaChange(e.target.value)} className={inputClass}>
            <option value="">— selecione —</option>
            {plataformas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Preço de venda (R$)">
          <input
            type="number"
            min={0}
            step={0.01}
            inputMode="decimal"
            required
            value={precoVenda}
            onChange={(e) => setPrecoVenda(Number(e.target.value))}
            className={inputClass}
          />
        </Field>

        <Field label="Taxa da plataforma (%)">
          <input
            type="number"
            min={0}
            max={99}
            step={0.01}
            inputMode="decimal"
            required
            value={taxaPct}
            onChange={(e) => setTaxaPct(Number(e.target.value))}
            className={inputClass}
          />
        </Field>

        <Field label="Data da venda">
          <input
            type="date"
            required
            value={dataVenda}
            onChange={(e) => setDataVenda(e.target.value)}
            className={inputClass}
          />
        </Field>

        <p className="text-xs text-slate-500">Preço mínimo (break-even): {formatBRL(precoMin)}</p>

        {abaixoDoMinimo && (
          <div className="space-y-2 rounded-lg border border-loss/30 bg-red-50 px-3 py-2">
            <p className="text-sm font-medium text-loss">
              Essa venda fica abaixo do preço mínimo e vai dar prejuízo.
            </p>
            <label className="flex items-center gap-2 text-sm text-red-700">
              <input
                type="checkbox"
                checked={confirmaPrejuizo}
                onChange={(e) => setConfirmaPrejuizo(e.target.checked)}
              />
              Confirmo que quero vender mesmo assim.
            </label>
          </div>
        )}

        {error && <ErrorMessage message={error} />}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? 'Salvando…' : 'Confirmar venda'}
        </button>
      </form>
    </Modal>
  )
}
