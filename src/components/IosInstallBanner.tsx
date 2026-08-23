import { useIosInstallHint } from '../hooks/useIosInstallHint'
import { IconShare } from './icons'

export function IosInstallBanner() {
  const { visible, dismiss } = useIosInstallHint()

  if (!visible) return null

  return (
    <div className="flex items-start justify-between gap-3 bg-slate-900 px-4 py-2.5 text-xs text-white">
      <p>
        Instale o Catira Control: toque em <strong>Compartilhar</strong>{' '}
        <IconShare className="inline h-3.5 w-3.5 -translate-y-px align-middle text-slate-300" /> e depois em{' '}
        <strong>Adicionar à Tela de Início</strong>.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 text-lg leading-none text-slate-400 transition-colors hover:text-white"
        aria-label="Fechar aviso"
      >
        ×
      </button>
    </div>
  )
}
