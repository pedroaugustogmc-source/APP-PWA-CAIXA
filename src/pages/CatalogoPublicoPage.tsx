import { useParams } from 'react-router-dom'
import { useCatalogoPublico } from '../hooks/useCatalogoPublico'
import { formatBRL } from '../lib/format'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'

const CONDICAO_LABELS: Record<string, string> = {
  novo: 'Novo',
  seminovo: 'Seminovo',
  vitrine: 'Vitrine',
  defeito: 'Com defeito',
}

export function CatalogoPublicoPage() {
  const { lojaId } = useParams<{ lojaId: string }>()
  const { itens, loading, error } = useCatalogoPublico(lojaId)
  const lojaNome = itens[0]?.loja_nome

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
            Pz
          </div>
          <h1 className="text-xl font-bold text-slate-900">{lojaNome ?? 'Catálogo'}</h1>
          <p className="mt-1 text-sm text-slate-500">Aparelhos disponíveis</p>
        </div>

        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} />}

        {!loading && !error && itens.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-400">Nenhum aparelho disponível no momento.</p>
        )}

        <ul className="space-y-3">
          {itens.map((item) => (
            <li key={item.aparelho_id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{item.nome}</p>
                  <p className="text-xs text-slate-500">
                    {item.modelo}
                    {item.cor ? ` · ${item.cor}` : ''}
                    {item.capacidade_gb ? ` · ${item.capacidade_gb}GB` : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {CONDICAO_LABELS[item.condicao] ?? item.condicao}
                    {item.bateria_saude != null ? ` · Bateria ${item.bateria_saude}%` : ''}
                  </p>
                </div>
                <strong className="shrink-0 whitespace-nowrap text-sm tabular-nums text-slate-900">
                  {formatBRL(item.preco_sugerido ?? 0)}
                </strong>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-xs text-slate-400">PHONEITZ</p>
      </div>
    </div>
  )
}
