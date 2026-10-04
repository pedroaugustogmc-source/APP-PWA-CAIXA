import { useState } from 'react'
import { useDepreciacaoModelos } from '../hooks/useDepreciacaoModelos'
import { Card } from '../components/Card'
import { Field, inputClass } from '../components/Field'
import { ErrorMessage } from '../components/ErrorMessage'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { formatBRL } from '../lib/format'
import { toMoney } from '../lib/money'
import { valorAvaliacaoDepreciacaoLinear } from '../lib/calculations'
import type { CondicaoAparelho } from '../types/domain'

const CONDICAO_LABELS: Record<CondicaoAparelho, string> = {
  novo: 'Novo',
  seminovo: 'Seminovo',
  vitrine: 'Vitrine',
  defeito: 'Com defeito',
}

export function SimuladorUpgradePage() {
  const { depreciacoes, loading, error } = useDepreciacaoModelos()

  const modelos = [...new Set(depreciacoes.map((d) => d.modelo))].sort()

  const [modelo, setModelo] = useState('')
  const [condicao, setCondicao] = useState<CondicaoAparelho>('seminovo')
  const [mesesDeUso, setMesesDeUso] = useState(0)
  const [precoAparelhoNovo, setPrecoAparelhoNovo] = useState(0)

  const regra = modelo ? depreciacoes.find((d) => d.modelo === modelo && d.condicao === condicao) : undefined

  const valorAvaliacao = regra ? valorAvaliacaoDepreciacaoLinear(regra.valor_base, regra.depreciacao_mensal_pct, mesesDeUso) : null
  const diferencaAPagar = valorAvaliacao ? toMoney(precoAparelhoNovo).minus(valorAvaliacao) : null

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-slate-900">Simulador de upgrade</h2>
      <p className="mb-4 text-sm text-slate-500">
        Estima quanto vale um aparelho usado como trade-in, pela regra de depreciação do modelo cadastrada em Ajustes.
      </p>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && depreciacoes.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">
          Nenhuma regra de depreciação cadastrada ainda. Cadastre em Ajustes pra usar o simulador.
        </p>
      )}

      {depreciacoes.length > 0 && (
        <Card className="space-y-3">
          <Field label="Modelo do aparelho usado">
            <select value={modelo} onChange={(e) => setModelo(e.target.value)} className={inputClass}>
              <option value="">Selecione</option>
              {modelos.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Condição">
            <select value={condicao} onChange={(e) => setCondicao(e.target.value as CondicaoAparelho)} className={inputClass}>
              {Object.entries(CONDICAO_LABELS).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          {modelo && !regra && (
            <p className="text-xs text-stale">Nenhuma regra de depreciação para "{modelo}" na condição "{CONDICAO_LABELS[condicao]}".</p>
          )}

          <Field label="Meses de uso">
            <input
              type="number"
              min={0}
              step={1}
              value={mesesDeUso}
              onChange={(e) => setMesesDeUso(Number(e.target.value))}
              className={inputClass}
            />
          </Field>

          <Field label="Preço do aparelho novo/alvo (R$) — opcional">
            <input
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={precoAparelhoNovo}
              onChange={(e) => setPrecoAparelhoNovo(Number(e.target.value))}
              className={inputClass}
            />
          </Field>

          {valorAvaliacao && (
            <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Valor de avaliação do trade-in</span>
                <strong className="tabular-nums text-slate-900">{formatBRL(valorAvaliacao)}</strong>
              </div>
              {precoAparelhoNovo > 0 && diferencaAPagar && (
                <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-600">Diferença a pagar pelo novo</span>
                  <strong className="tabular-nums text-slate-900">{formatBRL(diferencaAPagar)}</strong>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
