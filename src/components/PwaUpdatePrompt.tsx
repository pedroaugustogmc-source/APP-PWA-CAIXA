import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const INTERVALO_VERIFICACAO_MS = 60_000

/**
 * Trava independente do ciclo de vida do service worker: busca
 * /version.json (nunca cacheado pelo SW — não entra no precache, não bate
 * com nenhuma rota registrada em sw.ts, então sempre vai na rede de
 * verdade) e compara com o BUILD_ID gravado no próprio bundle JS que está
 * rodando agora. Se forem diferentes, essa aba está com uma versão velha do
 * JS carregada na memória — nenhuma checagem de update do service worker
 * conserta isso sozinha, só um reload de verdade.
 *
 * Existe porque o mecanismo "normal" (registerType: 'autoUpdate' + poll a
 * cada 60s + checar ao voltar a ficar visível, todos abaixo) foi relatado
 * por um usuário real, em iOS Safari instalado, como insuficiente mais de
 * uma vez — a pessoa fechava e reabria o app e continuava vendo
 * comportamento de uma versão anterior. unregister() antes do reload força
 * o navegador a reconsiderar o service worker do zero, em vez de confiar
 * que a troca de controller vai acontecer sozinha.
 */
const CHAVE_ULTIMO_RELOAD = 'phoneitz-ultimo-reload-forcado'
const COOLDOWN_RELOAD_MS = 30_000

async function checarVersaoEForcarAtualizacao() {
  try {
    const resposta = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!resposta.ok) return
    const { buildId } = (await resposta.json()) as { buildId?: string }
    if (!buildId || buildId === __BUILD_ID__) return

    // Trava de segurança contra loop infinito: se o CDN/propagação ainda não
    // terminou, version.json pode já estar na versão nova enquanto o HTML/JS
    // servido continua sendo o antigo — nesse caso, recarregar não resolve
    // nada, a página volta a carregar o mesmo JS antigo, detecta a mesma
    // divergência de novo, e recarregaria pra sempre sem parar (reproduzi
    // isso testando antes de publicar). No máximo 1 reload forçado por essa
    // trava a cada 30s; se não resolver, o próximo ciclo tenta de novo.
    const ultimoStr = sessionStorage.getItem(CHAVE_ULTIMO_RELOAD)
    const ultimo = ultimoStr ? Number(ultimoStr) : 0
    if (Date.now() - ultimo < COOLDOWN_RELOAD_MS) return
    sessionStorage.setItem(CHAVE_ULTIMO_RELOAD, String(Date.now()))

    const registros = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registros.map((r) => r.unregister()))
    window.location.reload()
  } catch {
    // Sem rede ou qualquer outra falha: não é motivo pra travar o app, só
    // não dá pra confirmar a versão agora — tenta de novo no próximo ciclo.
  }
}

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

  useEffect(() => {
    void checarVersaoEForcarAtualizacao()
    const intervalo = setInterval(() => void checarVersaoEForcarAtualizacao(), INTERVALO_VERIFICACAO_MS)
    function aoFicarVisivel() {
      if (document.visibilityState === 'visible') void checarVersaoEForcarAtualizacao()
    }
    document.addEventListener('visibilitychange', aoFicarVisivel)
    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', aoFicarVisivel)
    }
  }, [])

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
