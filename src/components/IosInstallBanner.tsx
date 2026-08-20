import { useIosInstallHint } from '../hooks/useIosInstallHint'

export function IosInstallBanner() {
  const { visible, dismiss } = useIosInstallHint()

  if (!visible) return null

  return (
    <div className="flex items-start justify-between gap-3 bg-slate-900 px-4 py-2 text-xs text-white">
      <p>
        Instale o Catira Control: toque em <strong>Compartilhar</strong> (⬆️) e depois em{' '}
        <strong>Adicionar à Tela de Início</strong>.
      </p>
      <button type="button" onClick={dismiss} className="shrink-0 text-slate-300" aria-label="Fechar aviso">
        ×
      </button>
    </div>
  )
}
