import { useNavigate } from 'react-router-dom'
import { useVendas } from '../hooks/useVendas'
import { VendaResumoCard } from '../components/vendas/VendaResumoCard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { Button } from '../components/Button'
import { IconPlus } from '../components/icons'

export function VendasPage() {
  const { vendas, loading, error } = useVendas()
  const navigate = useNavigate()

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Vendas</h2>
        <Button variant="primary" size="sm" onClick={() => navigate('/vendas/nova')}>
          <IconPlus className="h-3.5 w-3.5" /> Nova venda
        </Button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && vendas.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">Nenhuma venda registrada ainda.</p>
      )}

      <ul className="space-y-3">
        {vendas.map((venda) => (
          <VendaResumoCard key={venda.id} venda={venda} />
        ))}
      </ul>
    </div>
  )
}
