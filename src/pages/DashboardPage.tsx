import { useVendas } from '../hooks/useVendas'
import { useAparelhos } from '../hooks/useAparelhos'
import { useAcessorios } from '../hooks/useAcessorios'
import { useContasPagar } from '../hooks/useContasPagar'
import { useContasReceber } from '../hooks/useContasReceber'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import {
  kpiAparelhosParados,
  kpiCapitalPresoEmEstoque,
  kpiGiroEstoqueMedio,
  kpiLucro,
  kpiMargemPorModelo,
  kpiTicketMedio,
  kpiVariacaoLucroMesAnterior,
  periodoMesAtual,
  periodoSemanaAtual,
} from '../lib/dashboard'
import { kpiFluxoCaixa, resumoContas } from '../lib/financeiro'
import { KpiCard } from '../components/KpiCard'
import { RankedMargemList } from '../components/RankedMargemList'
import { MetaMensalCard } from '../components/dashboard/MetaMensalCard'
import { MetaSemanalCard } from '../components/dashboard/MetaSemanalCard'
import { Card, CardLabel } from '../components/Card'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { IconAlert } from '../components/icons'
import { formatBRL, formatDias } from '../lib/format'

export function DashboardPage() {
  const { vendas, loading: loadingVendas } = useVendas()
  const { aparelhos, loading: loadingAparelhos } = useAparelhos()
  const { acessorios, loading: loadingAcessorios } = useAcessorios()
  const { contas: contasPagar, loading: loadingContasPagar } = useContasPagar()
  const { contas: contasReceber, loading: loadingContasReceber } = useContasReceber()
  const { config, loading: loadingConfig } = useConfiguracoes()

  const loading =
    loadingVendas || loadingAparelhos || loadingAcessorios || loadingContasPagar || loadingContasReceber || loadingConfig
  if (loading) return <LoadingSpinner label="Calculando KPIs…" />

  const mesAtual = periodoMesAtual()
  const semanaAtual = periodoSemanaAtual()

  const lucroMes = kpiLucro(vendas, mesAtual)
  const lucroSemana = kpiLucro(vendas, semanaAtual)
  const lucroTotal = kpiLucro(vendas)
  const ticketMedio = kpiTicketMedio(vendas, mesAtual)
  const variacaoMesAnterior = kpiVariacaoLucroMesAnterior(vendas)
  const giroMedio = kpiGiroEstoqueMedio(vendas)
  const capital = kpiCapitalPresoEmEstoque(aparelhos, acessorios)
  const ranking = kpiMargemPorModelo(vendas)
  const parados = kpiAparelhosParados(aparelhos, config.dias_estoque_parado_alerta)
  const fluxoCaixa = kpiFluxoCaixa(vendas, contasReceber, contasPagar, mesAtual)
  const resumoPagar = resumoContas(contasPagar)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Dashboard</h2>

      <MetaMensalCard
        lucroMes={lucroMes.toNumber()}
        metaMensal={config.meta_mensal_lucro}
        variacaoMesAnterior={variacaoMesAnterior}
      />
      <MetaSemanalCard lucroSemana={lucroSemana.toNumber()} metaSemanal={config.meta_semanal_lucro} />

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Lucro total" value={formatBRL(lucroTotal)} tone="auto" />
        <KpiCard label="Ticket médio do mês" value={formatBRL(ticketMedio)} />
        <KpiCard label="Giro médio de estoque" value={formatDias(Math.round(giroMedio))} />
        <KpiCard label="Capital preso em estoque" value={formatBRL(capital.total)} />
      </div>

      <Card className="space-y-2">
        <CardLabel>Fluxo de caixa do mês</CardLabel>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Entrou</span>
          <strong className="tabular-nums text-profit">{formatBRL(fluxoCaixa.entrou)}</strong>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Saiu</span>
          <strong className="tabular-nums text-loss">{formatBRL(fluxoCaixa.saiu)}</strong>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-base">
          <span className="font-semibold text-slate-800">Saldo</span>
          <strong className={`tabular-nums ${fluxoCaixa.saldo.isNegative() ? 'text-loss' : 'text-profit'}`}>
            {formatBRL(fluxoCaixa.saldo)}
          </strong>
        </div>
      </Card>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-medium text-slate-500">Margem média por modelo/produto</p>
        <RankedMargemList itens={ranking} />
      </div>

      {parados.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <IconAlert className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm font-semibold text-amber-800">
            {parados.length} {parados.length === 1 ? 'aparelho passou' : 'aparelhos passaram'} do prazo — veja em Estoque
          </p>
        </div>
      )}

      {resumoPagar.quantidadeAtrasada > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-loss/25 bg-loss/5 p-4">
          <IconAlert className="h-4 w-4 shrink-0 text-loss" />
          <p className="text-sm font-semibold text-loss">
            {resumoPagar.quantidadeAtrasada} {resumoPagar.quantidadeAtrasada === 1 ? 'conta atrasada' : 'contas atrasadas'} pra pagar
            ({formatBRL(resumoPagar.totalAtrasado)}) — veja em Financeiro
          </p>
        </div>
      )}
    </div>
  )
}
