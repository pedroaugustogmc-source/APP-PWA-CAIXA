import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const INTERVALO_VERIFICACAO_MS = 60_000

/**
 * registerType: 'autoUpdate' — versão nova aplica sozinha assim que
 * detectada, sem esperar o usuário notar e clicar num banner (o modo
 * 'prompt' anterior tinha um botão "Depois" que, uma vez clicado, deixava a
 * pessoa presa numa versão antiga até o próximo deploy — o usuário real
 * relatou estar vendo correções que já tinham sido publicadas há tempo).
 *
 * "Detectada" só acontece em navegação nova por padrão (o browser confere o
 * sw.js contra o publicado só quando a página carrega) — então um app PWA
 * deixado aberto na mesma sessão, sem fechar/reabrir, nunca percebe um
 * deploy novo sozinho. onRegisteredSW poll a cada 60s resolve isso: detecta
 * e aplica a atualização mesmo com o app aberto o tempo todo.
 */
export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      setInterval(() => void registration.update(), INTERVALO_VERIFICACAO_MS)

      // Fechar e reabrir o app (ou só trocar de app e voltar) é exatamente o
      // momento em que a pessoa espera ver a versão nova — não esperar até
      // 60s de intervalo rodarem. iOS Safari em especial é conhecido por não
      // confiar só na checagem automática de navegação; forçar aqui cobre
      // esse caso igual Android/desktop.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void registration.update()
      })
    },
  })

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
