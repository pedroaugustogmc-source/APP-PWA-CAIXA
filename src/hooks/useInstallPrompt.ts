import { useEffect, useRef, useState } from 'react'

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
const ERRO_PADRAO = 'Não foi possível abrir a instalação. Tente de novo ou use o menu do navegador.'

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [instalado, setInstalado] = useState(isStandalone())
  // Guarda contra clique duplo: prompt() só pode ser chamado uma vez por
  // evento — um 2º clique antes do re-render (que esconde o botão) rejeitaria
  // com DOMException, e sem isso essa falha nunca chegaria no usuário.
  const emAndamento = useRef(false)

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

  async function instalar(): Promise<{ error: string | null }> {
    if (!promptEvent || emAndamento.current) return { error: null }
    emAndamento.current = true
    try {
      await promptEvent.prompt()
      const { outcome } = await promptEvent.userChoice
      if (outcome === 'accepted') setInstalado(true)
      setPromptEvent(null)
      return { error: null }
    } catch {
      return { error: ERRO_PADRAO }
    } finally {
      emAndamento.current = false
    }
  }

  return { disponivel: promptEvent !== null && !instalado, instalado, instalar }
}
