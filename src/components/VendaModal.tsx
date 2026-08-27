import { useMemo, useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { Field, inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { Button } from './Button'
import { IconPlus } from './icons'
import { precoMinimo, todayISO } from '../lib/calculations'
import { formatBRL } from '../lib/format'
import type { Plataforma } from '../types/domain'
import type { PlataformaInput } from '../hooks/usePlataformas'
import type { VendaInput } from '../hooks/useItens'

interface Props {
  custoTotal: number
  plataformas: Plataforma[]
  onClose: () => void
  onSubmit: (input: VendaInput, plataforma: Plataforma) => Promise<{ error: string | null }>
  onCriarPlataforma: (input: PlataformaInput) => Promise<{ error: string | null; plataforma?: Plataforma }>
}

export function VendaModal({ custoTotal, plataformas, onClose, onSubmit, onCriarPlataforma }: Props) {
  const [plataformaId, setPlataformaId] = useState(plataformas[0]?.id ?? '')
  const [precoVenda, setPrecoVenda] = useState(0)
  const [taxaPct, setTaxaPct] = useState(plataformas[0] ? plataformas[0].taxa_padrao_pct * 100 : 0)
  const [dataVenda, setDataVenda] = useState(todayISO())
  const [confirmaPrejuizo, setConfirmaPrejuizo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [criandoPlataforma, setCriandoPlataforma] = useState(plataformas.length === 0)
  const [novaPlataformaNome, setNovaPlataformaNome] = useState('')
  const [novaPlataformaTaxa, setNovaPlataformaTaxa] = useState(0)
  const [criandoPlataformaSubmitting, setCriandoPlataformaSubmitting] = useState(false)

  const precoMin = useMemo(() => precoMinimo(custoTotal, taxaPct / 100), [custoTotal, taxaPct])
  const abaixoDoMinimo = precoVenda > 0 && precoVenda < precoMin

  function handlePlataformaChange(id: string) {
    setPlataformaId(id)
    const p = plataformas.find((item) => item.id === id)
    if (p) setTaxaPct(p.taxa_padrao_pct * 100)
  }

  async function handleCriarPlataforma() {
    if (!novaPlataformaNome.trim()) return
    setCriandoPlataformaSubmitting(true)
    setError(null)
    const { error, plataforma } = await onCriarPlataforma({
      nome: novaPlataformaNome.trim(),
      taxa_padrao_pct: novaPlataformaTaxa / 100,
    })
    setCriandoPlataformaSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    if (plataforma) {
      setPlataformaId(plataforma.id)
      setTaxaPct(plataforma.taxa_padrao_pct * 100)
    }
    setNovaPlataformaNome('')
    setNovaPlataformaTaxa(0)
    setCriandoPlataforma(false)
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
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Plataforma</span>
            {plataformas.length > 0 && (
              <button
                type="button"
                onClick={() => setCriandoPlataforma((v) => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
              >
                {criandoPlataforma ? 'cancelar' : (
                  <>
                    <IconPlus className="h-3.5 w-3.5" /> nova
                  </>
                )}
              </button>
            )}
          </div>

          {criandoPlataforma ? (
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Ex.: Mercado Livre"
                value={novaPlataformaNome}
                onChange={(e) => setNovaPlataformaNome(e.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                max={99}
                step={0.01}
                inputMode="decimal"
                placeholder="Taxa %"
                value={novaPlataformaTaxa}
                onChange={(e) => setNovaPlataformaTaxa(Number(e.target.value))}
                className={`${inputClass} w-24! shrink-0`}
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCriarPlataforma}
                disabled={criandoPlataformaSubmitting}
              >
                Salvar
              </Button>
            </div>
          ) : (
            <select value={plataformaId} onChange={(e) => handlePlataformaChange(e.target.value)} className={inputClass}>
              <option value="">— selecione —</option>
              {plataformas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          )}
        </div>

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
          {submitting ? 'Salvando…' : 'Confirmar venda'}
        </Button>
      </form>
    </Modal>
  )
}
