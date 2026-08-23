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
import { Card, CardLabel } from '../components/Card'
import { formatBRL, formatDias } from '../lib/format'

function SectionLabel({ children }: { children: string }) {
  return <h3 className="px-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">{children}</h3>
}

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
    <div className="space-y-5">
      <h2 className="text-lg font-bold tracking-tight text-slate-900">Dashboard</h2>

      <MetaMensalCard lucroMes={lucroMes} metaMensal={config.meta_mensal_lucro} variacaoMesAnterior={variacaoMesAnterior} />

      {alerta.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-stale/30 bg-stale/10 p-4">
          <IconAlert className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm font-semibold text-amber-800">
            {alerta.length} {alerta.length === 1 ? 'item passou do prazo' : 'itens passaram do prazo'} — veja em Itens
          </p>
        </div>
      )}

      <div className="space-y-3">
        <SectionLabel>Resumo</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="Lucro total" value={formatBRL(lucroTotal)} tone="auto" />
          <KpiCard label="ROI médio geral" value={`${(roiMedio * 100).toFixed(0)}%`} tone="auto" />
          <KpiCard label="Giro médio de estoque" value={formatDias(Math.round(giroMedio))} />
          <KpiCard label="Capital investido" value={formatBRL(capital.investido_total)} />
          <KpiCard
            label="Capital preso em estoque"
            value={formatBRL(capital.preso_em_estoque)}
            className="col-span-2"
          />
        </div>
        <FluxoCaixaCard fluxo={fluxo} />
      </div>

      <div className="space-y-3">
        <SectionLabel>Gráficos</SectionLabel>
        <GraficosSection lucroPorMes={lucroPorMes} lucroPorCategoria={lucroPorCategoria} capital={capital} />
      </div>

      <div className="space-y-3">
        <SectionLabel>Rankings</SectionLabel>
        <Card>
          <CardLabel>Margem média por categoria</CardLabel>
          <MargemPorCategoriaList dados={margemPorCategoria} />
        </Card>
        <RankingsSection porPlataforma={porPlataforma} porFornecedor={porFornecedor} perdas={perdas} />
      </div>

      <div className="space-y-3">
        <SectionLabel>Destaques</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card>
            <CardLabel>Top 5 mais lucrativos</CardLabel>
            <Top5List itens={top5Lucrativos} modo="lucro" />
          </Card>
          <Card>
            <CardLabel>Top 5 mais parados</CardLabel>
            <Top5List itens={top5Parados} modo="parado" />
          </Card>
        </div>
      </div>
    </div>
  )
}
