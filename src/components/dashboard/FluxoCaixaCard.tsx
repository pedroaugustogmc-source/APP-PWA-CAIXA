import type { FluxoCaixa } from '../../lib/dashboard'
import { formatBRL } from '../../lib/format'

export function FluxoCaixaCard({ fluxo }: { fluxo: FluxoCaixa }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-xs font-medium text-slate-500">Fluxo de caixa do mês</p>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-xs text-slate-400">Entrou</p>
          <p className="font-semibold text-profit">{formatBRL(fluxo.entrou)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Saiu</p>
          <p className="font-semibold text-loss">{formatBRL(fluxo.saiu)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Saldo</p>
          <p className={`font-semibold ${fluxo.saldo < 0 ? 'text-loss' : 'text-profit'}`}>{formatBRL(fluxo.saldo)}</p>
        </div>
      </div>
    </div>
  )
}
