import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/**
 * Chrome/Edge (Windows, Mac, Linux, Android) disparam beforeinstallprompt
 * quando o manifest cumpre os critérios de instalabilidade — a gente
 * intercepta pra oferecer um botão próprio em vez do ícone discreto da
 * barra de endereço, que muita gente nunca percebe que existe. Safari e
 * Firefox não disparam esse evento (Safari tem fluxo próprio via menu
 * Arquivo; Firefox desktop não suporta instalar PWA).
 */
export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [instalado, setInstalado] = useState(isStandalone())

  useEffect(() => {
    function aoFicarDisponivel(e: Event) {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }
    function aoInstalar() {
      setInstalado(true)
      setPromptEvent(null)
    }
    window.addEventListener('beforeinstallprompt', aoFicarDisponivel)
    window.addEventListener('appinstalled', aoInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', aoFicarDisponivel)
      window.removeEventListener('appinstalled', aoInstalar)
    }
  }, [])

  async function instalar() {
    if (!promptEvent) return
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') setInstalado(true)
    setPromptEvent(null)
  }

  return { disponivel: promptEvent !== null && !instalado, instalado, instalar }
}
