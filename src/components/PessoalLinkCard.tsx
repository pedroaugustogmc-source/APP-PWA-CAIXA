import { Link } from 'react-router-dom'
import { useFontesRenda, valorVigente } from '../hooks/useFontesRenda'
import { Card, CardLabel } from './Card'
import { formatBRL } from '../lib/format'
import { IconWallet } from './icons'

export function PessoalLinkCard() {
  const { fontes, loading } = useFontesRenda()
  const hoje = new Date().toISOString().slice(0, 10)
  const totalMensal = fontes
    .filter((f) => f.frequencia === 'mensal' && (!f.data_fim || f.data_fim >= hoje))
    .reduce((acc, f) => acc + (valorVigente(f.valores)?.valor_liquido_esperado ?? 0), 0)

  return (
    <Card as="section">
      <CardLabel>
        <IconWallet className="h-4 w-4" /> Minha vida financeira
      </CardLabel>
      <p className="mb-3 text-xs text-slate-500">
        Fontes de renda, checklist de mesada e carteiras de investimento — à parte do financeiro da loja, só você vê.
      </p>
      {!loading && fontes.length > 0 && (
        <p className="mb-3 text-sm text-slate-700">
          Renda mensal ativa: <span className="font-semibold tabular-nums text-slate-900">{formatBRL(totalMensal)}</span>
        </p>
      )}
      <Link
        to="/pessoal/renda"
        className="block rounded-lg bg-brand px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
      >
        Abrir
      </Link>
    </Card>
  )
}
