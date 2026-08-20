import type { CapitalKpi, LucroPorCategoria, LucroPorMes } from '../../lib/dashboard'
import { LucroMensalChart } from '../charts/LucroMensalChart'
import { LucroPorCategoriaChart } from '../charts/LucroPorCategoriaChart'
import { CapitalChart } from '../charts/CapitalChart'

interface Props {
  lucroPorMes: LucroPorMes[]
  lucroPorCategoria: LucroPorCategoria[]
  capital: CapitalKpi
}

export function GraficosSection({ lucroPorMes, lucroPorCategoria, capital }: Props) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-medium text-slate-500">Lucro mensal</p>
        <LucroMensalChart dados={lucroPorMes} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-medium text-slate-500">Lucro por categoria</p>
        <LucroPorCategoriaChart dados={lucroPorCategoria} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-medium text-slate-500">Capital investido vs. realizado</p>
        <CapitalChart capital={capital} />
      </div>
    </div>
  )
}
