import { formatBRL, formatPercent } from '../../lib/format'

interface Props {
  lucroMes: number
  metaMensal: number
  variacaoMesAnterior: number | null
}

export function MetaMensalCard({ lucroMes, metaMensal, variacaoMesAnterior }: Props) {
  const progresso = metaMensal > 0 ? lucroMes / metaMensal : null

  return (
    <div className="rounded-xl bg-slate-900 p-5 text-white shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-400">Lucro do mês</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{formatBRL(lucroMes)}</p>
        </div>
        {variacaoMesAnterior !== null && (
          <span
            className={`mt-1 shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
              variacaoMesAnterior < 0 ? 'bg-loss/20 text-red-300' : 'bg-profit/20 text-emerald-300'
            }`}
          >
            {variacaoMesAnterior >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(variacaoMesAnterior))}
          </span>
        )}
      </div>

      {progresso !== null ? (
        <>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${lucroMes >= 0 ? 'bg-profit' : 'bg-loss'}`}
              style={{ width: `${Math.min(100, Math.max(0, progresso * 100))}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Meta de {formatBRL(metaMensal)} · {(progresso * 100).toFixed(0)}% alcançado
          </p>
        </>
      ) : (
        <p className="mt-3 text-xs text-slate-400">Defina uma meta mensal em Ajustes pra acompanhar o progresso.</p>
      )}
    </div>
  )
}
