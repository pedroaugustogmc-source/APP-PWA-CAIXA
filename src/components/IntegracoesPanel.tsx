import { PROVIDERS_INFO } from '../lib/providers'
import { Card } from './Card'

export function IntegracoesPanel() {
  return (
    <Card as="section">
      <h3 className="mb-1 font-semibold text-slate-900">Integrações extras</h3>
      <p className="mb-3 text-xs text-slate-500">
        Recursos opcionais que conectam o PHONEITZ a serviços externos (emissor de nota fiscal, bureau de crédito, etc.).
        Tudo o que você precisa pra operar a loja — estoque, vendas, financeiro — já funciona sem nenhum deles. Ative só
        quando fizer sentido pro seu negócio.
      </p>
      <ul className="space-y-2">
        {PROVIDERS_INFO.map((provider) => (
          <li key={provider.chave} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{provider.nome}</p>
              <p className="text-xs text-slate-500">{provider.descricao}</p>
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
              Disponível sob consulta
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
