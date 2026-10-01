import type { StatusAparelho } from '../types/domain'

const LABELS: Record<StatusAparelho, string> = {
  em_estoque: 'Em estoque',
  reservado: 'Reservado',
  vendido: 'Vendido',
  devolvido: 'Devolvido',
  baixado: 'Baixado',
}

const CLASSES: Record<StatusAparelho, string> = {
  em_estoque: 'bg-slate-100 text-slate-700',
  reservado: 'bg-stale/10 text-stale',
  vendido: 'bg-profit/10 text-profit',
  devolvido: 'bg-amber-100 text-amber-700',
  baixado: 'bg-loss/10 text-loss',
}

export function StatusBadge({ status }: { status: StatusAparelho }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${CLASSES[status]}`}>
      {LABELS[status]}
    </span>
  )
}
