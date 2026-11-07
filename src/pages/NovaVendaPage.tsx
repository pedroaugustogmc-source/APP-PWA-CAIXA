import { useLocation, useNavigate } from 'react-router-dom'
import { useAparelhos } from '../hooks/useAparelhos'
import { useAcessorios } from '../hooks/useAcessorios'
import { useCategorias } from '../hooks/useCategorias'
import { useDepreciacaoModelos } from '../hooks/useDepreciacaoModelos'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import { useVendas } from '../hooks/useVendas'
import { NovaVendaWizard } from '../components/vendas/NovaVendaWizard'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function NovaVendaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const aparelhoInicialId = (location.state as { aparelhoId?: string } | null)?.aparelhoId
  const { aparelhos, loading: loadingAparelhos } = useAparelhos()
  const { acessorios, loading: loadingAcessorios } = useAcessorios()
  const { categorias } = useCategorias()
  const { depreciacoes } = useDepreciacaoModelos()
  const { config, loading: loadingConfig } = useConfiguracoes()
  const { concluirVenda } = useVendas()

  const loading = loadingAparelhos || loadingAcessorios || loadingConfig

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-slate-900">Nova venda</h2>

      {loading && <LoadingSpinner />}

      {!loading && (
        <NovaVendaWizard
          aparelhosDisponiveis={aparelhos.filter((a) => a.status === 'em_estoque' || a.id === aparelhoInicialId)}
          acessoriosDisponiveis={acessorios}
          categorias={categorias}
          depreciacoes={depreciacoes}
          comissaoPctPadrao={config.comissao_vendedor_pct_padrao}
          cashbackPctPadrao={config.cashback_pct_padrao}
          aparelhoInicialId={aparelhoInicialId}
          onConcluir={concluirVenda}
          onSucesso={() => navigate('/vendas')}
        />
      )}
    </div>
  )
}
