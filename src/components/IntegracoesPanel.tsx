import { PROVIDERS_INFO } from '../lib/providers'
import { Card } from './Card'

export function IntegracoesPanel() {
  return (
    <Card as="section">
      <h3 className="mb-1 font-semibold text-slate-900">Integrações</h3>
      <p className="mb-3 text-xs text-slate-500">
        Conexões com serviços de terceiros. Nenhuma está ativa ainda — fale com o suporte PHONEITZ pra contratar e habilitar.
      </p>
      <ul className="space-y-2">
        {PROVIDERS_INFO.map((provider) => (
          <li key={provider.chave} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{provider.nome}</p>
              <p className="text-xs text-slate-500">{provider.descricao}</p>
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
              Não configurado
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
