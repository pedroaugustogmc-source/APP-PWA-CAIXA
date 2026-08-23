import type { ElementType, ReactNode } from 'react'

interface Props {
  as?: ElementType
  className?: string
  children: ReactNode
}

export function Card({ as: Tag = 'div', className = '', children }: Props) {
  return <Tag className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</Tag>
}

export function CardLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-xs font-medium text-slate-500">{children}</p>
}
