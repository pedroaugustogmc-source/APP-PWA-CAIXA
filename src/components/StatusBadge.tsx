import type { StatusItem } from '../types/domain'

const LABELS: Record<StatusItem, string> = {
  em_estoque: 'Em estoque',
  reservado: 'Reservado',
  vendido: 'Vendido',
  perdido_danificado: 'Perdido/Danificado',
}

const CLASSES: Record<StatusItem, string> = {
  em_estoque: 'bg-slate-100 text-slate-700',
  reservado: 'bg-stale/10 text-stale',
  vendido: 'bg-profit/10 text-profit',
  perdido_danificado: 'bg-loss/10 text-loss',
}

export function StatusBadge({ status }: { status: StatusItem }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${CLASSES[status]}`}>
      {LABELS[status]}
    </span>
  )
}
