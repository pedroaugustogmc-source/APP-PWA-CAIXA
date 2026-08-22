import { useItens } from '../hooks/useItens'
import { useCategorias } from '../hooks/useCategorias'
import { useFornecedores } from '../hooks/useFornecedores'
import { usePlataformas } from '../hooks/usePlataformas'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import {
  kpiAlertaEstoqueParado,
  kpiCapital,
  kpiFluxoCaixa,
  kpiGiroEstoqueMedio,
  kpiLucroNegocio,
  kpiLucroPorCategoria,
  kpiLucroPorMes,
  kpiMargemPorCategoria,
  kpiMargemPorFornecedor,
  kpiMargemPorPlataforma,
  kpiPerdas,
  kpiRoiMedioGeral,
  kpiTop5MaisLucrativos,
  kpiTop5MaisParados,
  kpiVariacaoLucroMesAnterior,
  periodoMesAtual,
} from '../lib/dashboard'
import { KpiCard } from '../components/KpiCard'
import { MargemPorCategoriaList } from '../components/MargemPorCategoriaList'
import { Top5List } from '../components/Top5List'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { MetaMensalCard } from '../components/dashboard/MetaMensalCard'
import { FluxoCaixaCard } from '../components/dashboard/FluxoCaixaCard'
import { GraficosSection } from '../components/dashboard/GraficosSection'
import { RankingsSection } from '../components/dashboard/RankingsSection'
import { IconAlert } from '../components/icons'
import { formatBRL, formatDias } from '../lib/format'

export function DashboardPage() {
  const { itens, loading } = useItens()
  const { categorias } = useCategorias()
  const { fornecedores } = useFornecedores()
  const { plataformas } = usePlataformas()
  const { config } = useConfiguracoes()

  if (loading) return <LoadingSpinner label="Calculando KPIs…" />

  const mesAtual = periodoMesAtual()
  const lucroTotal = kpiLucroNegocio(itens)
  const lucroMes = kpiLucroNegocio(itens, mesAtual)
  const margemPorCategoria = kpiMargemPorCategoria(itens, categorias)
  const giroMedio = kpiGiroEstoqueMedio(itens)
  const capital = kpiCapital(itens)
  const roiMedio = kpiRoiMedioGeral(itens)
  const top5Lucrativos = kpiTop5MaisLucrativos(itens)
  const top5Parados = kpiTop5MaisParados(itens)
  const alerta = kpiAlertaEstoqueParado(itens, config.dias_estoque_parado_alerta)
  const fluxo = kpiFluxoCaixa(itens, mesAtual)
  const variacaoMesAnterior = kpiVariacaoLucroMesAnterior(itens)

  const lucroPorMes = kpiLucroPorMes(itens)
  const lucroPorCategoria = kpiLucroPorCategoria(itens, categorias)
  const porPlataforma = kpiMargemPorPlataforma(itens, plataformas)
  const porFornecedor = kpiMargemPorFornecedor(itens, fornecedores)
  const perdas = kpiPerdas(itens, mesAtual)

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

      <MetaMensalCard lucroMes={lucroMes} metaMensal={config.meta_mensal_lucro} variacaoMesAnterior={variacaoMesAnterior} />

      <FluxoCaixaCard fluxo={fluxo} />

      <GraficosSection lucroPorMes={lucroPorMes} lucroPorCategoria={lucroPorCategoria} capital={capital} />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-medium text-slate-500">Margem média por categoria</p>
        <MargemPorCategoriaList dados={margemPorCategoria} />
      </div>

      <RankingsSection porPlataforma={porPlataforma} porFornecedor={porFornecedor} perdas={perdas} />

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
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <IconAlert className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm font-semibold text-amber-800">
            {alerta.length} {alerta.length === 1 ? 'item passou do prazo' : 'itens passaram do prazo'} — veja em Itens
          </p>
        </div>
      )}
    </div>
  )
}
