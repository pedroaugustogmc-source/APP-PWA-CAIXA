import { useMemo, useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { Field, inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { Button } from './Button'
import { precoMinimo, todayISO } from '../lib/calculations'
import { formatBRL } from '../lib/format'
import type { VendaInput } from '../hooks/useItens'

interface Props {
  custoTotal: number
  vendaInicial?: VendaInput | null
  onClose: () => void
  onSubmit: (input: VendaInput) => Promise<{ error: string | null }>
}

export function VendaModal({ custoTotal, vendaInicial, onClose, onSubmit }: Props) {
  const [precoVenda, setPrecoVenda] = useState(vendaInicial?.preco_venda ?? 0)
  const [taxaPct, setTaxaPct] = useState(vendaInicial ? vendaInicial.taxa_plataforma_pct * 100 : 0)
  const [dataVenda, setDataVenda] = useState(vendaInicial?.data_venda ?? todayISO())
  const [confirmaPrejuizo, setConfirmaPrejuizo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const precoMin = useMemo(() => precoMinimo(custoTotal, taxaPct / 100), [custoTotal, taxaPct])
  const abaixoDoMinimo = precoVenda > 0 && precoVenda < precoMin

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (abaixoDoMinimo && !confirmaPrejuizo) {
      setError('Confirme que está ciente da venda abaixo do preço mínimo.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error } = await onSubmit({
      preco_venda: precoVenda,
      plataforma_id: null,
      taxa_plataforma_pct: taxaPct / 100,
      data_venda: dataVenda,
    })
    setSubmitting(false)
    if (error) setError(error)
    else onClose()
  }

  return (
    <Modal title={vendaInicial ? 'Editar venda' : 'Registrar venda'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
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

        <p className="text-xs text-slate-500">
          Preço mínimo (break-even): <span className="font-medium tabular-nums text-slate-700">{formatBRL(precoMin)}</span>
        </p>

        {abaixoDoMinimo && (
          <div className="space-y-2 rounded-lg border border-loss/30 bg-loss/5 px-3 py-2.5">
            <p className="text-sm font-medium text-loss">Essa venda fica abaixo do preço mínimo e vai dar prejuízo.</p>
            <label className="flex items-center gap-2 text-sm text-red-700">
              <input
                type="checkbox"
                checked={confirmaPrejuizo}
                onChange={(e) => setConfirmaPrejuizo(e.target.checked)}
                className="accent-loss"
              />
              Confirmo que quero vender mesmo assim.
            </label>
          </div>
        )}

        {error && <ErrorMessage message={error} />}

        <Button type="submit" variant="primary" fullWidth disabled={submitting}>
          {submitting ? 'Salvando…' : vendaInicial ? 'Salvar alterações' : 'Confirmar venda'}
        </Button>
      </form>
    </Modal>
  )
}
