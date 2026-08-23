import type { ReactNode } from 'react'

export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 transition-colors placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50 disabled:text-slate-400'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}
