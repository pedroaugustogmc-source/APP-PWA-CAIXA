import { useState, type FormEvent } from 'react'
import { usePlataformas } from '../hooks/usePlataformas'
import { inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { Button } from './Button'
import { Card } from './Card'
import { formatPercent } from '../lib/format'

export function PlataformasManager() {
  const { plataformas, criar, remover, error } = usePlataformas()
  const [nome, setNome] = useState('')
  const [taxaPct, setTaxaPct] = useState(0)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    const { error } = await criar({ nome: nome.trim(), taxa_padrao_pct: taxaPct / 100 })
    if (!error) {
      setNome('')
      setTaxaPct(0)
    }
  }

  return (
    <Card as="section">
      <h3 className="mb-3 font-semibold text-slate-900">Plataformas de venda</h3>
      <ul className="mb-3 space-y-1.5">
        {plataformas.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-700">
              {p.nome} <span className="text-slate-400">· taxa {formatPercent(p.taxa_padrao_pct, 1)}</span>
            </span>
            <button
              type="button"
              onClick={() => remover(p.id)}
              className="text-slate-400 transition-colors hover:text-loss"
              aria-label={`Remover ${p.nome}`}
            >
              ×
            </button>
          </li>
        ))}
        {plataformas.length === 0 && <li className="text-sm text-slate-400">Nenhuma plataforma ainda.</li>}
      </ul>
      {error && <ErrorMessage message={error} />}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Ex.: Mercado Livre"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={inputClass}
        />
        <input
          type="number"
          min={0}
          max={99}
          step={0.01}
          inputMode="decimal"
          placeholder="Taxa %"
          value={taxaPct}
          onChange={(e) => setTaxaPct(Number(e.target.value))}
          className={`${inputClass} w-24 shrink-0`}
        />
        <Button type="submit" variant="primary" className="shrink-0">
          Adicionar
        </Button>
      </form>
    </Card>
  )
}
