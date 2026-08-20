import { formatBRL, formatPercent } from '../../lib/format'

interface Props {
  lucroMes: number
  metaMensal: number
  variacaoMesAnterior: number | null
}

export function MetaMensalCard({ lucroMes, metaMensal, variacaoMesAnterior }: Props) {
  const progresso = metaMensal > 0 ? lucroMes / metaMensal : null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">Meta mensal de lucro</p>
        {variacaoMesAnterior !== null && (
          <span className={`text-xs font-semibold ${variacaoMesAnterior < 0 ? 'text-loss' : 'text-profit'}`}>
            {variacaoMesAnterior >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(variacaoMesAnterior))} vs. mês anterior
          </span>
        )}
      </div>

      {progresso !== null ? (
        <>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full ${lucroMes >= 0 ? 'bg-profit' : 'bg-loss'}`}
              style={{ width: `${Math.min(100, Math.max(0, progresso * 100))}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {formatBRL(lucroMes)} de {formatBRL(metaMensal)} ({(progresso * 100).toFixed(0)}%)
          </p>
        </>
      ) : (
        <p className="text-xs text-slate-500">
          Defina uma meta mensal em Ajustes para acompanhar o progresso. Lucro do mês: {formatBRL(lucroMes)}
        </p>
      )}
    </div>
  )
}
