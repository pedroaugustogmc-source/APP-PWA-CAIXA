import { formatBRL } from '../../lib/format'

interface Props {
  lucroSemana: number
  metaSemanal: number
}

export function MetaSemanalCard({ lucroSemana, metaSemanal }: Props) {
  const progresso = metaSemanal > 0 ? lucroSemana / metaSemanal : null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">Lucro da semana</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{formatBRL(lucroSemana)}</p>

      {progresso !== null ? (
        <>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${lucroSemana >= 0 ? 'bg-profit' : 'bg-loss'}`}
              style={{ width: `${Math.min(100, Math.max(0, progresso * 100))}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Meta de {formatBRL(metaSemanal)} · {(progresso * 100).toFixed(0)}% alcançado
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs text-slate-400">Defina uma meta semanal em Ajustes pra acompanhar o progresso.</p>
      )}
    </div>
  )
}
