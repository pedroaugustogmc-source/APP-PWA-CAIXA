import { Link } from 'react-router-dom'
import { Card, CardLabel } from './Card'
import { IconWallet } from './icons'

export function PessoalLinkCard() {
  return (
    <Card as="section">
      <CardLabel>
        <IconWallet className="h-4 w-4" /> Minha vida financeira
      </CardLabel>
      <p className="mb-3 text-xs text-slate-500">
        Fontes de renda, checklist de mesada e carteiras de investimento — à parte do financeiro da loja, só você vê.
      </p>
      <Link
        to="/pessoal/renda"
        className="block rounded-lg bg-brand px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
      >
        Abrir
      </Link>
    </Card>
  )
}
