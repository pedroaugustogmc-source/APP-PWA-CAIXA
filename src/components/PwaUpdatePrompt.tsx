import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * registerType: 'prompt' não troca a versão sozinha — o usuário decide quando
 * atualizar, para não perder um formulário aberto no meio da troca.
 */
export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh && !offlineReady) return null

  if (needRefresh) {
    return (
      <div className="fixed inset-x-4 bottom-20 z-50 flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-lg">
        <span className="text-sm">Nova versão disponível.</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setNeedRefresh(false)}
            className="rounded-lg px-2 py-1 text-xs text-slate-300"
          >
            Depois
          </button>
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-slate-900"
          >
            Atualizar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 flex items-center justify-between gap-3 rounded-xl bg-emerald-700 px-4 py-3 text-white shadow-lg">
      <span className="text-sm">Pronto para uso offline (somente leitura).</span>
      <button type="button" onClick={() => setOfflineReady(false)} className="text-xs text-emerald-100">
        Ok
      </button>
    </div>
  )
}
