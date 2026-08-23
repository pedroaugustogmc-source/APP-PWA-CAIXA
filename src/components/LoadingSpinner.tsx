export function LoadingSpinner({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-10 text-slate-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
