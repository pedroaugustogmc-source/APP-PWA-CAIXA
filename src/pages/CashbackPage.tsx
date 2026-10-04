import { useState } from 'react'
import { useCashback } from '../hooks/useCashback'
import { formatBRL, formatDate } from '../lib/format'
import { FinanceiroSubNav } from '../components/FinanceiroSubNav'
import { Card, CardLabel } from '../components/Card'
import { Field, inputClass } from '../components/Field'
import { Button } from '../components/Button'
import { ErrorMessage } from '../components/ErrorMessage'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function CashbackPage() {
  const { lancamentos, loading, error, saldosPorCliente, creditar, resgatar } = useCashback()

  const [clienteContato, setClienteContato] = useState('')
  const [valor, setValor] = useState(0)
  const [observacoes, setObservacoes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleLancamento(tipo: 'credito' | 'resgate') {
    if (!clienteContato.trim() || valor <= 0) {
      setFormError('Informe o contato do cliente e um valor maior que zero.')
      return
    }
    setSubmitting(true)
    setFormError(null)
    const { error } = tipo === 'credito' ? await creditar(clienteContato.trim(), valor, observacoes.trim() || null) : await resgatar(clienteContato.trim(), valor, observacoes.trim() || null)
    setSubmitting(false)
    if (error) {
      setFormError(error)
      return
    }
    setValor(0)
    setObservacoes('')
  }

  return (
    <div>
      <FinanceiroSubNav />

      <Card className="mb-4 space-y-3">
        <CardLabel>Lançamento manual</CardLabel>
        <p className="-mt-2 text-xs text-slate-400">
          Cashback de vendas é creditado automaticamente (configure a % padrão em Ajustes). Use isto pra ajustes manuais ou resgates.
        </p>
        <div className="space-y-3">
          <Field label="Contato do cliente">
            <input
              type="text"
              placeholder="Telefone ou e-mail"
              value={clienteContato}
              onChange={(e) => setClienteContato(e.target.value)}
              className={inputClass}
            />
          </Field>
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
            <Field label="Observações">
              <input type="text" placeholder="Opcional" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className={inputClass} />
            </Field>
          </div>
          {formError && <ErrorMessage message={formError} />}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" disabled={submitting} onClick={() => handleLancamento('credito')}>
              + Creditar
            </Button>
            <Button variant="primary" disabled={submitting} onClick={() => handleLancamento('resgate')}>
              − Resgatar
            </Button>
          </div>
        </div>
      </Card>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      <Card className="mb-4">
        <CardLabel>Saldo por cliente</CardLabel>
        {saldosPorCliente.length === 0 && <p className="text-sm text-slate-400">Nenhum saldo de cashback ainda.</p>}
        <ul className="space-y-1.5">
          {saldosPorCliente.map((s) => (
            <li key={s.cliente_contato} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{s.cliente_contato}</span>
              <span className="font-semibold tabular-nums text-profit">{formatBRL(s.saldo)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardLabel>Últimos lançamentos</CardLabel>
        {lancamentos.length === 0 && <p className="text-sm text-slate-400">Nenhum lançamento ainda.</p>}
        <ul className="space-y-2">
          {lancamentos.slice(0, 30).map((l) => (
            <li key={l.id} className="flex items-center justify-between text-sm">
              <div className="min-w-0">
                <p className="truncate text-slate-700">{l.cliente_contato}</p>
                <p className="text-xs text-slate-400">
                  {formatDate(l.created_at.slice(0, 10))}
                  {l.observacoes ? ` · ${l.observacoes}` : ''}
                </p>
              </div>
              <span className={`shrink-0 font-semibold tabular-nums ${l.tipo === 'credito' ? 'text-profit' : 'text-loss'}`}>
                {l.tipo === 'credito' ? '+' : '−'}
                {formatBRL(l.valor)}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
