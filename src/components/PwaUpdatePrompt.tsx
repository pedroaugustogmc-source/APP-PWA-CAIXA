import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * registerType: 'autoUpdate' — versão nova aplica sozinha assim que
 * detectada, sem esperar o usuário notar e clicar num banner (o modo
 * 'prompt' anterior tinha um botão "Depois" que, uma vez clicado, deixava a
 * pessoa presa numa versão antiga até o próximo deploy — o usuário real
 * relatou estar vendo correções que já tinham sido publicadas há tempo).
 */
export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (needRefresh) void updateServiceWorker(true)
  }, [needRefresh, updateServiceWorker])

  if (!offlineReady) return null

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 flex items-center justify-between gap-3 rounded-xl bg-emerald-700 px-4 py-3 text-white shadow-lg">
      <span className="text-sm">Pronto para uso offline (somente leitura).</span>
      <button type="button" onClick={() => setOfflineReady(false)} className="text-xs text-emerald-100">
        Ok
      </button>
    </div>
  )
}
