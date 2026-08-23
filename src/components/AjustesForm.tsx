import { useEffect, useState, type FormEvent } from 'react'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import { Field, inputClass } from './Field'
import { ErrorMessage } from './ErrorMessage'
import { Button } from './Button'
import { Card } from './Card'

export function AjustesForm() {
  const { config, salvar, loading } = useConfiguracoes()
  const [margemAlvo, setMargemAlvo] = useState(40)
  const [metaMensal, setMetaMensal] = useState(0)
  const [diasAlerta, setDiasAlerta] = useState(30)
  const [error, setError] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    setMargemAlvo(config.margem_alvo_pct * 100)
    setMetaMensal(config.meta_mensal_lucro)
    setDiasAlerta(config.dias_estoque_parado_alerta)
  }, [config])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setError(null)
    setSalvo(false)
    const { error } = await salvar({
      margem_alvo_pct: margemAlvo / 100,
      meta_mensal_lucro: metaMensal,
      dias_estoque_parado_alerta: diasAlerta,
    })
    setSalvando(false)
    if (error) setError(error)
    else setSalvo(true)
  }

  if (loading) return null

  return (
    <Card as="section">
      <h3 className="mb-3 font-semibold text-slate-900">Preferências</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Margem alvo do motor de precificação (%)">
          <input
            type="number"
            min={0}
            max={99}
            step={1}
            value={margemAlvo}
            onChange={(e) => setMargemAlvo(Number(e.target.value))}
            className={inputClass}
          />
        </Field>

        <Field label="Meta mensal de lucro (R$)">
          <input
            type="number"
            min={0}
            step={0.01}
            inputMode="decimal"
            value={metaMensal}
            onChange={(e) => setMetaMensal(Number(e.target.value))}
            className={inputClass}
          />
        </Field>

        <Field label="Prazo padrão pra considerar um item parado (dias)">
          <input
            type="number"
            min={1}
            step={1}
            value={diasAlerta}
            onChange={(e) => setDiasAlerta(Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <p className="-mt-2 text-xs text-slate-400">Vale só pra itens sem prazo próprio definido no cadastro.</p>

        {error && <ErrorMessage message={error} />}
        {salvo && <p className="text-sm font-medium text-profit">Salvo.</p>}

        <Button type="submit" variant="primary" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar preferências'}
        </Button>
      </form>
    </Card>
  )
}
