import { useItens } from '../hooks/useItens'
import { useDespesas } from '../hooks/useDespesas'
import { useLotes } from '../hooks/useLotes'
import { useCategorias } from '../hooks/useCategorias'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import {
  kpiAlertaEstoqueParado,
  kpiCapital,
  kpiFluxoCaixa,
  kpiGiroEstoqueMedio,
  kpiLucroNegocio,
  kpiMargemPorCategoria,
  kpiRoiMedioGeral,
  kpiTop5MaisLucrativos,
  kpiTop5MaisParados,
  periodoMesAtual,
} from '../lib/dashboard'
import { KpiCard } from '../components/KpiCard'
import { MargemPorCategoriaList } from '../components/MargemPorCategoriaList'
import { Top5List } from '../components/Top5List'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { formatBRL, formatDias } from '../lib/format'

export function DashboardPage() {
  const { itens, loading: loadingItens } = useItens()
  const { despesas, loading: loadingDespesas } = useDespesas()
  const { lotes, loading: loadingLotes } = useLotes()
  const { categorias } = useCategorias()
  const { config } = useConfiguracoes()

  const loading = loadingItens || loadingDespesas || loadingLotes
  if (loading) return <LoadingSpinner label="Calculando KPIs…" />

  const mesAtual = periodoMesAtual()
  const lucroTotal = kpiLucroNegocio(itens, despesas)
  const lucroMes = kpiLucroNegocio(itens, despesas, mesAtual)
  const margemPorCategoria = kpiMargemPorCategoria(itens, categorias)
  const giroMedio = kpiGiroEstoqueMedio(itens)
  const capital = kpiCapital(lotes, itens)
  const roiMedio = kpiRoiMedioGeral(itens)
  const top5Lucrativos = kpiTop5MaisLucrativos(itens)
  const top5Parados = kpiTop5MaisParados(itens)
  const alerta = kpiAlertaEstoqueParado(itens, config.dias_estoque_parado_alerta)
  const fluxo = kpiFluxoCaixa(itens, despesas, lotes, mesAtual)
  const progressoMeta = config.meta_mensal_lucro > 0 ? lucroMes / config.meta_mensal_lucro : null

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Dashboard</h2>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Lucro do mês" value={formatBRL(lucroMes)} tone="auto" />
        <KpiCard label="Lucro total" value={formatBRL(lucroTotal)} tone="auto" />
        <KpiCard label="Giro médio de estoque" value={formatDias(Math.round(giroMedio))} />
        <KpiCard label="ROI médio geral" value={`${(roiMedio * 100).toFixed(0)}%`} tone="auto" />
        <KpiCard label="Capital investido" value={formatBRL(capital.investido_total)} />
        <KpiCard label="Capital preso em estoque" value={formatBRL(capital.preso_em_estoque)} />
      </div>

      {progressoMeta !== null && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs font-medium text-slate-500">Meta mensal de lucro</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full ${lucroMes >= 0 ? 'bg-profit' : 'bg-loss'}`}
              style={{ width: `${Math.min(100, Math.max(0, progressoMeta * 100))}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {formatBRL(lucroMes)} de {formatBRL(config.meta_mensal_lucro)} ({(progressoMeta * 100).toFixed(0)}%)
          </p>
        </div>
      )}

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

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-medium text-slate-500">Margem média por categoria</p>
        <MargemPorCategoriaList dados={margemPorCategoria} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium text-slate-500">Top 5 mais lucrativos</p>
          <Top5List itens={top5Lucrativos} modo="lucro" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium text-slate-500">Top 5 mais parados</p>
          <Top5List itens={top5Parados} modo="parado" />
        </div>
      </div>

      {alerta.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            ⚠ {alerta.length} {alerta.length === 1 ? 'item parado' : 'itens parados'} há mais de{' '}
            {config.dias_estoque_parado_alerta} dias
          </p>
        </div>
      )}
    </div>
  )
}
