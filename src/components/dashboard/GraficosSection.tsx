import type { CapitalKpi, LucroPorCategoria, LucroPorMes } from '../../lib/dashboard'
import { LucroMensalChart } from '../charts/LucroMensalChart'
import { LucroPorCategoriaChart } from '../charts/LucroPorCategoriaChart'
import { CapitalChart } from '../charts/CapitalChart'
import { Card, CardLabel } from '../Card'

interface Props {
  lucroPorMes: LucroPorMes[]
  lucroPorCategoria: LucroPorCategoria[]
  capital: CapitalKpi
}

export function GraficosSection({ lucroPorMes, lucroPorCategoria, capital }: Props) {
  return (
    <div className="space-y-3">
      <Card>
        <CardLabel>Lucro mensal</CardLabel>
        <LucroMensalChart dados={lucroPorMes} />
      </Card>

      <Card>
        <CardLabel>Lucro por categoria</CardLabel>
        <LucroPorCategoriaChart dados={lucroPorCategoria} />
      </Card>

      <Card>
        <CardLabel>Capital investido vs. realizado</CardLabel>
        <CapitalChart capital={capital} />
      </Card>
    </div>
  )
}
