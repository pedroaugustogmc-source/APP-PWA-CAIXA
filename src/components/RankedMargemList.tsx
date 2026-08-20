import { formatPercent } from '../lib/format'

interface RankedItem {
  key: string
  nome: string
  margem_media: number
  quantidade: number
}

export function RankedMargemList({ itens }: { itens: RankedItem[] }) {
  if (itens.length === 0) return <p className="text-sm text-slate-400">Sem vendas registradas ainda.</p>

  return (
    <ul className="space-y-1.5">
      {itens.map((item) => (
        <li key={item.key} className="flex items-center justify-between text-sm">
          <span className="text-slate-700">
            {item.nome} <span className="text-slate-400">({item.quantidade})</span>
          </span>
          <span className={`font-semibold ${item.margem_media < 0 ? 'text-loss' : 'text-profit'}`}>
            {formatPercent(item.margem_media)}
          </span>
        </li>
      ))}
    </ul>
  )
}
