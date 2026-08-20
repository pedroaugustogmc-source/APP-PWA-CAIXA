import type { StatusItem } from '../types/domain'

const LABELS: Record<StatusItem, string> = {
  em_estoque: 'Em estoque',
  reservado: 'Reservado',
  vendido: 'Vendido',
  perdido_danificado: 'Perdido/Danificado',
}

const CLASSES: Record<StatusItem, string> = {
  em_estoque: 'bg-slate-100 text-slate-700',
  reservado: 'bg-amber-100 text-amber-700',
  vendido: 'bg-emerald-100 text-emerald-700',
  perdido_danificado: 'bg-red-100 text-red-700',
}

export function StatusBadge({ status }: { status: StatusItem }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CLASSES[status]}`}>
      {LABELS[status]}
    </span>
  )
}
