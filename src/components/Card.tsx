import type { ElementType, ReactNode } from 'react'

interface Props {
  as?: ElementType
  className?: string
  children: ReactNode
}

export function Card({ as: Tag = 'div', className = '', children }: Props) {
  return (
    <Tag
      className={`rounded-xl border border-slate-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_16px_-12px_rgba(15,23,42,0.12)] ${className}`}
    >
      {children}
    </Tag>
  )
}

export function CardLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
      <span className="h-3.5 w-1 shrink-0 rounded-full bg-brand" aria-hidden="true" />
      {children}
    </p>
  )
}
