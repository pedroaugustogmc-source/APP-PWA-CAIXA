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
 * Captado no escopo do módulo, não dentro do componente: beforeinstallprompt
 * pode disparar assim que o navegador termina de avaliar a instalabilidade,
 * o que às vezes acontece antes do React montar e o useEffect de um
 * componente registrar seu listener — nesse caso o evento se perderia pra
 * sempre (só dispara uma vez por carregamento de página) e a pessoa veria a
 * instrução manual à toa, mesmo o navegador oferecendo o fluxo de um clique.
 * Como este módulo roda assim que é importado — bem antes de qualquer
 * efeito de componente — captura o evento o quanto antes der.
 */
let eventoCapturado: BeforeInstallPromptEvent | null = null
const ouvintes = new Set<(e: BeforeInstallPromptEvent | null) => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    eventoCapturado = e as BeforeInstallPromptEvent
    ouvintes.forEach((ouvinte) => ouvinte(eventoCapturado))
  })
  window.addEventListener('appinstalled', () => {
    eventoCapturado = null
    ouvintes.forEach((ouvinte) => ouvinte(null))
  })
}

const ERRO_PADRAO = 'Não foi possível abrir a instalação. Tente de novo ou use o menu do navegador.'

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(eventoCapturado)
  const [instalado, setInstalado] = useState(isStandalone())
  // Guarda contra clique duplo: prompt() só pode ser chamado uma vez por
  // evento — um 2º clique antes do re-render (que esconde o botão) rejeitaria
  // com DOMException, e sem isso essa falha nunca chegaria no usuário.
  const emAndamento = useRef(false)

  useEffect(() => {
    // o módulo pode ter capturado o evento entre o render inicial deste
    // componente e este efeito rodar — resincroniza pra não perder essa janela.
    setPromptEvent(eventoCapturado)

    function aoMudar(e: BeforeInstallPromptEvent | null) {
      setPromptEvent(e)
      if (e === null) setInstalado(true)
    }
    ouvintes.add(aoMudar)
    return () => {
      ouvintes.delete(aoMudar)
    }
  }, [])

  async function instalar(): Promise<{ error: string | null }> {
    if (!promptEvent || emAndamento.current) return { error: null }
    emAndamento.current = true
    try {
      await promptEvent.prompt()
      const { outcome } = await promptEvent.userChoice
      if (outcome === 'accepted') setInstalado(true)
      eventoCapturado = null
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
