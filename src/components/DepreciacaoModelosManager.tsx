import { useState, type FormEvent } from 'react'
import { useDepreciacaoModelos, type DepreciacaoModeloInput } from '../hooks/useDepreciacaoModelos'
import { inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { Button } from './Button'
import { Card } from './Card'
import { todayISO } from '../lib/calculations'
import { formatBRL, formatPercent } from '../lib/format'
import type { CondicaoAparelho } from '../types/domain'

const CONDICAO_LABELS: Record<CondicaoAparelho, string> = {
  novo: 'Novo',
  seminovo: 'Seminovo',
  vitrine: 'Vitrine',
  defeito: 'Com defeito',
}

export function DepreciacaoModelosManager() {
  const { depreciacoes, criar, remover, error } = useDepreciacaoModelos()
  const [modelo, setModelo] = useState('')
  const [condicao, setCondicao] = useState<CondicaoAparelho>('seminovo')
  const [valorBase, setValorBase] = useState(0)
  const [depreciacaoMensalPct, setDepreciacaoMensalPct] = useState(0)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!modelo.trim() || valorBase <= 0) return
    const input: DepreciacaoModeloInput = {
      modelo: modelo.trim(),
      condicao,
      valor_base: valorBase,
      depreciacao_mensal_pct: depreciacaoMensalPct / 100,
      vigente_desde: todayISO(),
      observacoes: null,
    }
    const { error } = await criar(input)
    if (!error) {
      setModelo('')
      setValorBase(0)
      setDepreciacaoMensalPct(0)
    }
  }

  return (
    <Card as="section">
      <h3 className="mb-1 font-semibold text-slate-900">Depreciação de modelos</h3>
      <p className="mb-3 text-xs text-slate-400">
        Usada na sugestão de valor de trade-in ao registrar uma venda — quanto um modelo usado perde de valor por mês.
      </p>

      <ul className="mb-3 space-y-2">
        {depreciacoes.map((d) => (
          <li key={d.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <div>
              <p className="font-medium text-slate-900">
                {d.modelo} · {CONDICAO_LABELS[d.condicao]}
              </p>
              <p className="text-xs text-slate-500">
                base {formatBRL(d.valor_base)} · {formatPercent(d.depreciacao_mensal_pct, 1)}/mês
              </p>
            </div>
            <button
              type="button"
              onClick={() => remover(d.id)}
              className="rounded-md p-1.5 text-lg leading-none text-slate-400 transition-colors hover:bg-loss/10 hover:text-loss"
              aria-label={`Remover regra de ${d.modelo}`}
            >
              ×
            </button>
          </li>
        ))}
        {depreciacoes.length === 0 && <li className="text-sm text-slate-400">Nenhuma regra cadastrada ainda.</li>}
      </ul>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Modelo (ex.: iPhone 13)"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          className={`${inputClass} col-span-2`}
        />
        <select value={condicao} onChange={(e) => setCondicao(e.target.value as CondicaoAparelho)} className={inputClass}>
          {Object.entries(CONDICAO_LABELS).map(([valor, label]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          step={0.01}
          inputMode="decimal"
          placeholder="Valor base (R$)"
          value={valorBase || ''}
          onChange={(e) => setValorBase(Number(e.target.value))}
          className={inputClass}
        />
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          inputMode="decimal"
          placeholder="Depreciação mensal (%)"
          value={depreciacaoMensalPct || ''}
          onChange={(e) => setDepreciacaoMensalPct(Number(e.target.value))}
          className={`${inputClass} col-span-2`}
        />
        <Button type="submit" variant="primary" className="col-span-2">
          Adicionar regra
        </Button>
      </form>
    </Card>
  )
}
