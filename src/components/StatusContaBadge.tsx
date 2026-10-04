import { isContaAtrasada } from '../lib/financeiro'
import type { StatusConta } from '../types/domain'

const LABELS: Record<StatusConta, string> = {
  pendente: 'Pendente',
  quitada: 'Quitada',
  cancelada: 'Cancelada',
}

const CLASSES: Record<StatusConta, string> = {
  pendente: 'bg-stale/10 text-stale',
  quitada: 'bg-profit/10 text-profit',
  cancelada: 'bg-slate-100 text-slate-500',
}

export function StatusContaBadge({ status, dataVencimento }: { status: StatusConta; dataVencimento: string }) {
  const atrasada = isContaAtrasada({ status, data_vencimento: dataVencimento })
  const label = atrasada ? 'Atrasada' : LABELS[status]
  const classes = atrasada ? 'bg-loss/10 text-loss' : CLASSES[status]
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${classes}`}>{label}</span>
}
